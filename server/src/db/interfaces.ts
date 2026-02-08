export interface Database {
  query<T = any>(sql: string, params?: any): Promise<T[]>;
  get<T = any>(sql: string, params?: any): Promise<T | undefined>;
  run(sql: string, params?: any): Promise<{ changes: number; lastInsertRowid: number | bigint }>;
  exec(sql: string): Promise<void>;
  transaction<T>(fn: (tx: Database) => Promise<T>): Promise<T>;
  prepare(sql: string): PreparedStatement;
}

export interface PreparedStatement {
  run(params?: any): Promise<{ changes: number; lastInsertRowid: number | bigint }>;
  get<T = any>(params?: any): Promise<T | undefined>;
  all<T = any>(params?: any): Promise<T[]>;
}
