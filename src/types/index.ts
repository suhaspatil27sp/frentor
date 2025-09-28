// Shared TypeScript type definitions for the AI Tutor Chat application

export interface User {
  user_id: string;
  telegram_user_id?: number;
  username: string;
  first_name: string;
  last_name: string;
  age: number;
  grade_level: number;
  education_board: string;
  preferred_language: string;
  timezone: string;
  facts_opt_in: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at?: string;
  is_active: boolean;
}

export interface Session {
  session_id: string;
  user_id: string;
  is_active: boolean;
  current_concept?: string;
  concepts_covered: string[];
  started_at: string;
  last_message_at: string;
  ended_at?: string;
  end_reason?: string;
  auto_extended_count: number;
  session_timeout_hours: number;
}

export interface Message {
  message_id: string;
  session_id: string;
  user_id: string;
  sender_type: 'user' | 'bot';
  message_text: string;
  sent_at: string;
  is_meaningful: boolean;
  intent?: string;
  token_count?: number;
  metadata?: Record<string, any>;
  // Frontend-only properties for status tracking
  status?: 'sending' | 'sent' | 'failed';
  tempId?: string; // For optimistic updates
}

export interface QueuedMessage {
  tempId: string;
  message_text: string;
  timestamp: string;
  retryCount: number;
}

// API Request/Response types
export interface CreateUserRequest {
  username?: string;
  first_name: string;
  last_name?: string;
  age: number;
  grade_level: number;
  education_board?: string;
  telegram_user_id?: number;
  preferred_language?: string;
  timezone?: string;
  facts_opt_in?: boolean;
  onboarding_completed?: boolean;
}

export interface CreateSessionRequest {
  user_id: string;
}

export interface ChatRequest {
  user: User;
  session: Session;
  message: {
    message_text: string;
    sender_type: 'user';
    is_meaningful: boolean;
    token_count?: number;
    intent?: string;
  };
  source: string;
}

export interface ChatResponse {
  userMessage: Message;
  botMessage: Message;
  session: Session;
}

// Education board options
export type EducationBoard = 'CBSE' | 'ICSE' | 'IB' | 'STATE_BOARD' | 'OTHER';

export const EDUCATION_BOARDS: { value: EducationBoard; label: string }[] = [
  { value: 'CBSE', label: 'CBSE' },
  { value: 'ICSE', label: 'ICSE' },
  { value: 'IB', label: 'IB' },
  { value: 'STATE_BOARD', label: 'State Board' },
  { value: 'OTHER', label: 'Other' }
];

// Grade levels
export const GRADE_LEVELS = [6, 7, 8, 9, 10, 11, 12] as const;
export type GradeLevel = typeof GRADE_LEVELS[number];

// Language options
export type Language = 'en' | 'hi' | 'es' | 'fr' | 'de' | 'other';

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'other', label: 'Other' }
];

// Session end reasons
export type SessionEndReason = 'timeout' | 'manual' | 'inactivity' | 'deleted' | 'error';

// Message sender types
export type SenderType = 'user' | 'bot';

// API Error response
export interface ApiError {
  error: string;
  details?: string;
  code?: number;
}