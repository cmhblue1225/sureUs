import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

/**
 * 사용자가 관리자인지 확인
 */
export async function isAdmin(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<boolean> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .single();

  return profile?.role === "admin";
}

/**
 * 현재 로그인한 사용자가 관리자인지 확인
 */
export async function checkIsAdmin(
  supabase: SupabaseClient<Database>
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  return isAdmin(supabase, user.id);
}

/**
 * 관리자 권한이 필요한 API에서 사용
 * 관리자가 아니면 에러를 throw
 */
export async function requireAdmin(
  supabase: SupabaseClient<Database>
): Promise<{ userId: string }> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("인증이 필요합니다.");
  }

  const isAdminUser = await isAdmin(supabase, user.id);

  if (!isAdminUser) {
    throw new Error("관리자 권한이 필요합니다.");
  }

  return { userId: user.id };
}

/**
 * 인증된 사용자 정보와 역할을 함께 가져오기
 */
export async function getAuthenticatedUser(
  supabase: SupabaseClient<Database>
): Promise<{
  userId: string;
  isAdmin: boolean;
} | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  return {
    userId: user.id,
    isAdmin: profile?.role === "admin",
  };
}
