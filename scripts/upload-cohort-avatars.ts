/**
 * 공채13기 프로필 사진 일괄 업로드 스크립트
 *
 * 사용법: npx tsx scripts/upload-cohort-avatars.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        if (key && valueParts.length > 0) {
          process.env[key.trim()] = valueParts.join("=").trim();
        }
      }
    }
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const PHOTOS_DIR = "C:\\Users\\USER\\Downloads\\thumb\\large";
const COHORT_NAME = "공채 13기";

interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

async function getCohortUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from("users")
    .select(`
      id,
      name,
      email,
      avatar_url,
      profiles!inner(cohort_id, cohorts!inner(name))
    `)
    .is("deleted_at", null);

  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }

  // Filter for cohort 13
  return (data || [])
    .filter((u: any) => {
      const cohortName = u.profiles?.cohorts?.name;
      return cohortName === COHORT_NAME;
    })
    .map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      avatar_url: u.avatar_url,
    }));
}

function findPhotoFile(userName: string): string | null {
  const photoPath = path.join(PHOTOS_DIR, `${userName}.jpg`);
  if (fs.existsSync(photoPath)) {
    return photoPath;
  }
  return null;
}

async function uploadAvatar(userId: string, photoPath: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const fileBuffer = fs.readFileSync(photoPath);
    const filename = `${userId}/avatar-${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filename, fileBuffer, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(filename);

    // Update user's avatar_url
    const { error: updateError } = await supabase
      .from("users")
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true, url: publicUrl };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

async function main() {
  console.log(`\n📸 ${COHORT_NAME} 프로필 사진 업로드 시작\n`);
  console.log(`사진 폴더: ${PHOTOS_DIR}\n`);

  // Get cohort users
  const users = await getCohortUsers();
  console.log(`총 ${users.length}명의 ${COHORT_NAME} 멤버 발견\n`);

  // Filter out test users
  const realUsers = users.filter(u =>
    !u.name.includes("테스트") &&
    !u.name.includes("관리자") &&
    !u.email.includes("test") &&
    !u.email.includes("admin")
  );
  console.log(`실제 사용자: ${realUsers.length}명 (테스트/관리자 계정 제외)\n`);

  let uploaded = 0;
  let skipped = 0;
  let noPhoto = 0;
  let alreadyHas = 0;

  for (const user of realUsers) {
    const photoPath = findPhotoFile(user.name);

    if (!photoPath) {
      console.log(`❌ ${user.name}: 사진 파일 없음`);
      noPhoto++;
      continue;
    }

    if (user.avatar_url) {
      console.log(`⏭️  ${user.name}: 이미 프로필 사진 있음`);
      alreadyHas++;
      continue;
    }

    const result = await uploadAvatar(user.id, photoPath);

    if (result.success) {
      console.log(`✅ ${user.name}: 업로드 성공`);
      uploaded++;
    } else {
      console.log(`❌ ${user.name}: 업로드 실패 - ${result.error}`);
      skipped++;
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`📊 결과 요약`);
  console.log(`${"=".repeat(50)}`);
  console.log(`✅ 업로드 성공: ${uploaded}명`);
  console.log(`⏭️  이미 등록됨: ${alreadyHas}명`);
  console.log(`📷 사진 없음: ${noPhoto}명`);
  console.log(`❌ 업로드 실패: ${skipped}명`);
  console.log(`${"=".repeat(50)}\n`);
}

main().catch(console.error);
