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
  unit?: string;
}

export const coachService = {
  createCoach: async (data: {
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

    const coach = await db.transaction(async (tx) => {
      // Ensure vital_signs is stringified if it's an object/array (keeping for backward compat)
      const vitalSignsStr = data.vital_signs ?
        (typeof data.vital_signs === 'string' ? data.vital_signs : JSON.stringify(data.vital_signs))
        : null;

      const newCoach = await tx.get<Coach>(`
        INSERT INTO coaches (name, type, system_instruction, icon, user_id, goal, bio, vital_signs)
        VALUES (@name, @type, @system_instruction, @icon, @user_id, @goal, @bio, @vital_signs)
        RETURNING *
      `, {
        ...data,
        goal: data.goal || null,
        bio: data.bio || null,
        system_instruction: instruction,
        vital_signs: vitalSignsStr
      });

      if (!newCoach) {
        throw new Error('Failed to create coach');
      }

      if (data.trackings && Array.isArray(data.trackings)) {
        for (const t of data.trackings) {
          await tx.run(`
            INSERT INTO trackings (coach_id, name, description, emoji, type, unit)
            VALUES (@coach_id, @name, @description, @emoji, @type, @unit)
          `, {
            coach_id: newCoach.id,
            name: t.name,
            description: t.description || null,
            emoji: t.emoji || null,
            type: t.type || null,
            unit: t.unit || null
          });
        }
      }

      return newCoach;
    });

    // Attach trackings to returned object (outside transaction to avoid complex types in tx return if not needed, but safe to do here)
    if (coach) {
      coach.trackings = await db.query<Tracking>('SELECT * FROM trackings WHERE coach_id = ?', [coach.id]);
    }

    return coach;
  },

  getCoachesByUser: async (userId: number) => {
    return db.query<Pick<Coach, 'id' | 'name' | 'type' | 'icon'>>('SELECT id, name, type, icon FROM coaches WHERE user_id = ?', [userId]);
  },

  getCoachById: async (id: number) => {
    const coach = await db.get<Coach>('SELECT * FROM coaches WHERE id = ?', [id]);
    if (coach) {
      coach.trackings = await db.query<Tracking>('SELECT * FROM trackings WHERE coach_id = ?', [id]);
    }
    return coach;
  },

  deleteCoach: async (id: number, userId: number) => {
    return db.transaction(async (tx) => {
      await tx.run('DELETE FROM messages WHERE coach_id = ?', [id]);
      await tx.run('DELETE FROM trackings WHERE coach_id = ?', [id]);
      await tx.run('DELETE FROM activity_logs WHERE coach_id = ?', [id]);
      const result = await tx.run('DELETE FROM coaches WHERE id = ? AND user_id = ?', [id, userId]);
      return result;
    });
  }
};
