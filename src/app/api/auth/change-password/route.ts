import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 현재 사용자 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await request.json();

    // 유효성 검사
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: "현재 비밀번호와 새 비밀번호를 입력해주세요." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: "비밀번호는 8자 이상이어야 합니다." },
        { status: 400 }
      );
    }

    // 현재 비밀번호 확인 (재로그인으로 검증)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (signInError) {
      return NextResponse.json(
        { success: false, error: "현재 비밀번호가 일치하지 않습니다." },
        { status: 400 }
      );
    }

    // 비밀번호 변경
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return NextResponse.json(
        { success: false, error: "비밀번호 변경에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password change error:", error);
    return NextResponse.json(
      { success: false, error: "비밀번호 변경 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
