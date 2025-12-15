import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { calculateTagOverlap, getCommonTags } from "@/lib/matching/algorithm";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileWithUser = ProfileRow & { users: { id: string; name: string; avatar_url: string | null; deleted_at: string | null } };

interface NetworkNode {
  id: string;
  type: "user";
  data: {
    name: string;
    department?: string;
    jobRole?: string;
    avatarUrl?: string;
    isCurrentUser: boolean;
  };
  position: { x: number; y: number };
}

interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  data: {
    similarity: number;
    commonTags: string[];
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const topK = Math.min(parseInt(searchParams.get("topK") || "5"), 10);

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // Get current user's profile
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("*, users!inner(name, avatar_url)")
      .eq("user_id", user.id)
      .single<ProfileWithUser>();

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: "프로필을 먼저 작성해주세요." },
        { status: 400 }
      );
    }

    // Get user's tags
    const { data: userTags } = await supabase
      .from("profile_tags")
      .select("tag_name")
      .eq("profile_id", userProfile.id);

    const userTagList = userTags?.map((t: { tag_name: string }) => t.tag_name) || [];

    // Get all other profiles using service client
    const serviceClient = createServiceClient();

    const { data: otherProfiles } = await serviceClient
      .from("profiles")
      .select(`
        *,
        users!inner(id, name, avatar_url, deleted_at)
      `)
      .eq("is_profile_complete", true)
      .neq("user_id", user.id)
      .is("users.deleted_at", null)
      .limit(50);

    if (!otherProfiles || otherProfiles.length === 0) {
      // Return just the current user
      const nodes: NetworkNode[] = [
        {
          id: user.id,
          type: "user",
          data: {
            name: (userProfile.users as { name: string }).name,
            department: userProfile.department,
            jobRole: userProfile.job_role,
            avatarUrl: (userProfile.users as { avatar_url: string | null }).avatar_url || undefined,
            isCurrentUser: true,
          },
          position: { x: 300, y: 300 },
        },
      ];

      return NextResponse.json({
        success: true,
        data: { nodes, edges: [] },
      });
    }

    // Get tags for all profiles
    const profileIds = (otherProfiles as ProfileWithUser[]).map((p) => p.id);
    const { data: allTags } = await serviceClient
      .from("profile_tags")
      .select("profile_id, tag_name")
      .in("profile_id", profileIds);

    const tagsByProfileId = new Map<string, string[]>();
    allTags?.forEach((t: { profile_id: string; tag_name: string }) => {
      const tags = tagsByProfileId.get(t.profile_id) || [];
      tags.push(t.tag_name);
      tagsByProfileId.set(t.profile_id, tags);
    });

    // Calculate similarities and find top K for each user
    interface ScoredProfile {
      profile: ProfileWithUser;
      similarity: number;
      commonTags: string[];
    }

    const typedProfiles = otherProfiles as ProfileWithUser[];
    const scoredProfiles: ScoredProfile[] = typedProfiles.map((profile) => {
      const profileTags = tagsByProfileId.get(profile.id) || [];
      const similarity = calculateTagOverlap(userTagList, profileTags);
      const commonTags = getCommonTags(userTagList, profileTags);

      return { profile, similarity, commonTags };
    });

    // Sort by similarity and take top K
    scoredProfiles.sort((a, b) => b.similarity - a.similarity);
    const topProfiles = scoredProfiles.filter((p) => p.similarity > 0).slice(0, topK);

    // Create nodes
    const nodes: NetworkNode[] = [];
    const edges: NetworkEdge[] = [];

    // Add current user as center node
    nodes.push({
      id: user.id,
      type: "user",
      data: {
        name: (userProfile.users as { name: string }).name,
        department: userProfile.department,
        jobRole: userProfile.job_role,
        avatarUrl: (userProfile.users as { avatar_url: string | null }).avatar_url || undefined,
        isCurrentUser: true,
      },
      position: { x: 300, y: 300 },
    });

    // Add connected users in a circle around the center
    const angleStep = (2 * Math.PI) / Math.max(topProfiles.length, 1);
    const radius = 200;

    topProfiles.forEach((item, index) => {
      const userData = item.profile.users as { id: string; name: string; avatar_url: string | null };
      const angle = index * angleStep - Math.PI / 2;
      const x = 300 + Math.cos(angle) * radius;
      const y = 300 + Math.sin(angle) * radius;

      nodes.push({
        id: item.profile.user_id,
        type: "user",
        data: {
          name: userData.name,
          department: item.profile.department,
          jobRole: item.profile.job_role,
          avatarUrl: userData.avatar_url || undefined,
          isCurrentUser: false,
        },
        position: { x, y },
      });

      // Create edge to center user
      edges.push({
        id: `edge-${user.id}-${item.profile.user_id}`,
        source: user.id,
        target: item.profile.user_id,
        data: {
          similarity: Math.round(item.similarity * 100) / 100,
          commonTags: item.commonTags,
        },
      });
    });

    // Add edges between connected users if they share common tags
    for (let i = 0; i < topProfiles.length; i++) {
      for (let j = i + 1; j < topProfiles.length; j++) {
        const tagsI = tagsByProfileId.get(topProfiles[i].profile.id) || [];
        const tagsJ = tagsByProfileId.get(topProfiles[j].profile.id) || [];
        const similarity = calculateTagOverlap(tagsI, tagsJ);

        if (similarity > 0.3) {
          // Only show strong connections
          const commonTags = getCommonTags(tagsI, tagsJ);
          edges.push({
            id: `edge-${topProfiles[i].profile.user_id}-${topProfiles[j].profile.user_id}`,
            source: topProfiles[i].profile.user_id,
            target: topProfiles[j].profile.user_id,
            data: {
              similarity: Math.round(similarity * 100) / 100,
              commonTags,
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: { nodes, edges },
    });
  } catch (error) {
    console.error("Network API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
