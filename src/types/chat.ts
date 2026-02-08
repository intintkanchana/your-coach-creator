import { CoachConfig } from "./coach";

export type MessageType = 
  | "coach" 
  | "user" 
  | "system" 
  | "form" 
  | "tip" 
  | "image";

export interface FormField {
  id: string;
  label: string;
  type: "slider" | "number" | "toggle" | "text";
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
  imageUrl?: string;
  imageAlt?: string;
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
