import OpenAI from "openai";
import crypto from "crypto";

let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error("Empty text provided for embedding");
  }

  const client = getOpenAIClient();
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text.trim(),
  });

  return response.data[0].embedding;
}

export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const validTexts = texts.filter((t) => t && t.trim().length > 0);

  if (validTexts.length === 0) {
    return [];
  }

  const client = getOpenAIClient();
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: validTexts.map((t) => t.trim()),
  });

  return response.data.map((d) => d.embedding);
}

export function generateTextHash(texts: string[]): string {
  const combined = texts.filter(Boolean).sort().join("|");
  return crypto.createHash("sha256").update(combined).digest("hex");
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface ProfileEmbeddings {
  combinedEmbedding: number[];
  collaborationStyleEmbedding?: number[];
  strengthsEmbedding?: number[];
  preferredPeopleTypeEmbedding?: number[];
  sourceTextHash: string;
}

/**
 * Fallback 컨텍스트: 텍스트 필드가 없을 때 임베딩 생성에 사용
 */
export interface ProfileFallbackContext {
  department?: string | null;
  jobRole?: string | null;
  mbti?: string | null;
  hobbies?: string[];
}

export async function generateProfileEmbeddings(
  profile: {
    collaborationStyle?: string | null;
    strengths?: string | null;
    preferredPeopleType?: string | null;
    // 새 필드
    workDescription?: string | null;
    techStack?: string | null;
    interests?: string | null;
    careerGoals?: string | null;
  },
  fallbackContext?: ProfileFallbackContext
): Promise<ProfileEmbeddings | null> {
  const texts: string[] = [];
  const textMap: { field: string; text: string }[] = [];

  if (profile.collaborationStyle) {
    texts.push(profile.collaborationStyle);
    textMap.push({ field: "collaborationStyle", text: profile.collaborationStyle });
  }

  if (profile.strengths) {
    texts.push(profile.strengths);
    textMap.push({ field: "strengths", text: profile.strengths });
  }

  if (profile.preferredPeopleType) {
    texts.push(profile.preferredPeopleType);
    textMap.push({ field: "preferredPeopleType", text: profile.preferredPeopleType });
  }

  // 새 필드 추가 - 임베딩 생성에 포함
  if (profile.workDescription) {
    texts.push(profile.workDescription);
    textMap.push({ field: "workDescription", text: profile.workDescription });
  }

  if (profile.techStack) {
    texts.push(profile.techStack);
    textMap.push({ field: "techStack", text: profile.techStack });
  }

  if (profile.interests) {
    texts.push(profile.interests);
    textMap.push({ field: "interests", text: profile.interests });
  }

  if (profile.careerGoals) {
    texts.push(profile.careerGoals);
    textMap.push({ field: "careerGoals", text: profile.careerGoals });
  }

  // Fallback: 텍스트 필드가 없으면 기본 정보로 임베딩 생성
  if (texts.length === 0 && fallbackContext) {
    const fallbackParts: string[] = [];

    if (fallbackContext.department) {
      fallbackParts.push(`부서: ${fallbackContext.department}`);
    }
    if (fallbackContext.jobRole) {
      fallbackParts.push(`직군: ${fallbackContext.jobRole}`);
    }
    if (fallbackContext.mbti) {
      fallbackParts.push(`MBTI: ${fallbackContext.mbti}`);
    }
    if (fallbackContext.hobbies && fallbackContext.hobbies.length > 0) {
      fallbackParts.push(`취미: ${fallbackContext.hobbies.join(", ")}`);
    }

    if (fallbackParts.length > 0) {
      const fallbackText = fallbackParts.join(" | ");
      texts.push(fallbackText);
      textMap.push({ field: "fallback", text: fallbackText });
    }
  }

  // If still no text fields, return null
  if (texts.length === 0) {
    return null;
  }

  // Generate embeddings for all texts
  const embeddings = await generateEmbeddings(texts);

  // Create combined embedding (average of all embeddings)
  const combinedEmbedding = new Array(1536).fill(0);
  for (const embedding of embeddings) {
    for (let i = 0; i < embedding.length; i++) {
      combinedEmbedding[i] += embedding[i] / embeddings.length;
    }
  }

  // Map individual embeddings
  const result: ProfileEmbeddings = {
    combinedEmbedding,
    sourceTextHash: generateTextHash(texts),
  };

  textMap.forEach((item, index) => {
    if (item.field === "collaborationStyle") {
      result.collaborationStyleEmbedding = embeddings[index];
    } else if (item.field === "strengths") {
      result.strengthsEmbedding = embeddings[index];
    } else if (item.field === "preferredPeopleType") {
      result.preferredPeopleTypeEmbedding = embeddings[index];
    }
  });

  return result;
}
