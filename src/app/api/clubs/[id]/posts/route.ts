import { NextResponse, NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/clubs/[id]/posts - 게시물 목록 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: clubId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const serviceClient = createServiceClient();

    // Check membership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: membership } = await (serviceClient
      .from("club_members")
      .select("id")
      .eq("club_id", clubId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single() as any);

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "동호회 회원만 게시물을 볼 수 있습니다." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // post, announcement, poll, gallery
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (serviceClient
      .from("club_posts")
      .select(`
        *,
        author:users!club_posts_author_id_fkey(id, name, avatar_url)
      `, { count: "exact" })
      .eq("club_id", clubId)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false }) as any);

    if (type && type !== "all") {
      query = query.eq("type", type);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: posts, error: postsError, count } = await query;

    if (postsError) {
      console.error("Posts fetch error:", postsError);
      return NextResponse.json(
        { success: false, error: "게시물을 불러올 수 없습니다." },
        { status: 500 }
      );
    }

    // Get user's likes for these posts
    const postIds = posts?.map((p: { id: string }) => p.id) || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userLikes } = await (serviceClient
      .from("club_likes")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", postIds) as any);

    const likedPostIds = new Set(userLikes?.map((l: { post_id: string }) => l.post_id) || []);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const postsWithLikes = posts?.map((post: any) => ({
      ...post,
      isLiked: likedPostIds.has(post.id),
      isAuthor: post.author_id === user.id,
    })) || [];

    return NextResponse.json({
      success: true,
      data: {
        posts: postsWithLikes,
        pagination: {
          page,
          limit,
          total: count || 0,
          hasMore: (count || 0) > offset + limit,
        },
      },
    });
  } catch (error) {
    console.error("Posts API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST /api/clubs/[id]/posts - 게시물 작성
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: clubId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const serviceClient = createServiceClient();

    // Check membership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: membership } = await (serviceClient
      .from("club_members")
      .select("id, role")
      .eq("club_id", clubId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single() as any);

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "동호회 회원만 게시물을 작성할 수 있습니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type, title, content, imageUrls, isPinned, pollData } = body;

    // Validate
    if (!title) {
      return NextResponse.json(
        { success: false, error: "제목은 필수입니다." },
        { status: 400 }
      );
    }

    const validTypes = ["post", "announcement", "poll", "gallery"];
    if (type && !validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: "유효하지 않은 게시물 유형입니다." },
        { status: 400 }
      );
    }

    // Only leader can create announcements
    if (type === "announcement" && membership.role !== "leader") {
      return NextResponse.json(
        { success: false, error: "회장만 공지사항을 작성할 수 있습니다." },
        { status: 403 }
      );
    }

    // Only leader can pin posts
    if (isPinned && membership.role !== "leader") {
      return NextResponse.json(
        { success: false, error: "회장만 게시물을 고정할 수 있습니다." },
        { status: 403 }
      );
    }

    // Create post
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: post, error: postError } = await (serviceClient
      .from("club_posts") as any)
      .insert({
        club_id: clubId,
        author_id: user.id,
        type: type || "post",
        title,
        content: content || null,
        image_urls: imageUrls || [],
        is_pinned: isPinned || false,
      })
      .select(`
        *,
        author:users!club_posts_author_id_fkey(id, name, avatar_url)
      `)
      .single();

    if (postError) {
      console.error("Post create error:", postError);
      return NextResponse.json(
        { success: false, error: "게시물 작성 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // If poll type, create poll data
    if (type === "poll" && pollData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: pollError } = await (serviceClient
        .from("club_polls") as any)
        .insert({
          post_id: post.id,
          question: pollData.question || title,
          options: pollData.options || [],
          allow_multiple: pollData.allowMultiple || false,
          end_date: pollData.endDate || null,
        });

      if (pollError) {
        console.error("Poll create error:", pollError);
        // Delete the post if poll creation failed
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (serviceClient.from("club_posts") as any).delete().eq("id", post.id);
        return NextResponse.json(
          { success: false, error: "투표 생성 중 오류가 발생했습니다." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...post,
        isLiked: false,
        isAuthor: true,
      },
    });
  } catch (error) {
    console.error("Post create API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
