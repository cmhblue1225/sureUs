import { NextResponse, NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string; postId: string }>;
}

// GET /api/clubs/[id]/posts/[postId]/comments - 댓글 목록 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: clubId, postId } = await params;
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
        { success: false, error: "동호회 회원만 댓글을 볼 수 있습니다." },
        { status: 403 }
      );
    }

    // Check post exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: post } = await (serviceClient
      .from("club_posts")
      .select("id")
      .eq("id", postId)
      .eq("club_id", clubId)
      .single() as any);

    if (!post) {
      return NextResponse.json(
        { success: false, error: "게시물을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // Get comments
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: comments, error: commentsError, count } = await (serviceClient
      .from("club_comments")
      .select(`
        *,
        author:users!club_comments_author_id_fkey(id, name, avatar_url)
      `, { count: "exact" })
      .eq("post_id", postId)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1) as any);

    if (commentsError) {
      console.error("Comments fetch error:", commentsError);
      return NextResponse.json(
        { success: false, error: "댓글을 불러올 수 없습니다." },
        { status: 500 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const commentsWithMeta = comments?.map((comment: any) => ({
      ...comment,
      isAuthor: comment.author_id === user.id,
      isLeader: membership.role === "leader",
    })) || [];

    return NextResponse.json({
      success: true,
      data: {
        comments: commentsWithMeta,
        pagination: {
          page,
          limit,
          total: count || 0,
          hasMore: (count || 0) > offset + limit,
        },
      },
    });
  } catch (error) {
    console.error("Comments API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST /api/clubs/[id]/posts/[postId]/comments - 댓글 작성
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: clubId, postId } = await params;
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
        { success: false, error: "동호회 회원만 댓글을 작성할 수 있습니다." },
        { status: 403 }
      );
    }

    // Check post exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: post } = await (serviceClient
      .from("club_posts")
      .select("id")
      .eq("id", postId)
      .eq("club_id", clubId)
      .single() as any);

    if (!post) {
      return NextResponse.json(
        { success: false, error: "게시물을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content || content.trim() === "") {
      return NextResponse.json(
        { success: false, error: "댓글 내용은 필수입니다." },
        { status: 400 }
      );
    }

    // Create comment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: comment, error: commentError } = await (serviceClient
      .from("club_comments") as any)
      .insert({
        post_id: postId,
        author_id: user.id,
        content: content.trim(),
      })
      .select(`
        *,
        author:users!club_comments_author_id_fkey(id, name, avatar_url)
      `)
      .single();

    if (commentError) {
      console.error("Comment create error:", commentError);
      return NextResponse.json(
        { success: false, error: "댓글 작성 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...comment,
        isAuthor: true,
      },
    });
  } catch (error) {
    console.error("Comment create API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
