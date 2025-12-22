export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type VisibilityLevel = "public" | "department" | "private";

export interface VisibilitySettings {
  department: VisibilityLevel;
  job_role: VisibilityLevel;
  office_location: VisibilityLevel;
  mbti: VisibilityLevel;
  hobbies: VisibilityLevel;
  collaboration_style: VisibilityLevel;
  strengths: VisibilityLevel;
  preferred_people_type: VisibilityLevel;
  living_location: VisibilityLevel;
  hometown: VisibilityLevel;
  education: VisibilityLevel;
  work_description: VisibilityLevel;
  tech_stack: VisibilityLevel;
  favorite_food: VisibilityLevel;
  age_range: VisibilityLevel;
  interests: VisibilityLevel;
  career_goals: VisibilityLevel;
  certifications: VisibilityLevel;
  languages: VisibilityLevel;
}

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      announcement_comments: {
        Row: {
          announcement_id: string
          content: string
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          announcement_id: string
          content: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          announcement_id?: string
          content?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_comments_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_files: {
        Row: {
          announcement_id: string
          created_at: string | null
          download_count: number | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
        }
        Insert: {
          announcement_id: string
          created_at?: string | null
          download_count?: number | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
        }
        Update: {
          announcement_id?: string
          created_at?: string | null
          download_count?: number | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_files_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          category: string | null
          cohort_id: string | null
          comment_count: number | null
          content: string
          created_at: string | null
          id: string
          is_important: boolean | null
          is_pinned: boolean | null
          title: string
          updated_at: string | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          category?: string | null
          cohort_id?: string | null
          comment_count?: number | null
          content: string
          created_at?: string | null
          id?: string
          is_important?: boolean | null
          is_pinned?: boolean | null
          title: string
          updated_at?: string | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          category?: string | null
          cohort_id?: string | null
          comment_count?: number | null
          content?: string
          created_at?: string | null
          id?: string
          is_important?: boolean | null
          is_pinned?: boolean | null
          title?: string
          updated_at?: string | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      board_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          parent_id: string | null
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "board_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "board_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      board_likes: {
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
            foreignKeyName: "board_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "board_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      board_poll_votes: {
        Row: {
          created_at: string | null
          id: string
          option_ids: string[]
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_ids: string[]
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_ids?: string[]
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "board_polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_poll_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      board_polls: {
        Row: {
          created_at: string | null
          ends_at: string | null
          id: string
          multiple_choice: boolean | null
          options: Json
          post_id: string
        }
        Insert: {
          created_at?: string | null
          ends_at?: string | null
          id?: string
          multiple_choice?: boolean | null
          options: Json
          post_id: string
        }
        Update: {
          created_at?: string | null
          ends_at?: string | null
          id?: string
          multiple_choice?: boolean | null
          options?: Json
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_polls_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "board_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      board_posts: {
        Row: {
          cohort_id: string | null
          comment_count: number | null
          content: string
          created_at: string | null
          id: string
          image_urls: string[] | null
          is_pinned: boolean | null
          like_count: number | null
          post_type: string | null
          title: string
          updated_at: string | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          cohort_id?: string | null
          comment_count?: number | null
          content: string
          created_at?: string | null
          id?: string
          image_urls?: string[] | null
          is_pinned?: boolean | null
          like_count?: number | null
          post_type?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          cohort_id?: string | null
          comment_count?: number | null
          content?: string
          created_at?: string | null
          id?: string
          image_urls?: string[] | null
          is_pinned?: boolean | null
          like_count?: number | null
          post_type?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "board_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          all_day: boolean | null
          cohort_id: string | null
          color: string | null
          created_at: string | null
          created_by: string
          description: string | null
          end_date: string
          event_type: string
          id: string
          location: string | null
          start_date: string
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          all_day?: boolean | null
          cohort_id?: string | null
          color?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          end_date: string
          event_type: string
          id?: string
          location?: string | null
          start_date: string
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          all_day?: boolean | null
          cohort_id?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          end_date?: string
          event_type?: string
          id?: string
          location?: string | null
          start_date?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          cohort_id: string | null
          created_at: string | null
          id: string
          last_message_at: string | null
          participant_1: string
          participant_2: string
        }
        Insert: {
          cohort_id?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          participant_1: string
          participant_2: string
        }
        Update: {
          cohort_id?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          participant_1?: string
          participant_2?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_participant_1_fkey"
            columns: ["participant_1"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_2_fkey"
            columns: ["participant_2"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      embeddings: {
        Row: {
          collaboration_style_embedding: string | null
          combined_embedding: string | null
          generated_at: string | null
          id: string
          preferred_people_type_embedding: string | null
          source_text_hash: string | null
          strengths_embedding: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          collaboration_style_embedding?: string | null
          combined_embedding?: string | null
          generated_at?: string | null
          id?: string
          preferred_people_type_embedding?: string | null
          source_text_hash?: string | null
          strengths_embedding?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          collaboration_style_embedding?: string | null
          combined_embedding?: string | null
          generated_at?: string | null
          id?: string
          preferred_people_type_embedding?: string | null
          source_text_hash?: string | null
          strengths_embedding?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "embeddings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      fr_identities: {
        Row: {
          id: string
          source: string
          external_key: string | null
          name: string
          email: string | null
          org: string | null
          photo_url: string
          embedding: number[] | null
          embedding_model: string
          embedding_version: string
          preprocess_version: string | null
          is_active: boolean
          metadata: Record<string, unknown> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          source: string
          external_key?: string | null
          name: string
          email?: string | null
          org?: string | null
          photo_url: string
          embedding?: number[] | null
          embedding_model?: string
          embedding_version?: string
          preprocess_version?: string | null
          is_active?: boolean
          metadata?: Record<string, unknown> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          source?: string
          external_key?: string | null
          name?: string
          email?: string | null
          org?: string | null
          photo_url?: string
          embedding?: number[] | null
          embedding_model?: string
          embedding_version?: string
          preprocess_version?: string | null
          is_active?: boolean
          metadata?: Record<string, unknown> | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      matches_cache: {
        Row: {
          common_tags: string[] | null
          computed_at: string | null
          department_score: number | null
          embedding_similarity: number | null
          expires_at: string | null
          explanation: Json | null
          id: string
          job_role_score: number | null
          location_score: number | null
          matched_user_id: string
          mbti_compatibility_score: number | null
          preference_match_score: number | null
          suggested_topics: string[] | null
          tag_overlap_score: number | null
          total_score: number
          user_id: string
        }
        Insert: {
          common_tags?: string[] | null
          computed_at?: string | null
          department_score?: number | null
          embedding_similarity?: number | null
          expires_at?: string | null
          explanation?: Json | null
          id?: string
          job_role_score?: number | null
          location_score?: number | null
          matched_user_id: string
          mbti_compatibility_score?: number | null
          preference_match_score?: number | null
          suggested_topics?: string[] | null
          tag_overlap_score?: number | null
          total_score: number
          user_id: string
        }
        Update: {
          common_tags?: string[] | null
          computed_at?: string | null
          department_score?: number | null
          embedding_similarity?: number | null
          expires_at?: string | null
          explanation?: Json | null
          id?: string
          job_role_score?: number | null
          location_score?: number | null
          matched_user_id?: string
          mbti_compatibility_score?: number | null
          preference_match_score?: number | null
          suggested_topics?: string[] | null
          tag_overlap_score?: number | null
          total_score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_cache_matched_user_id_fkey"
            columns: ["matched_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_cache_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          read: boolean | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
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
          body: string | null
          created_at: string | null
          data: Json | null
          id: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      preferences: {
        Row: {
          created_at: string | null
          department_weight: number | null
          embedding_weight: number | null
          excluded_user_ids: string[] | null
          id: string
          job_role_weight: number | null
          location_weight: number | null
          mbti_weight: number | null
          prefer_cross_department: boolean | null
          preference_weight: number | null
          preferred_departments: string[] | null
          preferred_job_roles: string[] | null
          preferred_locations: string[] | null
          preferred_mbti_types: string[] | null
          tag_weight: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          department_weight?: number | null
          embedding_weight?: number | null
          excluded_user_ids?: string[] | null
          id?: string
          job_role_weight?: number | null
          location_weight?: number | null
          mbti_weight?: number | null
          prefer_cross_department?: boolean | null
          preference_weight?: number | null
          preferred_departments?: string[] | null
          preferred_job_roles?: string[] | null
          preferred_locations?: string[] | null
          preferred_mbti_types?: string[] | null
          tag_weight?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          department_weight?: number | null
          embedding_weight?: number | null
          excluded_user_ids?: string[] | null
          id?: string
          job_role_weight?: number | null
          location_weight?: number | null
          mbti_weight?: number | null
          prefer_cross_department?: boolean | null
          preference_weight?: number | null
          preferred_departments?: string[] | null
          preferred_job_roles?: string[] | null
          preferred_locations?: string[] | null
          preferred_mbti_types?: string[] | null
          tag_weight?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_tags: {
        Row: {
          created_at: string | null
          id: string
          profile_id: string
          tag_category: string | null
          tag_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          profile_id: string
          tag_category?: string | null
          tag_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          profile_id?: string
          tag_category?: string | null
          tag_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_tags_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_view_logs: {
        Row: {
          id: string
          view_context: string | null
          viewed_at: string | null
          viewed_id: string
          viewer_id: string
        }
        Insert: {
          id?: string
          view_context?: string | null
          viewed_at?: string | null
          viewed_id: string
          viewer_id: string
        }
        Update: {
          id?: string
          view_context?: string | null
          viewed_at?: string | null
          viewed_id?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_view_logs_viewed_id_fkey"
            columns: ["viewed_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_view_logs_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cohorts: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_range: string | null
          career_goals: string | null
          certifications: string | null
          cohort_id: string | null
          collaboration_style: string | null
          created_at: string | null
          department: string
          education: string | null
          favorite_food: string | null
          hometown: string | null
          id: string
          interests: string | null
          is_profile_complete: boolean | null
          job_role: string
          job_position: string | null
          languages: string | null
          living_location: string | null
          mbti: string | null
          office_location: string
          onboarding_completed: boolean | null
          org_level1: string | null
          org_level2: string | null
          org_level3: string | null
          preferred_people_type: string | null
          role: string | null
          strengths: string | null
          tech_stack: string | null
          updated_at: string | null
          user_id: string
          visibility_settings: Json | null
          work_description: string | null
        }
        Insert: {
          age_range?: string | null
          career_goals?: string | null
          certifications?: string | null
          cohort_id?: string | null
          collaboration_style?: string | null
          created_at?: string | null
          department?: string
          education?: string | null
          favorite_food?: string | null
          hometown?: string | null
          id?: string
          interests?: string | null
          is_profile_complete?: boolean | null
          job_role?: string
          job_position?: string | null
          languages?: string | null
          living_location?: string | null
          mbti?: string | null
          office_location?: string
          onboarding_completed?: boolean | null
          org_level1?: string | null
          org_level2?: string | null
          org_level3?: string | null
          preferred_people_type?: string | null
          role?: string | null
          strengths?: string | null
          tech_stack?: string | null
          updated_at?: string | null
          user_id: string
          visibility_settings?: Json | null
          work_description?: string | null
        }
        Update: {
          age_range?: string | null
          career_goals?: string | null
          certifications?: string | null
          cohort_id?: string | null
          collaboration_style?: string | null
          created_at?: string | null
          department?: string
          education?: string | null
          favorite_food?: string | null
          hometown?: string | null
          id?: string
          interests?: string | null
          is_profile_complete?: boolean | null
          job_role?: string
          job_position?: string | null
          languages?: string | null
          living_location?: string | null
          mbti?: string | null
          office_location?: string
          onboarding_completed?: boolean | null
          org_level1?: string | null
          org_level2?: string | null
          org_level3?: string | null
          preferred_people_type?: string | null
          role?: string | null
          strengths?: string | null
          tech_stack?: string | null
          updated_at?: string | null
          user_id?: string
          visibility_settings?: Json | null
          work_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      team_groupings: {
        Row: {
          announcement_id: string | null
          cohort_id: string
          created_at: string | null
          created_by: string
          criteria_parsed: Json
          criteria_text: string
          id: string
          shared_at: string | null
          shared_via: string | null
          team_count: number
          team_size: number
          teams_json: Json
          ungrouped_members: Json | null
          updated_at: string | null
        }
        Insert: {
          announcement_id?: string | null
          cohort_id: string
          created_at?: string | null
          created_by: string
          criteria_parsed: Json
          criteria_text: string
          id?: string
          shared_at?: string | null
          shared_via?: string | null
          team_count: number
          team_size: number
          teams_json: Json
          ungrouped_members?: Json | null
          updated_at?: string | null
        }
        Update: {
          announcement_id?: string | null
          cohort_id?: string
          created_at?: string | null
          created_by?: string
          criteria_parsed?: Json
          criteria_text?: string
          id?: string
          shared_at?: string | null
          shared_via?: string | null
          team_count?: number
          team_size?: number
          teams_json?: Json
          ungrouped_members?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_groupings_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_groupings_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_groupings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          deleted_at: string | null
          email: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email: string
          id: string
          name: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_tag_overlap: {
        Args: { p_user_id_1: string; p_user_id_2: string }
        Returns: number
      }
      check_field_visibility:
        | {
            Args: {
              p_field_name: string
              p_profile_user_id: string
              p_viewer_id: string
              p_visibility_settings: Json
            }
            Returns: boolean
          }
        | {
            Args: {
              field_name: string
              target_user_id: string
              viewer_user_id: string
            }
            Returns: boolean
          }
      get_common_tags: {
        Args: { p_user_id_1: string; p_user_id_2: string }
        Returns: string[]
      }
      increment_announcement_view_count: {
        Args: { p_id: string }
        Returns: undefined
      }
      increment_board_post_view_count: {
        Args: { p_id: string }
        Returns: undefined
      }
    }
    Enums: {
      visibility_level: "public" | "department" | "private"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      visibility_level: ["public", "department", "private"],
    },
  },
} as const
