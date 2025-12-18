import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const ADMIN_COHORT_COOKIE_NAME = "admin_selected_cohort";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * 관리자가 선택한 기수 ID를 쿠키에서 가져옵니다.
 * @returns 선택된 기수 ID 또는 null
 */
export async function getAdminSelectedCohort(): Promise<string | null> {
  const cookieStore = await cookies();
  const cohortId = cookieStore.get(ADMIN_COHORT_COOKIE_NAME)?.value;
  return cohortId || null;
}

/**
 * 관리자의 선택된 기수를 쿠키에 저장합니다.
 * @param cohortId 선택할 기수 ID
 */
export async function setAdminSelectedCohort(cohortId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COHORT_COOKIE_NAME, cohortId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

/**
 * 관리자의 선택된 기수 쿠키를 삭제합니다.
 */
export async function clearAdminSelectedCohort(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COHORT_COOKIE_NAME);
}

/**
 * 사용자의 기수 ID를 프로필에서 가져옵니다.
 * @param supabase Supabase 클라이언트
 * @param userId 사용자 ID
 * @returns 기수 ID 또는 null
 */
export async function getUserCohortId(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("cohort_id")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.cohort_id;
}

/**
 * 사용자의 역할(role)을 가져옵니다.
 * @param supabase Supabase 클라이언트
 * @param userId 사용자 ID
 * @returns role (admin/user) 또는 null
 */
export async function getUserRole(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.role;
}

/**
 * 현재 사용자에게 적용되는 effective cohort ID를 반환합니다.
 * - 관리자: 쿠키에서 선택된 기수 (미선택 시 null)
 * - 일반 사용자: 프로필의 cohort_id
 * @param supabase Supabase 클라이언트
 * @param userId 사용자 ID
 * @param isAdmin 관리자 여부
 * @returns 기수 ID 또는 null
 */
export async function getEffectiveCohortId(
  supabase: SupabaseClient<Database>,
  userId: string,
  isAdmin: boolean
): Promise<string | null> {
  if (isAdmin) {
    return await getAdminSelectedCohort();
  }

  return await getUserCohortId(supabase, userId);
}

/**
 * 사용자가 관리자인지 확인합니다.
 * @param supabase Supabase 클라이언트
 * @param userId 사용자 ID
 * @returns 관리자 여부
 */
export async function isUserAdmin(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<boolean> {
  const role = await getUserRole(supabase, userId);
  return role === "admin";
}

/**
 * 두 사용자가 같은 기수인지 확인합니다.
 * @param supabase Supabase 클라이언트
 * @param userId1 첫 번째 사용자 ID
 * @param userId2 두 번째 사용자 ID
 * @returns 같은 기수 여부
 */
export async function isSameCohort(
  supabase: SupabaseClient<Database>,
  userId1: string,
  userId2: string
): Promise<boolean> {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("user_id, cohort_id")
    .in("user_id", [userId1, userId2]);

  if (error || !profiles || profiles.length !== 2) {
    return false;
  }

  const cohort1 = profiles.find((p) => p.user_id === userId1)?.cohort_id;
  const cohort2 = profiles.find((p) => p.user_id === userId2)?.cohort_id;

  // 둘 다 cohort_id가 있고 같은 경우에만 true
  return cohort1 !== null && cohort2 !== null && cohort1 === cohort2;
}

export interface CohortInfo {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  userCount?: number;
}

/**
 * 기수 목록을 가져옵니다.
 * @param supabase Supabase 클라이언트 (service role 권장)
 * @param includeInactive 비활성 기수 포함 여부
 * @returns 기수 목록
 */
export async function getCohorts(
  supabase: SupabaseClient<Database>,
  includeInactive: boolean = false
): Promise<CohortInfo[]> {
  let query = supabase
    .from("cohorts")
    .select("id, name, description, is_active")
    .order("created_at", { ascending: false });

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data.map((cohort) => ({
    id: cohort.id,
    name: cohort.name,
    description: cohort.description,
    isActive: cohort.is_active ?? true,
  }));
}
