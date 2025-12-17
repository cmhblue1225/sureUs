import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateTagOverlap, getCommonTags } from "@/lib/matching/algorithm";
import type { Database, VisibilitySettings } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileWithUser = ProfileRow & { users: { id: string; name: string; email: string; avatar_url: string | null; deleted_at: string | null } };

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const department = searchParams.get("department");
    const jobRole = searchParams.get("jobRole");
    const location = searchParams.get("location");
    const tagsParam = searchParams.get("tags");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = (page - 1) * limit;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // Get current user's profile and tags for similarity calculation
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single<{ id: string }>();

    let userTags: string[] = [];
    if (userProfile) {
      const { data: tags } = await supabase
        .from("profile_tags")
        .select("tag_name")
        .eq("profile_id", userProfile.id);
      userTags = tags?.map((t: { tag_name: string }) => t.tag_name) || [];
    }

    // Build query for profiles
    let profileQuery = supabase
      .from("profiles")
      .select(`
        *,
        users!inner(id, name, email, avatar_url, deleted_at)
      `, { count: "exact" })
      .eq("is_profile_complete", true)
      .is("users.deleted_at", null)
      .neq("user_id", user.id);

    // Apply filters
    if (department) {
      profileQuery = profileQuery.eq("department", department);
    }

    if (jobRole) {
      profileQuery = profileQuery.eq("job_role", jobRole);
    }

    if (location) {
      profileQuery = profileQuery.eq("office_location", location);
    }

    // Execute query
    const { data: profiles, error: profilesError, count } = await profileQuery
      .range(offset, offset + limit - 1);

    if (profilesError) {
      console.error("Search profiles error:", profilesError);
      return NextResponse.json(
        { success: false, error: "검색에 실패했습니다." },
        { status: 500 }
      );
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          users: [],
          pagination: {
            page,
            limit,
            total: 0,
            hasMore: false,
          },
        },
      });
    }

    // Get tags for all profiles
    const typedProfiles = profiles as ProfileWithUser[];
    const profileIds = typedProfiles.map((p) => p.id);
    const { data: profileTags } = await supabase
      .from("profile_tags")
      .select("profile_id, tag_name")
      .in("profile_id", profileIds);

    const tagsByProfileId = new Map<string, string[]>();
    profileTags?.forEach((t: { profile_id: string; tag_name: string }) => {
      const tags = tagsByProfileId.get(t.profile_id) || [];
      tags.push(t.tag_name);
      tagsByProfileId.set(t.profile_id, tags);
    });

    // Filter by tags if specified
    const filterTags = tagsParam ? tagsParam.split(",").map((t) => t.trim()) : [];

    // Filter by name/query
    let filteredProfiles = typedProfiles;

    if (query) {
      const lowerQuery = query.toLowerCase();
      filteredProfiles = typedProfiles.filter((profile) => {
        const userData = profile.users as { name: string };
        const tags = tagsByProfileId.get(profile.id) || [];

        return (
          userData.name.toLowerCase().includes(lowerQuery) ||
          profile.department.toLowerCase().includes(lowerQuery) ||
          profile.job_role.toLowerCase().includes(lowerQuery) ||
          tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
        );
      });
    }

    // Filter by tags
    if (filterTags.length > 0) {
      filteredProfiles = filteredProfiles.filter((profile) => {
        const tags = tagsByProfileId.get(profile.id) || [];
        return filterTags.some((filterTag) => tags.includes(filterTag));
      });
    }

    // Map to response format with visibility filtering
    const users = filteredProfiles.map((profile) => {
      const userData = profile.users as { id: string; name: string; avatar_url: string | null };
      const profileTagList = tagsByProfileId.get(profile.id) || [];
      const visibility = (profile.visibility_settings || {}) as Partial<VisibilitySettings>;

      // Calculate similarity if user has tags
      let similarity = undefined;
      if (userTags.length > 0 && profileTagList.length > 0) {
        const tagOverlap = calculateTagOverlap(userTags, profileTagList);
        const commonTags = getCommonTags(userTags, profileTagList);

        similarity = {
          score: Math.round(tagOverlap * 100) / 100,
          commonTags,
          matchReasons: commonTags.length > 0
            ? [`${commonTags.slice(0, 3).join(", ")} 등 관심사가 겹칩니다`]
            : [],
        };
      }

      // Apply visibility filtering
      return {
        id: userData.id,
        name: userData.name,
        department: visibility.department !== "private" ? profile.department : undefined,
        jobRole: visibility.job_role !== "private" ? profile.job_role : undefined,
        officeLocation: visibility.office_location !== "private" ? profile.office_location : undefined,
        avatarUrl: userData.avatar_url || undefined,
        hobbies: visibility.hobbies !== "private" ? profileTagList : [],
        mbti: visibility.mbti !== "private" ? profile.mbti : undefined,
        similarity,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total: count || 0,
          hasMore: (count || 0) > offset + limit,
        },
      },
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
