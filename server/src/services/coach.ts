import db from '../db';

export interface Coach {
  id: number;
  name: string;
  type: string;
  system_instruction: string;
  icon?: string;
  user_id: number;
}

export const coachService = {
  createCoach: (data: { name: string; type: string; system_instruction?: string; icon?: string; user_id: number }) => {
    // Default system instruction if not provided
    const instruction = data.system_instruction || 
      `You are a ${data.type} coach named ${data.name}. Help the user with their goals.`;

    const stmt = db.prepare(`
      INSERT INTO coaches (name, type, system_instruction, icon, user_id)
      VALUES (@name, @type, @system_instruction, @icon, @user_id)
      RETURNING *
    `);
    
    return stmt.get({ ...data, system_instruction: instruction }) as Coach;
  },

  getCoachesByUser: (userId: number) => {
    const stmt = db.prepare('SELECT id, name, type, icon FROM coaches WHERE user_id = ?');
    return stmt.all(userId) as Pick<Coach, 'id' | 'name' | 'type' | 'icon'>[];
  },

  getCoachById: (id: number) => {
    const stmt = db.prepare('SELECT * FROM coaches WHERE id = ?');
    return stmt.get(id) as Coach | undefined;
  },

  deleteCoach: (id: number, userId: number) => {
    const deleteMessages = db.prepare('DELETE FROM messages WHERE coach_id = ?');
    const deleteCoach = db.prepare('DELETE FROM coaches WHERE id = ? AND user_id = ?');
    
    const transaction = db.transaction(() => {
      deleteMessages.run(id);
      return deleteCoach.run(id, userId);
    });

    return transaction();
  }
};
