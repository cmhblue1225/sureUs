# 7요소 하이브리드 매칭 알고리즘

sureNet의 프로필 기반 동료 추천에 사용되는 하이브리드 매칭 알고리즘입니다.
7가지 요소를 종합하여 동료 간의 적합도를 0~1 범위로 계산합니다.

## 가중치 구성

| 요소 | 가중치 | 설명 | 파일 |
|------|--------|------|------|
| 임베딩 유사도 | 30% | 프로필 전체의 의미적 유사도 | `enhancedAlgorithm.ts` |
| 취미 태그 | 25% | 공통 관심사 비율 | `algorithm.ts` |
| MBTI 궁합 | 12% | 성격 유형 호환성 | `mbtiCompatibility.ts` |
| 직군 유사도 | 10% | 직급/직종 관계 | `jobRoleScoring.ts` |
| 부서 관계 | 8% | 조직 간 시너지 | `departmentScoring.ts` |
| 지역 근접성 | 5% | 사무실 위치 | `locationScoring.ts` |
| 선호도 | 10% | 사용자 설정 선호도 | `enhancedAlgorithm.ts` |

```
총점 = 0.30×임베딩 + 0.25×태그 + 0.12×MBTI + 0.10×직군 + 0.08×부서 + 0.05×위치 + 0.10×선호도
```

---

## 1. 임베딩 유사도 (30%)

프로필 전체를 OpenAI `text-embedding-3-small` 모델로 1536차원 벡터로 변환하여 코사인 유사도를 계산합니다.

### 계산 방식

```typescript
// 코사인 유사도 계산 후 [0,1] 범위로 정규화
const similarity = cosineSimilarity(userEmbedding, candidateEmbedding);
const normalizedScore = (similarity + 1) / 2;  // [-1,1] → [0,1]
```

### 점수 범위

| 정규화 점수 | 의미 |
|-------------|------|
| 0.8 이상 | 매우 유사한 프로필 |
| 0.6~0.8 | 유사한 부분이 많음 |
| 0.4~0.6 | 보통 |
| 0.4 미만 | 상이한 프로필 |

### 임베딩 대상 필드

- 자기소개
- 협업 스타일
- 강점
- 선호하는 동료 유형
- 업무 설명
- 커리어 목표

---

## 2. 취미 태그 (25%)

사용자가 선택한 취미/관심사 태그 간의 Jaccard 유사도를 계산합니다.

### 계산 방식

```typescript
function calculateTagOverlap(userTags: string[], candidateTags: string[]): number {
  const userSet = new Set(userTags);
  const candidateSet = new Set(candidateTags);

  let intersection = 0;
  for (const tag of userSet) {
    if (candidateSet.has(tag)) {
      intersection++;
    }
  }

  const union = new Set([...userTags, ...candidateTags]).size;
  return union === 0 ? 0 : intersection / union;
}
```

### 예시

```
사용자A: [러닝, 헬스, 독서, 게임]
사용자B: [러닝, 영화, 게임, 여행]

교집합: {러닝, 게임} = 2개
합집합: {러닝, 헬스, 독서, 게임, 영화, 여행} = 6개
점수: 2 / 6 = 0.333
```

### 공통 태그 추출

매칭 이유 표시 시 공통 태그를 추출하여 보여줍니다:

```typescript
function getCommonTags(userTags: string[], candidateTags: string[]): string[] {
  const userSet = new Set(userTags);
  return candidateTags.filter((tag) => userSet.has(tag));
}
```

---

## 3. MBTI 궁합 (12%)

16개 MBTI 유형 간의 호환성을 16×16 매트릭스로 정의하여 점수를 조회합니다.

### 호환성 매트릭스 구조

```typescript
const MBTI_COMPATIBILITY_MATRIX: Record<string, Record<string, number>> = {
  INTJ: {
    INTJ: 0.80, INTP: 0.85, ENTJ: 0.90, ENTP: 1.00,
    INFJ: 0.75, INFP: 0.70, ENFJ: 0.65, ENFP: 0.85,
    ISTJ: 0.60, ISFJ: 0.50, ESTJ: 0.55, ESFJ: 0.45,
    ISTP: 0.65, ISFP: 0.50, ESTP: 0.55, ESFP: 0.45,
  },
  // ... 나머지 15개 유형
}
```

### 점수 티어

