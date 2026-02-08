import { CoachConfig } from "./coach";

export type MessageType =
  | "coach"
  | "user"
  | "system"
  | "form"
  | "tip"
  | "image";

export interface AnalysisData {
  summary_impression: string;
  vital_sign_feedback: {
    label: string;
    value: number | string | boolean;
    emoji?: string;
    comment: string;
  }[];
  deep_dive_insights: string[];
  next_action_items: string[];
  closing_phrase: string;
}


export interface FormField {
  id: string;
  label: string;
  description?: string;
  emoji: string;
  type: "slider" | "number" | "boolean" | "text";
  unit?: string;
  min?: number;
  max?: number;
  defaultValue?: number | boolean | string;
}

export interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  // For form messages
  formFields?: FormField[];
  formSubmitted?: boolean;
  formData?: Record<string, number | boolean | string>;
  // For image messages
  // For image messages
  imageUrl?: string;
  imageAlt?: string;
  // For analysis messages
  analysisData?: AnalysisData;
}

export interface QuickAction {
  id: string;
  label: string;
}

export interface ChatState {
  messages: ChatMessage[];
  quickActions: QuickAction[];
  isTyping: boolean;
  coachConfig: CoachConfig;
}
