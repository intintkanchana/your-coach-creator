import { OAuth2Client } from 'google-auth-library';
import { CONFIG } from '../config';
import db from '../db';
import crypto from 'crypto';

const client = new OAuth2Client(CONFIG.GOOGLE_CLIENT_ID);

export interface User {
  id: number;
  google_id: string;
  email: string;
  name: string;
  session_token?: string;
}

export const authService = {
  async verifyGoogleToken(token: string) {
    // If no client ID configured yet, we might skip verification for dev or throw error
    if (!CONFIG.GOOGLE_CLIENT_ID) {
        throw new Error("GOOGLE_CLIENT_ID not configured on server");
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CONFIG.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) throw new Error('Invalid token payload');
    
    return {
      google_id: payload.sub,
      email: payload.email,
      name: payload.name || 'Unknown',
    };
  },

  loginUser: (googleUser: { google_id: string; email?: string; name: string }) => {
    const sessionToken = crypto.randomUUID();
    
    const upsertStmt = db.prepare(`
      INSERT INTO users (google_id, email, name, session_token)
      VALUES (@google_id, @email, @name, @session_token)
      ON CONFLICT(google_id) DO UPDATE SET
        session_token = @session_token,
        name = @name,
        email = COALESCE(@email, email)
      RETURNING *
    `);

    const user = upsertStmt.get({
      google_id: googleUser.google_id,
      email: googleUser.email || '',
      name: googleUser.name,
      session_token: sessionToken,
    }) as User;

    return user;
  },

  getUserByToken: (token: string): User | undefined => {
    const stmt = db.prepare('SELECT * FROM users WHERE session_token = ?');
    return stmt.get(token) as User | undefined;
  }
};
