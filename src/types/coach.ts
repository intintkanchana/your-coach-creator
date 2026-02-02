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

export interface VitalSign {
  id: string;
  name: string;
  description: string;
  emoji: string;
  selected: boolean;
}

export interface CoachConfig {
  goal: string;
  direction: CoachDirection | null;
  persona: CoachPersona | null;
  vitalSigns: VitalSign[];
}

export type Step = 
  | 'welcome'
  | 'describe-goal'
  | 'select-direction'
  | 'select-persona'
  | 'select-vitals'
  | 'summary';
