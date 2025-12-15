-- ============================================
-- sureNet Database Schema
-- Supabase (PostgreSQL + pgvector + RLS)
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- ENUM Types for consistency
-- ============================================

-- Visibility levels for profile fields
CREATE TYPE visibility_level AS ENUM ('public', 'department', 'private');

-- ============================================
-- Core Tables
-- ============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Profiles table (survey data)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Basic fields
  department TEXT NOT NULL,
  job_role TEXT NOT NULL,
  office_location TEXT NOT NULL,
  mbti TEXT,

  -- Text fields for embedding generation
  collaboration_style TEXT,
  strengths TEXT,
  preferred_people_type TEXT,

  -- Visibility settings (JSONB for flexibility)
  visibility_settings JSONB DEFAULT '{
    "department": "public",
    "job_role": "public",
    "office_location": "public",
    "mbti": "public",
    "hobbies": "public",
    "collaboration_style": "public",
    "strengths": "public",
    "preferred_people_type": "public"
  }'::jsonb,

  -- Metadata
  is_profile_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Profile tags (hobbies/interests)
CREATE TABLE profile_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  tag_category TEXT DEFAULT 'hobby',
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(profile_id, tag_name)
);

-- Embeddings table for similarity matching
CREATE TABLE embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Combined embedding from text fields (1536 dimensions for text-embedding-3-small)
  combined_embedding VECTOR(1536),

  -- Individual field embeddings for explainability
  collaboration_style_embedding VECTOR(1536),
  strengths_embedding VECTOR(1536),
  preferred_people_type_embedding VECTOR(1536),

  -- Metadata for tracking
  source_text_hash TEXT,
  generated_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User preferences for matching
CREATE TABLE preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Matching preferences
  preferred_departments TEXT[],
  preferred_job_roles TEXT[],
  preferred_locations TEXT[],
  preferred_mbti_types TEXT[],

  -- Weight adjustments (0.0 - 1.0, NULL uses default)
  embedding_weight DECIMAL(3,2) DEFAULT 0.45,
  tag_weight DECIMAL(3,2) DEFAULT 0.35,
  preference_weight DECIMAL(3,2) DEFAULT 0.20,

  -- Exclusions
  excluded_user_ids UUID[],

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Audit log for profile views
CREATE TABLE profile_view_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  view_context TEXT,
  viewed_at TIMESTAMPTZ DEFAULT now()
);

-- Matches cache for performance (optional but recommended)
CREATE TABLE matches_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  matched_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Score breakdown
  total_score DECIMAL(5,4) NOT NULL,
  embedding_similarity DECIMAL(5,4),
  tag_overlap_score DECIMAL(5,4),
  preference_match_score DECIMAL(5,4),

  -- Explanation data (JSON for flexibility)
  explanation JSONB,
  common_tags TEXT[],
  suggested_topics TEXT[],

  -- Cache management
  computed_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours'),

  UNIQUE(user_id, matched_user_id)
);

-- ============================================
-- Indexes for Performance
-- ============================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

-- Profiles
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_department ON profiles(department);
CREATE INDEX idx_profiles_job_role ON profiles(job_role);
CREATE INDEX idx_profiles_office_location ON profiles(office_location);
CREATE INDEX idx_profiles_complete ON profiles(is_profile_complete);

-- Profile tags
CREATE INDEX idx_profile_tags_profile ON profile_tags(profile_id);
CREATE INDEX idx_profile_tags_name ON profile_tags(tag_name);
CREATE INDEX idx_profile_tags_category ON profile_tags(tag_category);

-- Embeddings (IVFFlat for vector similarity search)
CREATE INDEX idx_embeddings_combined ON embeddings
  USING ivfflat (combined_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_embeddings_collaboration ON embeddings
  USING ivfflat (collaboration_style_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_embeddings_strengths ON embeddings
  USING ivfflat (strengths_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_embeddings_preferred_type ON embeddings
  USING ivfflat (preferred_people_type_embedding vector_cosine_ops) WITH (lists = 100);

-- Preferences
CREATE INDEX idx_preferences_user_id ON preferences(user_id);

-- Profile view logs
CREATE INDEX idx_view_logs_viewer ON profile_view_logs(viewer_id);
CREATE INDEX idx_view_logs_viewed ON profile_view_logs(viewed_id);
CREATE INDEX idx_view_logs_time ON profile_view_logs(viewed_at);

-- Matches cache
CREATE INDEX idx_matches_user ON matches_cache(user_id);
CREATE INDEX idx_matches_score ON matches_cache(total_score DESC);
CREATE INDEX idx_matches_expires ON matches_cache(expires_at);

-- ============================================
-- Trigger to update timestamps
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_embeddings_updated_at
  BEFORE UPDATE ON embeddings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_preferences_updated_at
  BEFORE UPDATE ON preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Helper Functions
-- ============================================

-- Function to check field visibility
CREATE OR REPLACE FUNCTION check_field_visibility(
  target_user_id UUID,
  viewer_user_id UUID,
  field_name TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  target_visibility TEXT;
  target_department TEXT;
  viewer_department TEXT;
BEGIN
  IF target_user_id = viewer_user_id THEN
    RETURN TRUE;
  END IF;

  SELECT
    p.visibility_settings ->> field_name,
    p.department
  INTO target_visibility, target_department
  FROM profiles p WHERE p.user_id = target_user_id;

  CASE target_visibility
    WHEN 'public' THEN RETURN TRUE;
    WHEN 'private' THEN RETURN FALSE;
    WHEN 'department' THEN
      SELECT department INTO viewer_department
      FROM profiles WHERE user_id = viewer_user_id;
      RETURN target_department = viewer_department;
    ELSE RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate tag overlap score
CREATE OR REPLACE FUNCTION calculate_tag_overlap(
  user1_id UUID,
  user2_id UUID
) RETURNS DECIMAL AS $$
DECLARE
  common_count INTEGER;
  total_unique INTEGER;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE t1.tag_name = t2.tag_name),
    COUNT(DISTINCT COALESCE(t1.tag_name, t2.tag_name))
  INTO common_count, total_unique
  FROM
    (SELECT tag_name FROM profile_tags pt
     JOIN profiles p ON pt.profile_id = p.id
     WHERE p.user_id = user1_id) t1
  FULL OUTER JOIN
    (SELECT tag_name FROM profile_tags pt
     JOIN profiles p ON pt.profile_id = p.id
     WHERE p.user_id = user2_id) t2
  ON t1.tag_name = t2.tag_name;

  IF total_unique = 0 THEN RETURN 0; END IF;
  RETURN common_count::DECIMAL / total_unique;
END;
$$ LANGUAGE plpgsql;

-- Function to get common tags between two users
CREATE OR REPLACE FUNCTION get_common_tags(
  user1_id UUID,
  user2_id UUID
) RETURNS TEXT[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT DISTINCT t1.tag_name
    FROM profile_tags t1
    JOIN profiles p1 ON t1.profile_id = p1.id
    JOIN profiles p2 ON p2.user_id = user2_id
    JOIN profile_tags t2 ON t2.profile_id = p2.id AND t2.tag_name = t1.tag_name
    WHERE p1.user_id = user1_id
  );
END;
$$ LANGUAGE plpgsql;
