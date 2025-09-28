// lib/types.ts
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
  is_active: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
  last_active_at: string;
}

export interface Session {
  session_id: string;
  user_id: string;
  is_active: boolean;
  current_concept?: string;
  concepts_covered: string[];
  started_at: string;
  last_message_at: string;
  auto_extended_count: number;
  session_timeout_hours: number;
  ended_at?: string;
  end_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  message_id: string;
  session_id: string;
  user_id: string;
  sender_type: 'user' | 'bot';
  message_text: string;
  intent?: string;
  is_meaningful: boolean;
  token_count: number;
  sent_at: string;
  created_at: string;
  updated_at: string;
}

// Database type definitions for Supabase
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'user_id' | 'created_at' | 'updated_at' | 'last_active_at'> & {
          user_id?: string;
          created_at?: string;
          updated_at?: string;
          last_active_at?: string;
        };
        Update: Partial<User>;
      };
      sessions: {
        Row: Session;
        Insert: Omit<Session, 'session_id' | 'created_at' | 'updated_at'> & {
          session_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Session>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'message_id' | 'created_at' | 'updated_at'> & {
          message_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Message>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}