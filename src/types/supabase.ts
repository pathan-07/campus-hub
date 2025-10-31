export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          title: string;
          description: string;
          venue: string;
          location: string;
          date: string;
          type: 'college' | 'other';
          category: 'Tech' | 'Sports' | 'Music' | 'Workshop' | 'Social' | 'Other';
          map_link: string | null;
          registration_link: string | null;
          author_id: string;
          author_name: string | null;
          created_at: string | null;
          attendees: number;
          attendee_uids: string[] | null;
          checked_in_uids: string[] | null;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          venue: string;
          location: string;
          date: string;
          type: 'college' | 'other';
          category: 'Tech' | 'Sports' | 'Music' | 'Workshop' | 'Social' | 'Other';
          map_link?: string | null;
          registration_link?: string | null;
          author_id: string;
          author_name?: string | null;
          created_at?: string | null;
          attendees?: number;
          attendee_uids?: string[] | null;
          checked_in_uids?: string[] | null;
        };
        Update: {
          title?: string;
          description?: string;
          venue?: string;
          location?: string;
          date?: string;
          type?: 'college' | 'other';
          category?: 'Tech' | 'Sports' | 'Music' | 'Workshop' | 'Social' | 'Other';
          map_link?: string | null;
          registration_link?: string | null;
          author_id?: string;
          author_name?: string | null;
          created_at?: string | null;
          attendees?: number;
          attendee_uids?: string[] | null;
          checked_in_uids?: string[] | null;
        };
  Relationships: never[];
      };
      event_attendees: {
        Row: {
          id: string;
          created_at: string;
          event_id: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          event_id: string;
          user_id: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          event_id?: string;
          user_id?: string;
        };
  Relationships: never[];
      };
      users: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          photo_url: string | null;
          bio: string | null;
          points: number | null;
          events_attended: number | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          photo_url?: string | null;
          bio?: string | null;
          points?: number | null;
          events_attended?: number | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          photo_url?: string | null;
          bio?: string | null;
          points?: number | null;
          events_attended?: number | null;
        };
  Relationships: never[];
      };
      comments: {
        Row: {
          id: string;
          created_at: string;
          text: string;
          author_id: string;
          event_id: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          text: string;
          author_id: string;
          event_id: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          text?: string;
          author_id?: string;
          event_id?: string;
        };
  Relationships: never[];
      };
    };
    Views: {};
    Functions: {
      increment_event_click: {
        Args: {
          event_uuid: string;
        };
        Returns: Json;
      };
    };
    Enums: {};
    CompositeTypes: {};
  };
};
