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
  picture?: string;
  session_token?: string;
}

export const authService = {
  async verifyGoogleToken(token: string) {
    // With @react-oauth/google useGoogleLogin (Implicit Flow), we get an access token.
    // We need to fetch user info from Google API using this token.
    
    // Using fetch to get user info. 
    // Assuming Node environment (18+ has fetch) or need node-fetch.
    // If fetch is not available, we can use client.request if available or axios.
    // Since this is a new execution, let's try fetch.
    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch user info from Google');
        }
        
        const payload = await response.json();
        
        return {
            google_id: payload.sub,
            email: payload.email,
            name: payload.name || 'Unknown',
            picture: payload.picture
        };
    } catch (error) {
        console.error("Token verification failed", error);
        throw new Error('Invalid or expired token');
    }
  },

  loginUser: (googleUser: { google_id: string; email?: string; name: string; picture?: string }) => {
    const sessionToken = crypto.randomUUID();
    
    const upsertStmt = db.prepare(`
      INSERT INTO users (google_id, email, name, picture, session_token)
      VALUES (@google_id, @email, @name, @picture, @session_token)
      ON CONFLICT(google_id) DO UPDATE SET
        session_token = @session_token,
        name = @name,
        picture = @picture,
        email = COALESCE(@email, email)
      RETURNING *
    `);

    const user = upsertStmt.get({
      google_id: googleUser.google_id,
      email: googleUser.email || '',
      name: googleUser.name,
      picture: googleUser.picture || null,
      session_token: sessionToken,
    }) as User;

    return user;
  },

  getUserByToken: (token: string): User | undefined => {
    const stmt = db.prepare('SELECT * FROM users WHERE session_token = ?');
    return stmt.get(token) as User | undefined;
  }
};
