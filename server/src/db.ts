import Database from 'better-sqlite3';

const db = new Database('life-coach.db');
db.pragma('journal_mode = WAL');

export function initDb() {
  db.exec(`
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
  `);

  const safeAddColumn = (table: string, column: string, definition: string) => {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
    } catch (e) {
      // Column likely already exists
    }
  };

  safeAddColumn('coaches', 'icon', 'TEXT');
  safeAddColumn('coaches', 'created_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');
  safeAddColumn('coaches', 'goal', 'TEXT');
  safeAddColumn('coaches', 'bio', 'TEXT');
  safeAddColumn('coaches', 'vital_signs', 'TEXT');
}

export default db;
