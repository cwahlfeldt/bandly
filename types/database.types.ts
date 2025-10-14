export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      bands: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          photo_url: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          photo_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          photo_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      band_members: {
        Row: {
          id: string;
          band_id: string;
          user_id: string;
          role: string;
          status: string;
          invited_by: string | null;
          joined_at: string;
        };
        Insert: {
          id?: string;
          band_id: string;
          user_id: string;
          role?: string;
          status?: string;
          invited_by?: string | null;
          joined_at?: string;
        };
        Update: {
          id?: string;
          band_id?: string;
          user_id?: string;
          role?: string;
          status?: string;
          invited_by?: string | null;
          joined_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          band_id: string;
          name: string;
          description: string | null;
          event_date: string;
          event_time: string | null;
          location: string | null;
          type: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          band_id: string;
          name: string;
          description?: string | null;
          event_date: string;
          event_time?: string | null;
          location?: string | null;
          type: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          band_id?: string;
          name?: string;
          description?: string | null;
          event_date?: string;
          event_time?: string | null;
          location?: string | null;
          type?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      audio_tracks: {
        Row: {
          id: string;
          band_id: string;
          name: string;
          description: string | null;
          file_url: string;
          file_size: number | null;
          duration: number | null;
          uploaded_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          band_id: string;
          name: string;
          description?: string | null;
          file_url: string;
          file_size?: number | null;
          duration?: number | null;
          uploaded_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          band_id?: string;
          name?: string;
          description?: string | null;
          file_url?: string;
          file_size?: number | null;
          duration?: number | null;
          uploaded_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      setlists: {
        Row: {
          id: string;
          band_id: string;
          name: string;
          description: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          band_id: string;
          name: string;
          description?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          band_id?: string;
          name?: string;
          description?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      setlist_songs: {
        Row: {
          id: string;
          setlist_id: string;
          song_name: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          setlist_id: string;
          song_name: string;
          position: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          setlist_id?: string;
          song_name?: string;
          position?: number;
          created_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          band_id: string;
          user_id: string | null;
          message_type: string;
          content: string | null;
          reference_id: string | null;
          reference_type: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          band_id: string;
          user_id?: string | null;
          message_type?: string;
          content?: string | null;
          reference_id?: string | null;
          reference_type?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          band_id?: string;
          user_id?: string | null;
          message_type?: string;
          content?: string | null;
          reference_id?: string | null;
          reference_type?: string | null;
          created_at?: string;
        };
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
