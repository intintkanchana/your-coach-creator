import { Database } from './db/interfaces';
import { SqliteAdapter } from './db/sqlite-adapter';
import { PostgresAdapter } from './db/postgres-adapter';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

let db: Database;

const dbType = process.env.DB_TYPE || 'sqlite';

if (dbType === 'postgres') {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for postgres');
  }
  db = new PostgresAdapter(process.env.DATABASE_URL);
  console.log('Connected to PostgreSQL');
} else {
  const dbPath = process.env.DB_PATH || path.join(__dirname, '../../life-coach.db');
  db = new SqliteAdapter(dbPath);
  console.log(`Connected to SQLite at ${dbPath}`);
}

export async function initDb() {
  if (dbType === 'postgres') {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        google_id TEXT UNIQUE NOT NULL,
        email TEXT NOT NULL,
        name TEXT,
        picture TEXT,
        session_token TEXT
      );

      CREATE TABLE IF NOT EXISTS coaches (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        system_instruction TEXT NOT NULL,
        icon TEXT,
        user_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        goal TEXT,
        bio TEXT,
        vital_signs TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        coach_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role TEXT CHECK(role IN ('user', 'model')) NOT NULL,
        content TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(coach_id) REFERENCES coaches(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS trackings (
        id SERIAL PRIMARY KEY,
        coach_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        emoji TEXT,
        type TEXT,
        FOREIGN KEY(coach_id) REFERENCES coaches(id)
      );

      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        coach_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        data TEXT NOT NULL,
        feedback TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(coach_id) REFERENCES coaches(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
      );
    `);
  } else {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        google_id TEXT UNIQUE NOT NULL,
        email TEXT NOT NULL,
        name TEXT,
        picture TEXT,
        session_token TEXT
      );

      CREATE TABLE IF NOT EXISTS coaches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        system_instruction TEXT NOT NULL,
        icon TEXT,
        user_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        goal TEXT,
        bio TEXT,
        vital_signs TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        coach_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role TEXT CHECK(role IN ('user', 'model')) NOT NULL,
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(coach_id) REFERENCES coaches(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS trackings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        coach_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        emoji TEXT,
        type TEXT,
        FOREIGN KEY(coach_id) REFERENCES coaches(id)
      );

      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        coach_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        data TEXT NOT NULL,
        feedback TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(coach_id) REFERENCES coaches(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
      );
    `);
  }

  const safeAddColumn = async (table: string, column: string, definition: string) => {
    try {
      await db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
    } catch (e) {
      // Column likely already exists
    }
  };

  await safeAddColumn('coaches', 'icon', 'TEXT');
  if (dbType === 'postgres') {
    await safeAddColumn('coaches', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    await safeAddColumn('coaches', 'goal', 'TEXT');
  } else {
    await safeAddColumn('coaches', 'created_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');
    await safeAddColumn('coaches', 'goal', 'TEXT');
  }
  await safeAddColumn('coaches', 'bio', 'TEXT');
  await safeAddColumn('coaches', 'vital_signs', 'TEXT');
}

export default db;
