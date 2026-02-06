import db from '../db';

export interface Coach {
  id: number;
  name: string;
  type: string;
  system_instruction: string;
  user_id: number;
}

export const coachService = {
  createCoach: (data: { name: string; type: string; system_instruction?: string; user_id: number }) => {
    // Default system instruction if not provided
    const instruction = data.system_instruction || 
      `You are a ${data.type} coach named ${data.name}. Help the user with their goals.`;

    const stmt = db.prepare(`
      INSERT INTO coaches (name, type, system_instruction, user_id)
      VALUES (@name, @type, @system_instruction, @user_id)
      RETURNING *
    `);
    
    return stmt.get({ ...data, system_instruction: instruction }) as Coach;
  },

  getCoachesByUser: (userId: number) => {
    const stmt = db.prepare('SELECT id, name, type FROM coaches WHERE user_id = ?');
    return stmt.all(userId) as Pick<Coach, 'id' | 'name' | 'type'>[];
  },

  getCoachById: (id: number) => {
    const stmt = db.prepare('SELECT * FROM coaches WHERE id = ?');
    return stmt.get(id) as Coach | undefined;
  }
};
