import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/utils/auth";
import { getEffectiveCohortId } from "@/lib/utils/cohort";
import type { ShareRequest, GeneratedTeam, TeamMember } from "@/lib/team-grouping/types";
import { findOrgHierarchyByName } from "@/lib/constants/organization";

/**
 * POST /api/team-grouping/share
 *
 * 조 편성 결과 공유 API (관리자 전용)
 * - announcement: 공지사항으로 공유
 * - messages: 개별 메시지로 공유
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 관리자 권한 확인
    const isAdmin = await checkIsAdmin(supabase);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    // 요청 본문 파싱
    const body: ShareRequest = await request.json();
    const { groupingId, shareType, announcementTitle, messageTemplate } = body;

    if (!groupingId) {
      return NextResponse.json(
        { success: false, error: "조 편성 ID가 필요합니다." },
        { status: 400 }
      );
    }

    if (!shareType || !["announcement", "messages"].includes(shareType)) {
      return NextResponse.json(
        { success: false, error: "공유 방식을 선택해주세요." },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // 조 편성 결과 조회
    const { data: grouping, error: groupingError } = await serviceClient
      .from("team_groupings")
      .select("*")
      .eq("id", groupingId)
      .single();

    if (groupingError || !grouping) {
      return NextResponse.json(
        { success: false, error: "조 편성 결과를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const teams = grouping.teams_json as unknown as GeneratedTeam[];
    const cohortId = grouping.cohort_id;

    if (shareType === "announcement") {
      // 공지사항으로 공유
      const title = announcementTitle || "조 편성 결과 안내";
      const content = generateAnnouncementContent(teams, grouping.criteria_text);

      const { data: announcement, error: announcementError } = await serviceClient
        .from("announcements")
        .insert({
          cohort_id: cohortId,
          user_id: user.id,
          title,
          content,
          category: "notice",
          is_important: true,
          is_pinned: false,
        })
        .select("id")
        .single();

      if (announcementError) {
        console.error("Error creating announcement:", announcementError);
        return NextResponse.json(
          { success: false, error: "공지사항 생성에 실패했습니다." },
          { status: 500 }
        );
      }

      // 조 편성 레코드 업데이트
      await serviceClient
        .from("team_groupings")
        .update({
          shared_via: "announcement",
          shared_at: new Date().toISOString(),
          announcement_id: announcement.id,
        })
        .eq("id", groupingId);

      return NextResponse.json({
        success: true,
        data: {
          sharedVia: "announcement",
          announcementId: announcement.id,
        },
      });
    } else {
      // 개별 메시지로 공유
      const messageCount = await sendTeamMessages(
        serviceClient,
        user.id,
        teams,
        messageTemplate
      );

      // 조 편성 레코드 업데이트
      await serviceClient
        .from("team_groupings")
        .update({
          shared_via: "messages",
          shared_at: new Date().toISOString(),
        })
        .eq("id", groupingId);

      return NextResponse.json({
        success: true,
        data: {
          sharedVia: "messages",
          messageCount,
        },
      });
    }
  } catch (error) {
    console.error("Team grouping share error:", error);
    return NextResponse.json(
      { success: false, error: "공유 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 부서명에서 루트 레벨(연구소/센터/본부)만 추출
 */
function getRootDepartment(department: string | undefined): string | undefined {
  if (!department) return undefined;

  // "A > B > C" 형식인 경우 첫 번째 부분 추출
  if (department.includes(" > ")) {
    return department.split(" > ")[0];
  }

  // 단일 이름인 경우 해당 조직의 상위 찾기
  const hierarchy = findOrgHierarchyByName(department);
  if (hierarchy) {
    return hierarchy.level1;
  }

  return department;
}

/**
 * 공지사항 본문 생성 (마크다운 없이 깔끔하게)
 */
function generateAnnouncementContent(
  teams: GeneratedTeam[],
  _criteriaText: string
): string {
  const totalMembers = teams.reduce((sum, t) => sum + t.members.length, 0);

  let content = `📋 조 편성 결과\n`;
  content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  teams.forEach((team, index) => {
    content += `🏷️ ${team.teamName}\n`;
    team.members.forEach((member, memberIndex) => {
      const rootDept = getRootDepartment(member.department);
      const dept = rootDept ? ` - ${rootDept}` : "";
      const bullet = memberIndex === team.members.length - 1 ? "└" : "├";
      content += `   ${bullet} ${member.name}${dept}\n`;
    });
    if (index < teams.length - 1) {
      content += `\n`;
    }
  });

  content += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  content += `📊 총 ${teams.length}개 조, ${totalMembers}명`;

  return content;
}

/**
 * 개별 메시지 전송
 */
async function sendTeamMessages(
  serviceClient: ReturnType<typeof createServiceClient>,
  senderId: string,
  teams: GeneratedTeam[],
  template?: string
): Promise<number> {
  let messageCount = 0;

  for (const team of teams) {
    const teamMemberNames = team.members.map((m) => m.name).join(", ");
    const messageContent =
      template ||
      `안녕하세요! 조 편성 결과를 안내드립니다.\n\n` +
        `**${team.teamName}** 팀원: ${teamMemberNames}\n\n` +
        `좋은 활동 되세요!`;

    for (const member of team.members) {
      try {
        // 기존 대화 찾기 또는 새로 생성
        const { data: existingConv } = await serviceClient
          .from("conversations")
          .select("id")
          .or(
            `and(participant_1.eq.${senderId},participant_2.eq.${member.userId}),and(participant_1.eq.${member.userId},participant_2.eq.${senderId})`
          )
          .single();

        let conversationId: string;

        if (existingConv) {
          conversationId = existingConv.id;
        } else {
          // 새 대화 생성
          const { data: newConv, error: convError } = await serviceClient
            .from("conversations")
            .insert({
              participant_1: senderId,
              participant_2: member.userId,
            })
            .select("id")
            .single();

          if (convError || !newConv) {
            console.error("Error creating conversation:", convError);
            continue;
          }
          conversationId = newConv.id;
        }

        // 메시지 전송
        const { error: messageError } = await serviceClient
          .from("messages")
          .insert({
            conversation_id: conversationId,
            sender_id: senderId,
            content: messageContent,
          });

        if (!messageError) {
          messageCount++;

          // 대화 업데이트
          await serviceClient
            .from("conversations")
            .update({ last_message_at: new Date().toISOString() })
            .eq("id", conversationId);
        }
      } catch (err) {
        console.error(`Error sending message to ${member.userId}:`, err);
      }
    }
  }

  return messageCount;
}
