export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      account_activity: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string
        }
        Relationships: []
      }
      achievements: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          requirement_type: string
          requirement_value: number
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          requirement_type: string
          requirement_value: number
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          requirement_type?: string
          requirement_value?: number
          title?: string
        }
        Relationships: []
      }
      activities: {
        Row: {
          calories: number | null
          created_at: string | null
          date: string | null
          description: string | null
          distance: number | null
          duration: number
          id: string
          is_public: boolean | null
          is_template: boolean | null
          template_description: string | null
          template_name: string | null
          type: string
          user_id: string
        }
        Insert: {
          calories?: number | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          distance?: number | null
          duration: number
          id?: string
          is_public?: boolean | null
          is_template?: boolean | null
          template_description?: string | null
          template_name?: string | null
          type: string
          user_id: string
        }
        Update: {
          calories?: number | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          distance?: number | null
          duration?: number
          id?: string
          is_public?: boolean | null
          is_template?: boolean | null
          template_description?: string | null
          template_name?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_comments: {
        Row: {
          activity_id: string
          content: string
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_id: string
          content: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activity_id?: string
          content?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_comments_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_shares: {
        Row: {
          activity_id: string
          created_at: string | null
          id: string
          public: boolean | null
          shared_by: string
          shared_with: string | null
        }
        Insert: {
          activity_id: string
          created_at?: string | null
          id?: string
          public?: boolean | null
          shared_by: string
          shared_with?: string | null
        }
        Update: {
          activity_id?: string
          created_at?: string | null
          id?: string
          public?: boolean | null
          shared_by?: string
          shared_with?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_shares_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_shares_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_shares_shared_with_fkey"
            columns: ["shared_with"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string
          id: string
          start_date: string
          target_value: number
          title: string
          type: Database["public"]["Enums"]["challenge_type"]
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date: string
          id?: string
          start_date: string
          target_value: number
          title: string
          type: Database["public"]["Enums"]["challenge_type"]
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string
          id?: string
          start_date?: string
          target_value?: number
          title?: string
          type?: Database["public"]["Enums"]["challenge_type"]
        }
        Relationships: []
      }
      chat_participants: {
        Row: {
          chat_id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          chat_id: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          chat_id?: string
          joined_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          created_at: string | null
          id: string
          last_message: string | null
          last_message_at: string | null
          name: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          name?: string | null
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          name?: string | null
          type?: string
        }
        Relationships: []
      }
      competition_participants: {
        Row: {
          competition_id: string | null
          id: string
          joined_at: string | null
          score: number | null
          user_id: string | null
        }
        Insert: {
          competition_id?: string | null
          id?: string
          joined_at?: string | null
          score?: number | null
          user_id?: string | null
        }
        Update: {
          competition_id?: string | null
          id?: string
          joined_at?: string | null
          score?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_participants_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          created_at: string | null
          creator_id: string | null
          description: string | null
          end_date: string
          id: string
          start_date: string
          status: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          end_date: string
          id?: string
          start_date: string
          status?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          end_date?: string
          id?: string
          start_date?: string
          status?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      friend_requests: {
        Row: {
          created_at: string | null
          id: string
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          receiver_id: string
          sender_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "friend_requests_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string | null
          current: number | null
          deadline: string | null
          id: string
          target: number
          type: string
          unit: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current?: number | null
          deadline?: string | null
          id?: string
          target: number
          type: string
          unit: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current?: number | null
          deadline?: string | null
          id?: string
          target?: number
          type?: string
          unit?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string | null
          id: string
          read_by: string[] | null
          sender_id: string
          type: string | null
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string | null
          id?: string
          read_by?: string[] | null
          sender_id: string
          type?: string | null
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string | null
          id?: string
          read_by?: string[] | null
          sender_id?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean
          related_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean
          related_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean
          related_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      nutrition_records: {
        Row: {
          calories: number | null
          carbs: number | null
          created_at: string | null
          date: string
          fats: number | null
          id: string
          meal_type: string
          notes: string | null
          protein: number | null
          user_id: string | null
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          created_at?: string | null
          date?: string
          fats?: number | null
          id?: string
          meal_type: string
          notes?: string | null
          protein?: number | null
          user_id?: string | null
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          created_at?: string | null
          date?: string
          fats?: number | null
          id?: string
          meal_type?: string
          notes?: string | null
          protein?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          content: string | null
          created_at: string | null
          id: string
          image_url: string | null
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          first_name: string | null
          fitness_goals: string[] | null
          fitness_level: string | null
          height: number | null
          id: string
          last_name: string | null
          preferred_workout_time: string | null
          social_links: Json | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          first_name?: string | null
          fitness_goals?: string[] | null
          fitness_level?: string | null
          height?: number | null
          id: string
          last_name?: string | null
          preferred_workout_time?: string | null
          social_links?: Json | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          first_name?: string | null
          fitness_goals?: string[] | null
          fitness_level?: string | null
          height?: number | null
          id?: string
          last_name?: string | null
          preferred_workout_time?: string | null
          social_links?: Json | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string | null
          id: string
          language: string | null
          notifications_enabled: boolean | null
          nutrition_tracking_enabled: boolean | null
          sleep_tracking_enabled: boolean | null
          theme: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          language?: string | null
          notifications_enabled?: boolean | null
          nutrition_tracking_enabled?: boolean | null
          sleep_tracking_enabled?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          language?: string | null
          notifications_enabled?: boolean | null
          nutrition_tracking_enabled?: boolean | null
          sleep_tracking_enabled?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sleep_records: {
        Row: {
          created_at: string | null
          end_time: string
          id: string
          notes: string | null
          quality: number | null
          start_time: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          end_time: string
          id?: string
          notes?: string | null
          quality?: number | null
          start_time: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          end_time?: string
          id?: string
          notes?: string | null
          quality?: number | null
          start_time?: string
          user_id?: string | null
        }
        Relationships: []
      }
      stories: {
        Row: {
          caption: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          image_url: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          image_url: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string
          user_id?: string
        }
        Relationships: []
      }
      story_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          story_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          story_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_comments_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          viewed_at: string | null
          viewer_id: string
        }
        Insert: {
          id?: string
          story_id: string
          viewed_at?: string | null
          viewer_id: string
        }
        Update: {
          id?: string
          story_id?: string
          viewed_at?: string | null
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string | null
          earned_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          achievement_id?: string | null
          earned_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          achievement_id?: string | null
          earned_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenges: {
        Row: {
          challenge_id: string | null
          completed_at: string | null
          current_value: number | null
          id: string
          joined_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          challenge_id?: string | null
          completed_at?: string | null
          current_value?: number | null
          id?: string
          joined_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          challenge_id?: string | null
          completed_at?: string | null
          current_value?: number | null
          id?: string
          joined_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          allow_friend_requests: boolean | null
          created_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allow_friend_requests?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allow_friend_requests?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          last_seen: string | null
          status: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          last_seen?: string | null
          status?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          last_seen?: string | null
          status?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      user_competition_stats: {
        Row: {
          achievements_earned: number | null
          competitions_completed: number | null
          competitions_joined: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      challenge_type: "steps" | "distance" | "workout" | "nutrition"
      competition_status: "upcoming" | "active" | "completed"
      competition_type: "daily" | "weekly" | "monthly" | "special"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
