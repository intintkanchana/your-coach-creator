import db from '../db';
import { ChatMessage } from './gemini';

export const chatService = {
  getHistory: (coachId: number, userId: number): ChatMessage[] => {
    // Limit history to last 50 messages to avoid huge context? 
    // Or just all for now.
    const stmt = db.prepare(`
      SELECT role, content 
      FROM messages 
      WHERE coach_id = ? AND user_id = ? 
      ORDER BY timestamp ASC
    `);
    
    const rows = stmt.all(coachId, userId) as { role: 'user' | 'model'; content: string }[];
    
    // Map to Gemini format
    return rows.map(r => ({
      role: r.role,
      parts: [{ text: r.content }]
    }));
  },

  saveMessage: (coachId: number, userId: number, role: 'user' | 'model', content: string) => {
    const stmt = db.prepare(`
      INSERT INTO messages (coach_id, user_id, role, content)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(coachId, userId, role, content);
  }
};
