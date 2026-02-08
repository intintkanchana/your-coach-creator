import DatabaseConstructor, { Database as SqliteDatabase, Statement } from 'better-sqlite3';
import { Database, PreparedStatement } from './interfaces';

export class SqliteAdapter implements Database {
  private db: SqliteDatabase;

  constructor(filename: string) {
    this.db = new DatabaseConstructor(filename);
    this.db.pragma('journal_mode = WAL');
  }

  async query<T = any>(sql: string, params?: any): Promise<T[]> {
    const stmt = this.db.prepare(sql);
    return Promise.resolve(stmt.all(params || []) as T[]);
  }

  async get<T = any>(sql: string, params?: any): Promise<T | undefined> {
    const stmt = this.db.prepare(sql);
    return Promise.resolve(stmt.get(params || []) as T | undefined);
  }

  async run(sql: string, params?: any): Promise<{ changes: number; lastInsertRowid: number | bigint }> {
    const stmt = this.db.prepare(sql);
    const result = stmt.run(params || []);
    return Promise.resolve({ changes: result.changes, lastInsertRowid: result.lastInsertRowid });
  }

  async exec(sql: string): Promise<void> {
    this.db.exec(sql);
    return Promise.resolve();
  }

  prepare(sql: string): PreparedStatement {
    const stmt = this.db.prepare(sql);
    return new SqlitePreparedStatement(stmt);
  }

  async transaction<T>(fn: (tx: Database) => Promise<T>): Promise<T> {
    const tx = this.db.transaction(() => {
        // We can't await inside better-sqlite3 transaction if it's sync. 
        // BUT, better-sqlite3 transactions are synchronous. 
        // So we need to be careful here. 
        // 
        // If the `fn` is async (which it is designed to be), we cannot run it inside `this.db.transaction(() => ...)` 
        // because `better-sqlite3` expects the callback to be synchronous.
        //
        // However, since SQLite is single-threaded and locking, we can just run the async function.
        // But better-sqlite3 exposes explicit transaction control. 
        throw new Error('Async transaction wrapper for better-sqlite3 is tricky. Use sync transaction if strictly needed or rethink.');
    });
    
    // Better-sqlite3 transactions are strictly synchronous. 
    // If we want to support async operations inside a transaction (like in Postgres),
    // we have a mismatch.
    // 
    // STRATEGY: 
    // Since we are refactoring to async for Postgres primarily, and SQLite is for local dev/testing,
    // we can implement a "fake" async transaction for SQLite that just runs the function.
    // BUT this doesn't provide atomicity if it involves multiple event loop ticks.
    //
    // ALTERNATIVE:
    // Keep transactions synchronous FOR NOW if possible? No, Postgres needs async.
    //
    // SOLUTION:
    // `better-sqlite3` DOES NOT support async transactions.
    // To support async code (for Postgres compatibility) on SQLite, we would need to manually sending BEGIN/COMMIT/ROLLBACK.
    // But better-sqlite3 warns against this if using WAL? No, it's fine.
    
    this.db.prepare('BEGIN').run();
    try {
        const result = await fn(this);
        this.db.prepare('COMMIT').run();
        return result;
    } catch (error) {
        this.db.prepare('ROLLBACK').run();
        throw error;
    }
  }
}

class SqlitePreparedStatement implements PreparedStatement {
  private stmt: Statement;

  constructor(stmt: Statement) {
    this.stmt = stmt;
  }

  async run(params?: any): Promise<{ changes: number; lastInsertRowid: number | bigint }> {
    const result = this.stmt.run(params || []);
    return Promise.resolve({ changes: result.changes, lastInsertRowid: result.lastInsertRowid });
  }

  async get<T = any>(params?: any): Promise<T | undefined> {
    return Promise.resolve(this.stmt.get(params || []) as T | undefined);
  }

  async all<T = any>(params?: any): Promise<T[]> {
    return Promise.resolve(this.stmt.all(params || []) as T[]);
  }
}
