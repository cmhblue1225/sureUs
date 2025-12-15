-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_view_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches_cache ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Users Policies
-- ============================================

CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_delete_own" ON users
  FOR DELETE USING (auth.uid() = id);

-- Allow users to view basic info of other users (for search/matching)
CREATE POLICY "users_select_others_basic" ON users
  FOR SELECT USING (deleted_at IS NULL);

-- ============================================
-- Profiles Policies
-- ============================================

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "profiles_select_others_complete" ON profiles
  FOR SELECT USING (
    is_profile_complete = TRUE
    AND user_id != auth.uid()
    AND user_id IN (SELECT id FROM users WHERE deleted_at IS NULL)
  );

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "profiles_delete_own" ON profiles
  FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- Profile Tags Policies
-- ============================================

CREATE POLICY "tags_select_own" ON profile_tags
  FOR SELECT USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "tags_select_others_visible" ON profile_tags
  FOR SELECT USING (
    profile_id IN (
      SELECT id FROM profiles
      WHERE is_profile_complete = TRUE
        AND (visibility_settings->>'hobbies')::text != 'private'
    )
  );

CREATE POLICY "tags_insert_own" ON profile_tags
  FOR INSERT WITH CHECK (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "tags_update_own" ON profile_tags
  FOR UPDATE USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "tags_delete_own" ON profile_tags
  FOR DELETE USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- ============================================
-- Embeddings Policies
-- ============================================

-- Embeddings are treated as personal data - only own access
CREATE POLICY "embeddings_select_own" ON embeddings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "embeddings_insert_own" ON embeddings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "embeddings_update_own" ON embeddings
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "embeddings_delete_own" ON embeddings
  FOR DELETE USING (user_id = auth.uid());

-- Service role can manage all embeddings (for API routes)
CREATE POLICY "embeddings_service_all" ON embeddings
  FOR ALL USING (
    (SELECT auth.jwt()->>'role') = 'service_role'
  );

-- ============================================
-- Preferences Policies
-- ============================================

CREATE POLICY "preferences_all_own" ON preferences
  FOR ALL USING (user_id = auth.uid());

-- ============================================
-- Profile View Logs Policies
-- ============================================

CREATE POLICY "view_logs_select_involved" ON profile_view_logs
  FOR SELECT USING (
    viewer_id = auth.uid() OR viewed_id = auth.uid()
  );

CREATE POLICY "view_logs_insert_viewer" ON profile_view_logs
  FOR INSERT WITH CHECK (viewer_id = auth.uid());

-- ============================================
-- Matches Cache Policies
-- ============================================

CREATE POLICY "matches_select_involved" ON matches_cache
  FOR SELECT USING (
    user_id = auth.uid() OR matched_user_id = auth.uid()
  );

-- Service role can manage matches cache
CREATE POLICY "matches_service_all" ON matches_cache
  FOR ALL USING (
    (SELECT auth.jwt()->>'role') = 'service_role'
  );
