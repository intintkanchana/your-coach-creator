import { Pool, PoolClient } from 'pg';
import { Database, PreparedStatement } from './interfaces';

export class PostgresAdapter implements Database {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
    });
  }

  private transformQuery(sql: string, params?: any): { text: string; values: any[] } {
    if (!params || typeof params !== 'object' || Array.isArray(params)) {
      // It's already an array or null, assuming ? placeholders which Postgres DOES NOT support natively (it uses $1, $2)
      // We need to convert ? to $1, $2...
      let text = sql;
      const values = Array.isArray(params) ? params : (params ? [params] : []);
      
      let index = 1;
      // Simple regex replacement for ? -> $n (ignoring ? in strings for simplicity in this MVP)
      text = text.replace(/\?/g, () => `$${index++}`);
      
      return { text, values };
    }

    // Named parameters support: @key -> $n
    // Extract keys and replace with $n
    const values: any[] = [];
    let text = sql;
    
    // Find all @param occurrences
    // We need to replace them with $1, $2 etc and build the values array in order.
    // Regex to match @word
    text = text.replace(/@(\w+)/g, (match, key) => {
      values.push(params[key]);
      return `$${values.length}`;
    });

    return { text, values };
  }

  async query<T = any>(sql: string, params?: any): Promise<T[]> {
    const { text, values } = this.transformQuery(sql, params);
    const result = await this.pool.query(text, values);
    return result.rows;
  }

  async get<T = any>(sql: string, params?: any): Promise<T | undefined> {
    const rows = await this.query<T>(sql, params);
    return rows[0];
  }

  async run(sql: string, params?: any): Promise<{ changes: number; lastInsertRowid: number | bigint }> {
    const { text, values } = this.transformQuery(sql, params);
    const result = await this.pool.query(text, values);
    // Postgres doesn't return lastInsertRowid by default unless RETURNING id is used.
    // For compatibility, we might need to adjust queries to use RETURNING * or RETURNING id.
    // changes = rowCount
    return { changes: result.rowCount || 0, lastInsertRowid: 0 }; 
  }

  async exec(sql: string): Promise<void> {
    await this.pool.query(sql);
  }

  prepare(sql: string): PreparedStatement {
    return new PostgresPreparedStatement(this, sql);
  }

  async transaction<T>(fn: (tx: Database) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const txAdapter = new PostgresTxAdapter(client, this.transformQuery.bind(this));
      const result = await fn(txAdapter);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}

class PostgresPreparedStatement implements PreparedStatement {
    private db: PostgresAdapter;
    private sql: string;

    constructor(db: PostgresAdapter, sql: string) {
        this.db = db;
        this.sql = sql;
    }

    async run(params?: any): Promise<{ changes: number; lastInsertRowid: number | bigint }> {
        return this.db.run(this.sql, params);
    }

    async get<T = any>(params?: any): Promise<T | undefined> {
        return this.db.get<T>(this.sql, params);
    }

    async all<T = any>(params?: any): Promise<T[]> {
        return this.db.query<T>(this.sql, params);
    }
}

// Helper for transaction context which binds to a specific client
class PostgresTxAdapter implements Database {
    private client: PoolClient;
    private transformQuery: (sql: string, params?: any) => { text: string; values: any[] };

    constructor(client: PoolClient, transform: (sql: string, params?: any) => { text: string; values: any[] }) {
        this.client = client;
        this.transformQuery = transform;
    }

    async query<T = any>(sql: string, params?: any): Promise<T[]> {
        const { text, values } = this.transformQuery(sql, params);
        const result = await this.client.query(text, values);
        return result.rows;
    }

    async get<T = any>(sql: string, params?: any): Promise<T | undefined> {
        const rows = await this.query<T>(sql, params);
        return rows[0];
    }

    async run(sql: string, params?: any): Promise<{ changes: number; lastInsertRowid: number | bigint }> {
        const { text, values } = this.transformQuery(sql, params);
        const result = await this.client.query(text, values);
        return { changes: result.rowCount || 0, lastInsertRowid: 0 }; 
    }

    async exec(sql: string): Promise<void> {
        await this.client.query(sql);
    }

    prepare(sql: string): PreparedStatement {
        // Return a statement bound to this TX (client)
        return {
            run: (params) => this.run(sql, params),
            get: (params) => this.get(sql, params),
            all: (params) => this.query(sql, params)
        };
    }

    async transaction<T>(fn: (tx: Database) => Promise<T>): Promise<T> {
        // Nested transactions using SAVEPOINT? For now simple nested execution.
        return fn(this);
    }
}
