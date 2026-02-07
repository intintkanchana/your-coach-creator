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
  vital_signs?: string; // stored as JSON string (deprecated)
  trackings?: Tracking[];
}

export interface Tracking {
  id: number;
  coach_id: number;
  name: string;
  description?: string;
  emoji?: string;
  type?: string;
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
    vital_signs?: any; // deprecated
    trackings?: any[];
  }) => {
    // Default system instruction if not provided
    const instruction = data.system_instruction || 
      `You are a ${data.type} coach named ${data.name}. Help the user with their goals.`;

    const createCoachTransaction = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO coaches (name, type, system_instruction, icon, user_id, goal, bio, vital_signs)
        VALUES (@name, @type, @system_instruction, @icon, @user_id, @goal, @bio, @vital_signs)
        RETURNING *
      `);
      
      // Ensure vital_signs is stringified if it's an object/array (keeping for backward compat)
      const vitalSignsStr = data.vital_signs ? 
        (typeof data.vital_signs === 'string' ? data.vital_signs : JSON.stringify(data.vital_signs)) 
        : null;

      const coach = stmt.get({ 
        ...data, 
        goal: data.goal || null,
        bio: data.bio || null,
        system_instruction: instruction,
        vital_signs: vitalSignsStr
      }) as Coach;

      if (data.trackings && Array.isArray(data.trackings)) {
        const insertTracking = db.prepare(`
          INSERT INTO trackings (coach_id, name, description, emoji, type)
          VALUES (@coach_id, @name, @description, @emoji, @type)
        `);

        for (const t of data.trackings) {
          insertTracking.run({
            coach_id: coach.id,
            name: t.name,
            description: t.description || null,
            emoji: t.emoji || null,
            type: t.type || null
          });
        }
      }

      return coach;
    });

    const coach = createCoachTransaction();
    
    // Attach trackings to returned object
    if (coach) {
      coach.trackings = db.prepare('SELECT * FROM trackings WHERE coach_id = ?').all(coach.id) as Tracking[];
    }
    
    return coach;
  },

  getCoachesByUser: (userId: number) => {
    const stmt = db.prepare('SELECT id, name, type, icon FROM coaches WHERE user_id = ?');
    return stmt.all(userId) as Pick<Coach, 'id' | 'name' | 'type' | 'icon'>[];
  },

  getCoachById: (id: number) => {
    const coach = db.prepare('SELECT * FROM coaches WHERE id = ?').get(id) as Coach | undefined;
    if (coach) {
      coach.trackings = db.prepare('SELECT * FROM trackings WHERE coach_id = ?').all(id) as Tracking[];
    }
    return coach;
  },

  deleteCoach: (id: number, userId: number) => {
    const deleteMessages = db.prepare('DELETE FROM messages WHERE coach_id = ?');
    const deleteCoach = db.prepare('DELETE FROM coaches WHERE id = ? AND user_id = ?');
    
    const transaction = db.transaction(() => {
      const deleteTrackings = db.prepare('DELETE FROM trackings WHERE coach_id = ?');
      deleteMessages.run(id);
      deleteTrackings.run(id);
      return deleteCoach.run(id, userId);
    });

    return transaction();
  }
};
