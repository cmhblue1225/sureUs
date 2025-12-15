import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { id, email, name } = await request.json();

    if (!id || !email || !name) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("users") as any).insert({
      id,
      email,
      name,
    });

    if (error) {
      // Ignore duplicate key errors (user might already exist)
      if (error.code === "23505") {
        return NextResponse.json({ success: true });
      }
      console.error("Failed to create user record:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Create user API error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
