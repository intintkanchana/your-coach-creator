export interface CoachDirection {
  id: string;
  title: string;
  description: string;
  emoji: string;
}

export interface CoachPersona {
  id: string;
  name: string;
  description: string;
  emoji: string;
}

export type VitalSignType = 'number' | 'slider' | 'text' | 'boolean';

export interface VitalSign {
  id: string;
  name: string;
  description: string;
  emoji: string;
  selected: boolean;
  type: VitalSignType;
  unit?: string;
}

export interface CoachConfig {
  goal: string;
  direction: CoachDirection | null;
  persona: CoachPersona | null;
  vitalSigns: VitalSign[];
  createdAt?: string; // ISO string from DB
}

export type Step =
  | 'welcome'
  | 'describe-goal'
  | 'select-direction'
  | 'select-persona'
  | 'select-vitals'
  | 'summary';

export interface Tracking {
  id: number;
  coach_id: number;
  name: string;
  description?: string;
  emoji?: string;
  type?: string;
  unit?: string;
}

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
  trackings?: Tracking[];
}
