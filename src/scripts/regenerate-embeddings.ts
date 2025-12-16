/**
 * 임베딩 일괄 재생성 스크립트
 *
 * 사용법: npx tsx src/scripts/regenerate-embeddings.ts
 *
 * 이 스크립트는:
 * 1. 임베딩이 없는 모든 프로필을 조회
 * 2. 각 프로필에 대해 임베딩 생성 (텍스트 필드 우선, 없으면 fallback 사용)
 * 3. embeddings 테이블에 저장
 */

import { createClient } from "@supabase/supabase-js";
import {
  generateProfileEmbeddings,
  type ProfileFallbackContext,
} from "../lib/openai/embeddings";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load environment variables from .env.local
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const envContent = readFileSync(envPath, "utf-8");

    envContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=").replace(/^["']|["']$/g, "");
          process.env[key] = value;
        }
      }
    });
  } catch (error) {
    console.log("Note: .env.local not found, using existing environment variables");
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

if (!openaiKey) {
  console.error("Missing OPENAI_API_KEY environment variable");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ProfileWithTags {
  id: string;
  user_id: string;
  department: string | null;
  job_role: string | null;
  office_location: string | null;
  mbti: string | null;
  collaboration_style: string | null;
  strengths: string | null;
  preferred_people_type: string | null;
  work_description: string | null;
  tech_stack: string | null;
  interests: string | null;
  career_goals: string | null;
  tags: string[];
}

async function getProfilesWithoutEmbeddings(): Promise<ProfileWithTags[]> {
  // 임베딩이 없는 프로필 조회
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select(`
      id,
      user_id,
      department,
      job_role,
      office_location,
      mbti,
      collaboration_style,
      strengths,
      preferred_people_type,
      work_description,
      tech_stack,
      interests,
      career_goals
    `);

  if (profileError) {
    console.error("Error fetching profiles:", profileError);
    throw profileError;
  }

  // 이미 임베딩이 있는 user_id 조회
  const { data: existingEmbeddings, error: embeddingError } = await supabase
    .from("embeddings")
    .select("user_id");

  if (embeddingError) {
    console.error("Error fetching embeddings:", embeddingError);
    throw embeddingError;
  }

  const usersWithEmbeddings = new Set(
    existingEmbeddings?.map((e) => e.user_id) || []
  );

  // 임베딩이 없는 프로필만 필터링
  const profilesWithoutEmbeddings =
    profiles?.filter((p) => !usersWithEmbeddings.has(p.user_id)) || [];

  // 각 프로필의 태그 조회
  const result: ProfileWithTags[] = [];

  for (const profile of profilesWithoutEmbeddings) {
    const { data: tags } = await supabase
      .from("profile_tags")
      .select("tag_name")
      .eq("profile_id", profile.id);

    result.push({
      ...profile,
      tags: tags?.map((t) => t.tag_name) || [],
    });
  }

  return result;
}

async function regenerateEmbeddings() {
  console.log("=".repeat(60));
  console.log("임베딩 일괄 재생성 스크립트 시작");
  console.log("=".repeat(60));
  console.log();

  try {
    const profiles = await getProfilesWithoutEmbeddings();

    console.log(`임베딩이 없는 프로필 수: ${profiles.length}`);
    console.log();

    if (profiles.length === 0) {
      console.log("모든 프로필에 임베딩이 존재합니다. 종료합니다.");
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < profiles.length; i++) {
      const profile = profiles[i];
      const progress = `[${i + 1}/${profiles.length}]`;

      console.log(`${progress} 처리 중: ${profile.user_id}`);

      try {
        // Fallback context 생성
        const fallbackContext: ProfileFallbackContext = {
          department: profile.department,
          jobRole: profile.job_role,
          mbti: profile.mbti,
          hobbies: profile.tags,
        };

        // 임베딩 생성
        const embeddings = await generateProfileEmbeddings(
          {
            collaborationStyle: profile.collaboration_style,
            strengths: profile.strengths,
            preferredPeopleType: profile.preferred_people_type,
            workDescription: profile.work_description,
            techStack: profile.tech_stack,
            interests: profile.interests,
            careerGoals: profile.career_goals,
          },
          fallbackContext
        );

        if (!embeddings) {
          console.log(`  ⚠️ 임베딩 생성 실패 (데이터 부족)`);
          failCount++;
          continue;
        }

        // 임베딩 저장
        const { error: upsertError } = await supabase.from("embeddings").upsert(
          {
            user_id: profile.user_id,
            combined_embedding: JSON.stringify(embeddings.combinedEmbedding),
            collaboration_style_embedding:
              embeddings.collaborationStyleEmbedding
                ? JSON.stringify(embeddings.collaborationStyleEmbedding)
                : null,
            strengths_embedding: embeddings.strengthsEmbedding
              ? JSON.stringify(embeddings.strengthsEmbedding)
              : null,
            preferred_people_type_embedding:
              embeddings.preferredPeopleTypeEmbedding
                ? JSON.stringify(embeddings.preferredPeopleTypeEmbedding)
                : null,
            source_text_hash: embeddings.sourceTextHash,
            generated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          }
        );

        if (upsertError) {
          console.log(`  ❌ 저장 실패: ${upsertError.message}`);
          failCount++;
        } else {
          console.log(`  ✅ 성공`);
          successCount++;
        }

        // Rate limiting: 1초에 최대 3개 요청
        if (i < profiles.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 350));
        }
      } catch (error) {
        console.log(`  ❌ 오류: ${error}`);
        failCount++;
      }
    }

    console.log();
    console.log("=".repeat(60));
    console.log("완료!");
    console.log(`  성공: ${successCount}`);
    console.log(`  실패: ${failCount}`);
    console.log("=".repeat(60));
  } catch (error) {
    console.error("스크립트 실행 중 오류:", error);
    process.exit(1);
  }
}

// 스크립트 실행
regenerateEmbeddings();