| 점수 | 관계 | 예시 조합 |
|------|------|-----------|
| 1.00 | 이상적 보완 관계 | INTJ↔ENTP, INFJ↔ENFP |
| 0.85~0.90 | 매우 좋은 궁합 | INTJ↔INTP, INTJ↔ENTJ |
| 0.70~0.80 | 좋은 궁합 | 같은 기질 그룹 내 |
| 0.55~0.65 | 보통 | 중립적 관계 |
| 0.40~0.55 | 도전적 | 반대 특성 조합 |

### 기질 그룹 (Temperament)

| 그룹 | 유형 | 특징 |
|------|------|------|
| NT (분석가) | INTJ, INTP, ENTJ, ENTP | 논리적, 전략적 |
| NF (외교관) | INFJ, INFP, ENFJ, ENFP | 공감적, 이상주의적 |
| SJ (관리자) | ISTJ, ISFJ, ESTJ, ESFJ | 체계적, 책임감 |
| SP (탐험가) | ISTP, ISFP, ESTP, ESFP | 유연한, 실용적 |

### 결측값 처리

```typescript
function getMbtiCompatibility(type1: string | null, type2: string | null): number {
  if (!type1 || !type2) return 0.5;  // 중립 점수 반환
  return MBTI_COMPATIBILITY_MATRIX[type1.toUpperCase()][type2.toUpperCase()] ?? 0.5;
}
```

---

## 4. 직군 유사도 (10%)

직급 및 직종 관계를 분석하여 점수를 계산합니다. 특히 **멘토/멘티 관계**를 우대합니다.

### 직급 레벨 정의

```typescript
const JOB_POSITION_LEVELS: Record<string, number> = {
  "임원": 1,
  "부사장": 2,
  "상무": 3,
  "이사": 4,
  "수석": 5,
  "선임": 6,
  "과장": 7,
  "대리": 8,
  "사원": 9,
};
```

### 점수 체계

| 관계 | 점수 | 설명 |
|------|------|------|
| 인접 직급 | **1.0** | 멘토/멘티 가능성 (최고 점수) |
| 같은 직급 | 0.8 | 동료 협업 |
| 같은 카테고리 | 0.6 | 관련 직군 |
| 연구직-관리직 시너지 | 0.7 | 특별 조합 |
| 다른 카테고리 | 0.4 | 다른 전문 분야 |

### 설계 철학

- **수직 관계 우대**: 인접 직급 간 연결이 같은 직급보다 높은 점수
- **멘토링 장려**: 경험 전수 기회 극대화
- **크로스 기능 협업**: 다른 카테고리도 기본 점수 부여

---

## 5. 부서 관계 (8%)

조직 구조 기반으로 부서 간 시너지를 계산합니다. **크로스부서 네트워킹**을 기본적으로 우대합니다.

### 조직 구조 (3단계)

```
본부/연구소 (Level 1)
  └─ 실/센터 (Level 2)
      └─ 팀 (Level 3)
```

예: `시험자동화연구소 > Cloud실 > Frontend팀`

### 점수 체계 (preferCrossDepartment = true)

| 관계 | 점수 | 설명 |
|------|------|------|
| 다른 연구소 + 높은 시너지 | **1.0** | 조직 시너지 맵에 정의된 조합 |
| 같은 연구소, 다른 실 | 0.8 | 내부 크로스팀 |
| 같은 실, 다른 팀 | 0.5 | 같은 부서 내 |
| 같은 팀 | 0.3 | 이미 알고 있는 동료 (네트워킹 가치 낮음) |
| 시너지 없는 다른 연구소 | 0.4 | 기본값 |

### 조직 시너지 맵

```typescript
const ORG_SYNERGY_MAP: Record<string, string[]> = {
  "시험자동화연구소": ["클라우드연구소", "AI연구소"],
  "클라우드연구소": ["시험자동화연구소", "보안연구소"],
  // ...
};
```

### 설계 철학

- **다양성 장려**: 같은 팀보다 다른 부서와의 연결 우대
- **시너지 기반**: 실제 협업 가능성이 높은 조직 간 연결 강화
- **사일로 해소**: 조직 간 벽을 허물고 네트워킹 촉진

---

## 6. 지역 근접성 (5%)

사무실 위치 기반으로 대면 교류 가능성을 평가합니다.

### 점수 체계

