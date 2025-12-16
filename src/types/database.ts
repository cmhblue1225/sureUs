export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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
  // 새 필드
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

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          department: string;
          job_role: string;
          office_location: string;
          mbti: string | null;
          collaboration_style: string | null;
          strengths: string | null;
          preferred_people_type: string | null;
          // 새 필드
          living_location: string | null;
          hometown: string | null;
          education: string | null;
          work_description: string | null;
          tech_stack: string | null;
          favorite_food: string | null;
          age_range: string | null;
          interests: string | null;
          career_goals: string | null;
          certifications: string | null;
          languages: string | null;
          // 시스템 필드
          visibility_settings: VisibilitySettings;
          is_profile_complete: boolean;
          onboarding_completed: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          department: string;
          job_role: string;
          office_location: string;
          mbti?: string | null;
          collaboration_style?: string | null;
          strengths?: string | null;
          preferred_people_type?: string | null;
          // 새 필드
          living_location?: string | null;
          hometown?: string | null;
          education?: string | null;
          work_description?: string | null;
          tech_stack?: string | null;
          favorite_food?: string | null;
          age_range?: string | null;
          interests?: string | null;
          career_goals?: string | null;
          certifications?: string | null;
          languages?: string | null;
          // 시스템 필드
          visibility_settings?: VisibilitySettings;
          is_profile_complete?: boolean;
          onboarding_completed?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          department?: string;
          job_role?: string;
          office_location?: string;
          mbti?: string | null;
          collaboration_style?: string | null;
          strengths?: string | null;
          preferred_people_type?: string | null;
          // 새 필드
          living_location?: string | null;
          hometown?: string | null;
          education?: string | null;
          work_description?: string | null;
          tech_stack?: string | null;
          favorite_food?: string | null;
          age_range?: string | null;
          interests?: string | null;
          career_goals?: string | null;
          certifications?: string | null;
          languages?: string | null;
          // 시스템 필드
          visibility_settings?: VisibilitySettings;
          is_profile_complete?: boolean;
          onboarding_completed?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      profile_tags: {
        Row: {
          id: string;
          profile_id: string;
          tag_name: string;
          tag_category: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          tag_name: string;
          tag_category?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          tag_name?: string;
          tag_category?: string;
          created_at?: string;
        };
      };
      embeddings: {
        Row: {
          id: string;
          user_id: string;
          combined_embedding: number[] | null;
          collaboration_style_embedding: number[] | null;
          strengths_embedding: number[] | null;
          preferred_people_type_embedding: number[] | null;
          source_text_hash: string | null;
          generated_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          combined_embedding?: number[] | null;
          collaboration_style_embedding?: number[] | null;
          strengths_embedding?: number[] | null;
          preferred_people_type_embedding?: number[] | null;
          source_text_hash?: string | null;
          generated_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          combined_embedding?: number[] | null;
          collaboration_style_embedding?: number[] | null;
          strengths_embedding?: number[] | null;
          preferred_people_type_embedding?: number[] | null;
          source_text_hash?: string | null;
          generated_at?: string;
          updated_at?: string;
        };
      };
      preferences: {
        Row: {
          id: string;
          user_id: string;
          preferred_departments: string[] | null;
          preferred_job_roles: string[] | null;
          preferred_locations: string[] | null;
          preferred_mbti_types: string[] | null;
          embedding_weight: number;
          tag_weight: number;
          preference_weight: number;
          excluded_user_ids: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          preferred_departments?: string[] | null;
          preferred_job_roles?: string[] | null;
          preferred_locations?: string[] | null;
          preferred_mbti_types?: string[] | null;
          embedding_weight?: number;
          tag_weight?: number;
          preference_weight?: number;
          excluded_user_ids?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          preferred_departments?: string[] | null;
          preferred_job_roles?: string[] | null;
          preferred_locations?: string[] | null;
          preferred_mbti_types?: string[] | null;
          embedding_weight?: number;
          tag_weight?: number;
          preference_weight?: number;
          excluded_user_ids?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      profile_view_logs: {
        Row: {
          id: string;
          viewer_id: string;
          viewed_id: string;
          view_context: string | null;
          viewed_at: string;
        };
        Insert: {
          id?: string;
          viewer_id: string;
          viewed_id: string;
          view_context?: string | null;
          viewed_at?: string;
        };
        Update: {
          id?: string;
          viewer_id?: string;
          viewed_id?: string;
          view_context?: string | null;
          viewed_at?: string;
        };
      };
      matches_cache: {
        Row: {
          id: string;
          user_id: string;
          matched_user_id: string;
          total_score: number;
          embedding_similarity: number | null;
          tag_overlap_score: number | null;
          preference_match_score: number | null;
          explanation: Json | null;
          common_tags: string[] | null;
          suggested_topics: string[] | null;
          computed_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          matched_user_id: string;
          total_score: number;
          embedding_similarity?: number | null;
          tag_overlap_score?: number | null;
          preference_match_score?: number | null;
          explanation?: Json | null;
          common_tags?: string[] | null;
          suggested_topics?: string[] | null;
          computed_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          matched_user_id?: string;
          total_score?: number;
          embedding_similarity?: number | null;
          tag_overlap_score?: number | null;
          preference_match_score?: number | null;
          explanation?: Json | null;
          common_tags?: string[] | null;
          suggested_topics?: string[] | null;
          computed_at?: string;
          expires_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      check_field_visibility: {
        Args: {
          target_user_id: string;
          viewer_user_id: string;
          field_name: string;
        };
        Returns: boolean;
      };
      calculate_tag_overlap: {
        Args: {
          user1_id: string;
          user2_id: string;
        };
        Returns: number;
      };
      get_common_tags: {
        Args: {
          user1_id: string;
          user2_id: string;
        };
        Returns: string[];
      };
    };
    Enums: {
      visibility_level: VisibilityLevel;
    };
  };
}
