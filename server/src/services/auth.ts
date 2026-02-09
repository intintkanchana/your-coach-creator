import { OAuth2Client } from 'google-auth-library';
import { CONFIG } from '../config';
import db from '../db';
import crypto from 'crypto';

const client = new OAuth2Client(CONFIG.GOOGLE_CLIENT_ID);

export interface User {
  id: number;
  google_id?: string;
  email?: string;
  name: string;
  picture?: string;
  session_token?: string;
  refresh_token?: string;
  token_expires_at?: Date | string;
}

const ACCESS_TOKEN_TTL = 60 * 60 * 1000; // 1 hour
const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

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

  loginUser: async (googleUser: { google_id: string; email?: string; name: string; picture?: string }) => {
    const sessionToken = crypto.randomUUID();
    const refreshToken = crypto.randomUUID();
    const tokenExpiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL).toISOString();
    
    // UPSERT is not standard SQL. SQLite supports it. Postgres supports it.
    // better-sqlite3 uses @params. 
    // My postgres adapter transformQuery handles @params -> $n. 
    // EXCEPT: Postgres UPSERT syntax is `ON CONFLICT (...) DO UPDATE SET ...` which is standard.
    // The syntax used here `ON CONFLICT(google_id) DO UPDATE SET ...` works in PG too.
    
    // However, I need to make sure `db.prepare` and `run` are used correctly.
    // In my interface, `run` returns { changes, lastInsertRowid }.
    // BUT here we used `RETURNING *` and `stmt.get(...)`.
    // valid for both sqlite and postgres (pg supports RETURNING).
    
    const user = await db.get<User>(`
      INSERT INTO users AS u (google_id, email, name, picture, session_token, refresh_token, token_expires_at)
      VALUES (@google_id, @user_email, @name, @picture, @session_token, @refresh_token, @token_expires_at)
      ON CONFLICT(google_id) DO UPDATE SET
        session_token = @session_token,
        refresh_token = @refresh_token,
        token_expires_at = @token_expires_at,
        name = @name,
        picture = @picture,
        email = COALESCE(NULLIF(@user_email, ''), u.email)
      RETURNING *
    `, {
      google_id: googleUser.google_id,
      user_email: googleUser.email || '',
      name: googleUser.name,
      picture: googleUser.picture || null,
      session_token: sessionToken,
      refresh_token: refreshToken,
      token_expires_at: tokenExpiresAt,
    });
    
    // user might be undefined if something went wrong, but with RETURNING it should be fine.
    // However, `db.get` returns `T | undefined`. 
    if (!user) {
        throw new Error('Failed to login user');
    }

    return user;
  },

  getUserByToken: async (token: string): Promise<User | undefined> => {
    // using ? parameter here. My adapter handles it.
    const user = await db.get<User>('SELECT * FROM users WHERE session_token = ?', [token]);
    
    if (user && user.token_expires_at) {
        const expiresAt = new Date(user.token_expires_at).getTime();
        if (Date.now() > expiresAt) {
            // Token expired
            return undefined;
        }
    }
    
    return user;
  },

  loginGuest: async (nickname: string) => {
    const sessionToken = crypto.randomUUID();
    const refreshToken = crypto.randomUUID();
    const tokenExpiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL).toISOString();
    const guestId = crypto.randomUUID();
    
    // Use placeholders for SQLite compatibility where columns might be NOT NULL
    const googleIdPlaceholder = `guest_${guestId}`;
    const emailPlaceholder = `guest_${guestId}@guest.local`;
    
    const user = await db.get<User>(`
      INSERT INTO users (google_id, email, name, picture, session_token, refresh_token, token_expires_at)
      VALUES (@google_id, @email, @name, NULL, @session_token, @refresh_token, @token_expires_at)
      RETURNING *
    `, {
      google_id: googleIdPlaceholder,
      email: emailPlaceholder,
      name: nickname,
      session_token: sessionToken,
      refresh_token: refreshToken,
      token_expires_at: tokenExpiresAt,
    });
    
    if (!user) {
        throw new Error('Failed to create guest user');
    }

    return user;
  },

  refreshAccessToken: async (refreshToken: string) => {
    const user = await db.get<User>('SELECT * FROM users WHERE refresh_token = ?', [refreshToken]);

    if (!user) {
        throw new Error('Invalid refresh token');
    }

    // Generate new tokens (Rotate refresh token for security)
    const newSessionToken = crypto.randomUUID();
    const newRefreshToken = crypto.randomUUID();
    const newTokenExpiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL).toISOString();

    const updatedUser = await db.get<User>(`
        UPDATE users 
        SET session_token = @session_token, 
            refresh_token = @refresh_token, 
            token_expires_at = @token_expires_at
        WHERE id = @id
        RETURNING *
    `, {
        session_token: newSessionToken,
        refresh_token: newRefreshToken,
        token_expires_at: newTokenExpiresAt,
        id: user.id
    });

    if (!updatedUser) {
        throw new Error('Failed to refresh token');
    }

    return updatedUser;
  }
};