| 위치 조합 | 점수 | 설명 |
|----------|------|------|
| 같은 사무실 | 1.0 | 최고 근접 |
| 서울권 (본사/강남/판교) | 0.7 | 수도권 내 이동 가능 |
| 둘 다 재택근무 | 0.5 | 원격 협업 친화적 |
| 같은 광역시 | 0.4 | 도시 내 이동 가능 |
| 다른 도시/해외 | 0.3 | 원거리 |

### 서울권 정의

```typescript
const SEOUL_LOCATIONS = ["서울 본사", "서울 강남", "서울 판교"];
```

### 설계 철학

- **대면 선호**: 같은 사무실 > 같은 도시 > 원거리
- **재택 고려**: 재택근무자 간에도 기본 점수 부여
- **유연성**: 원거리라도 네트워킹 기회 제공

---

## 7. 선호도 매칭 (10%)

사용자가 설정한 선호도와 후보의 프로필이 얼마나 일치하는지 계산합니다.

### 선호도 항목

```typescript
interface EnhancedUserPreferences {
  preferredDepartments?: string[];    // 선호 부서
  preferredJobRoles?: string[];       // 선호 직군
  preferredLocations?: string[];      // 선호 지역
  preferredMbtiTypes?: string[];      // 선호 MBTI
  preferCrossDepartment?: boolean;    // 크로스부서 선호
}
```

### 계산 방식

```typescript
function calculatePreferenceMatch(
  preferences: EnhancedUserPreferences | null,
  candidate: EnhancedMatchCandidate
): number {
  if (!preferences) return 0.5;  // 선호도 없으면 중립

  let matchCount = 0;
  let totalCriteria = 0;

  // 각 선호도 기준별 체크
  if (preferences.preferredDepartments?.length) {
    totalCriteria++;
    if (preferences.preferredDepartments.includes(candidate.department)) {
      matchCount++;
    }
  }

  // ... 나머지 기준들

  if (totalCriteria === 0) return 0.5;
  return matchCount / totalCriteria;  // 0.0 ~ 1.0
}
```

### 예시

```
사용자 선호도:
  - 부서: "클라우드연구소"
  - 위치: "서울 본사"

후보:
  - 부서: "클라우드연구소" (일치)
  - 위치: "판교" (불일치)

점수: 1 / 2 = 0.5
```

---

## 최종 점수 해석

| 점수 범위 | 평가 | 권장 행동 |
|-----------|------|-----------|
| 0.75 이상 | 매우 잘 맞는 동료 | 적극 연락 권장 |
| 0.60~0.74 | 좋은 네트워킹 기회 | 커피챗 제안 |
| 0.45~0.59 | 새로운 관점 획득 가능 | 관심사 공유 시도 |
| 0.45 미만 | 다양성 확장 | 새로운 분야 탐색 |

---

## 관련 파일 구조

```
src/lib/matching/
├── algorithm.ts          # 기본 매칭 (3요소: 임베딩, 태그, 선호도)
├── enhancedAlgorithm.ts  # 7요소 매칭 (이 문서의 주요 대상)
├── mbtiCompatibility.ts  # MBTI 16×16 호환성 매트릭스
├── jobRoleScoring.ts     # 직급/직종 점수 계산
├── departmentScoring.ts  # 부서 시너지 점수 계산
├── locationScoring.ts    # 위치 근접성 점수 계산
├── explainability.ts     # 매칭 이유 설명 생성
├── koreanMatcher.ts      # 한글 유의어 확장
└── semanticMatcher.ts    # 의미 검색용 (5요소, 별도 시스템)
```

---

## 의미 검색과의 차이

이 문서의 7요소 매칭은 **프로필 기반 추천**에 사용됩니다.
**의미 검색 (자연어 검색)**은 별도의 5요소 시스템을 사용합니다:

| 시스템 | 용도 | 요소 수 | 파일 |
|--------|------|---------|------|
| 7요소 매칭 | 프로필 기반 동료 추천 | 7개 | `enhancedAlgorithm.ts` |
| 의미 검색 | 자연어 검색 | 5개 | `semanticMatcher.ts` |

의미 검색의 가중치 (balanced 전략):
- 벡터 유사도: 25%
- 프로필 필드: 30%
- 텍스트 매칭: 25%
- MBTI 호환성: 10%
- 태그 오버랩: 10%
