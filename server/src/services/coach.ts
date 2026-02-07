import db from '../db';

export interface Coach {
  id: number;
  name: string;
  type: string;
  system_instruction: string;
  icon?: string;
  user_id: number;
  created_at: string;
  goal?: string;
  bio?: string;
  vital_signs?: string; // stored as JSON string
}

export const coachService = {
  createCoach: (data: { 
    name: string; 
    type: string; 
    system_instruction?: string; 
    icon?: string; 
    user_id: number;
    goal?: string;
    bio?: string;
    vital_signs?: any;
  }) => {
    // Default system instruction if not provided
    const instruction = data.system_instruction || 
      `You are a ${data.type} coach named ${data.name}. Help the user with their goals.`;

    const stmt = db.prepare(`
      INSERT INTO coaches (name, type, system_instruction, icon, user_id, goal, bio, vital_signs)
      VALUES (@name, @type, @system_instruction, @icon, @user_id, @goal, @bio, @vital_signs)
      RETURNING *
    `);
    
    // Ensure vital_signs is stringified if it's an object/array
    const vitalSignsStr = data.vital_signs ? 
      (typeof data.vital_signs === 'string' ? data.vital_signs : JSON.stringify(data.vital_signs)) 
      : null;

    return stmt.get({ 
      ...data, 
      goal: data.goal || null,
      bio: data.bio || null,
      system_instruction: instruction,
      vital_signs: vitalSignsStr
    }) as Coach;
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
