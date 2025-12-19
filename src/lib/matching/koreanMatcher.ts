/**
 * 한글 유의어 매칭 모듈
 * 검색어의 유의어를 확장하여 더 정확한 매칭 지원
 */

// 유의어 사전: 키워드 -> 관련 표현들
const SYNONYMS: Record<string, string[]> = {
  // === 개발 관련 ===
  '개발': ['개발자', '프로그래머', 'developer', '엔지니어', 'engineer', '코딩', '코더'],
  '개발자': ['개발', '프로그래머', 'developer', '엔지니어', 'engineer'],
  '프론트엔드': ['frontend', 'front-end', 'fe', 'ui', '화면', '클라이언트', '프론트'],
  '백엔드': ['backend', 'back-end', 'be', '서버', 'server', '백엔드개발'],
  '풀스택': ['fullstack', 'full-stack', '풀스택개발'],
  '데브옵스': ['devops', 'dev-ops', 'sre', 'infra', '인프라', '운영'],
  '클라우드': ['cloud', 'aws', 'gcp', 'azure', '클라우드엔지니어'],
  'ci/cd': ['cicd', 'pipeline', '파이프라인', '배포자동화', 'jenkins', 'github actions'],

  // === AI/ML 관련 ===
  'ai': ['인공지능', 'artificial intelligence', 'ml', '머신러닝', '딥러닝', 'machine learning'],
  '머신러닝': ['machine learning', 'ml', 'ai', '기계학습', '인공지능'],
  '딥러닝': ['deep learning', 'dl', '신경망', 'neural network', 'ai'],
  '데이터': ['data', '데이터분석', '데이터사이언스', 'analytics', '분석'],
  '데이터사이언스': ['data science', 'ds', '데이터과학', '데이터분석'],

  // === 성격 관련 ===
  '소통': ['커뮤니케이션', '의사소통', '대화', 'communication', '소통력'],
  '꼼꼼': ['꼼꼼한', '세심한', '디테일', '섬세한', '세밀한', '정확한', '꼼꼼함'],
  '창의': ['창의적', '창의성', '아이디어', '창조적', '혁신', '창의력', 'creative'],
  '논리': ['논리적', '분석적', '체계적', '합리적', '논리력', 'logical'],
  '분석': ['분석적', '분석력', 'analytical', '데이터분석', '문제분석'],
  '적극': ['적극적', '능동적', '주도적', '열정적', '적극성', 'proactive'],
  '주도': ['주도적', '리딩', '이끌', '주도성', '드라이브'],
  '밝은': ['밝다', '활발', '명랑', '쾌활', '긍정적', '유쾌', '밝음', '에너지'],
  '성실': ['성실한', '책임감', '책임감있는', '신뢰', '꾸준', '성실함', '근면'],
  '친절': ['친절한', '다정', '배려', '따뜻', '친절함', '친화력'],
  '문제해결': ['problem solving', '솔루션', '해결력', '트러블슈팅', '문제분석'],
  '도전': ['도전적', '도전정신', '챌린지', 'challenge', '모험'],
  '효율': ['효율적', '생산적', 'efficient', '생산성', '최적화'],
  '전문': ['전문가', '전문성', 'expert', '스페셜리스트', 'specialist'],
  '유연': ['유연한', '유연성', 'flexible', '적응력', '융통성'],

  // === 협업 관련 ===
  '협업': ['협력', '팀워크', '협동', 'teamwork', 'collaboration', '공동작업'],
  '리더': ['리더십', '리딩', '이끌', 'leadership', 'leader', '팀장', '매니저'],
  '팔로워': ['서포터', '팔로우', 'follower', '보조', '지원'],
  '멘토': ['멘토링', 'mentor', '가르치', '코칭', '지도'],
  '매니저': ['manager', '관리자', '팀장', '파트장', '리더'],

  // === 취미 관련 ===
  '운동': ['스포츠', '헬스', '피트니스', 'fitness', 'workout', '웨이트', '러닝'],
  '게임': ['gaming', '게이밍', '플레이', '롤', '배그', '스팀'],
  '영화': ['무비', 'movie', '시네마', 'cinema', '넷플릭스', '왓챠'],
  '음악': ['뮤직', 'music', '노래', '악기', '밴드', '기타', '피아노'],
  '여행': ['여행하다', '트래블', 'travel', '관광', '해외여행', '국내여행'],
  '독서': ['책', '도서', 'reading', '북', '북클럽', '문학'],
  '요리': ['쿠킹', 'cooking', '음식', '베이킹', '맛집'],
  '사진': ['포토', 'photo', 'photography', '촬영', '카메라'],
  '등산': ['하이킹', 'hiking', '산행', '트레킹', '산'],
  '골프': ['golf', '골린이', '필드', '스크린골프'],
  '테니스': ['tennis', '테린이', '라켓'],
  '수영': ['swimming', '수영장', '아쿠아'],
  '캠핑': ['camping', '캠프', '글램핑', '백패킹', '아웃도어'],

  // === 기술 스택 ===
  'react': ['리액트', 'reactjs', 'react.js', 'react native'],
  'vue': ['뷰', 'vuejs', 'vue.js', 'nuxt'],
  'angular': ['앵귤러', 'angularjs'],
  'typescript': ['타입스크립트', 'ts'],
  'javascript': ['자바스크립트', 'js', 'es6'],
  'python': ['파이썬', 'py', 'django', 'flask', 'fastapi'],
  'java': ['자바', 'spring', '스프링', 'jvm'],
  'node': ['nodejs', 'node.js', '노드', 'express', 'nest'],
  'kotlin': ['코틀린', 'android', '안드로이드'],
  'swift': ['스위프트', 'ios', '아이폰', 'swiftui'],
  'go': ['golang', '고랭'],
  'rust': ['러스트'],
  'c++': ['cpp', '씨플플', '언리얼'],
  'docker': ['도커', 'container', '컨테이너', 'k8s', 'kubernetes'],
  'sql': ['mysql', 'postgresql', 'postgres', 'oracle', '데이터베이스', 'db'],
  'graphql': ['그래프큐엘', 'apollo'],
  'next': ['nextjs', 'next.js', '넥스트'],

  // === 부서/조직 관련 ===
  '연구': ['r&d', 'research', '리서치', '연구소', '연구개발'],
  '기획': ['planning', '플래닝', '전략', 'strategy', '서비스기획', '프로덕트'],
  '마케팅': ['marketing', '마케터', '광고', '브랜딩', 'brand'],
  'qa': ['quality assurance', '품질', '테스터', 'testing', 'qc', '품질관리'],
  '디자인': ['design', '디자이너', 'ui/ux', 'uxui', 'ui', 'ux', '시각디자인'],
  'pm': ['프로덕트매니저', 'product manager', '프로젝트매니저', 'project manager'],
  'po': ['product owner', '프로덕트오너'],
  '영업': ['sales', '세일즈', 'bd', 'business development', '사업개발'],
  '인사': ['hr', 'human resources', '채용', 'recruiting', '피플팀'],
  '재무': ['finance', '회계', 'accounting', '경리'],
  '법무': ['legal', '법률', '계약', '컴플라이언스'],
  '보안': ['security', '시큐리티', '정보보안', 'infosec'],

  // === 지역/위치 관련 ===
  '판교': ['pangyo', '분당', '성남', '테크노밸리'],
  '강남': ['gangnam', '테헤란로', '역삼'],
  '여의도': ['yeouido', 'ifc'],
  '재택': ['remote', '리모트', '원격', 'wfh', 'work from home', '재택근무'],
  '본사': ['headquarters', 'hq', '사옥'],
  '지사': ['branch', '지점'],
  '서울': ['seoul', '수도권'],
  '해외': ['overseas', 'global', '글로벌', '외국'],

  // === 학력/자격 관련 ===
  '컴공': ['컴퓨터공학', 'computer science', 'cs', '전산', '소프트웨어공학'],
  '석사': ['master', '대학원', 'graduate', '석박사'],
  '박사': ['phd', 'doctor', 'doctoral', '박사과정'],
  '학사': ['bachelor', 'undergraduate', '학부'],
  '자격증': ['certification', '인증', 'certified', '라이선스'],

  // === 근무 관련 ===
  '시니어': ['senior', 'sr', '경력', '고경력', '숙련'],
  '주니어': ['junior', 'jr', '신입', '초급', '초보'],
  '미드': ['mid', 'middle', '중급', '중간경력'],
  '인턴': ['intern', '인턴십', 'internship'],
  '프리랜서': ['freelancer', 'freelance', '프리', '계약직'],
  '정규직': ['fulltime', 'full-time', '정직원'],
};

// 역방향 매핑 생성 (최초 로딩 시 한 번만)
const REVERSE_SYNONYMS: Map<string, string[]> = new Map();
for (const [key, values] of Object.entries(SYNONYMS)) {
  // 원래 키도 역방향에 추가
  for (const value of values) {
    const existing = REVERSE_SYNONYMS.get(value.toLowerCase()) || [];
    if (!existing.includes(key.toLowerCase())) {
      existing.push(key.toLowerCase());
    }
    REVERSE_SYNONYMS.set(value.toLowerCase(), existing);
  }
}

/**
 * 키워드 목록을 유의어로 확장
 * @param keywords 원래 키워드 목록
 * @returns 확장된 키워드 목록 (중복 제거)
 */
export function expandKeywords(keywords: string[]): string[] {
  const expanded = new Set<string>();

  for (const keyword of keywords) {
    const lowerKeyword = keyword.toLowerCase();
    expanded.add(lowerKeyword);

    // 정방향 매칭 (keyword가 키인 경우)
    if (SYNONYMS[lowerKeyword]) {
      for (const synonym of SYNONYMS[lowerKeyword]) {
        expanded.add(synonym.toLowerCase());
      }
    }

    // 역방향 매칭 (keyword가 값인 경우)
    const reverseMatches = REVERSE_SYNONYMS.get(lowerKeyword);
    if (reverseMatches) {
      for (const match of reverseMatches) {
        expanded.add(match);
      }
    }

    // 부분 문자열 매칭 (2자 이상 키워드가 포함된 유의어 찾기)
    if (lowerKeyword.length >= 2) {
      for (const [key, values] of Object.entries(SYNONYMS)) {
        if (key.includes(lowerKeyword) || lowerKeyword.includes(key)) {
          expanded.add(key.toLowerCase());
          for (const value of values) {
            expanded.add(value.toLowerCase());
          }
        }
      }
    }
  }

  return Array.from(expanded);
}

/**
 * 텍스트와 키워드 목록 간의 유의어 포함 매칭 점수 계산
 * @param text 검색 대상 텍스트
 * @param keywords 검색 키워드 목록
 * @returns 0-1 범위의 매칭 점수
 */
export function matchWithSynonyms(text: string, keywords: string[]): number {
  if (!text || keywords.length === 0) {
    return 0;
  }

  const textLower = text.toLowerCase();
  const expandedKeywords = expandKeywords(keywords);

  let matchCount = 0;
  const matchedKeywords = new Set<string>();

  for (const keyword of expandedKeywords) {
    if (textLower.includes(keyword) && !matchedKeywords.has(keyword)) {
      matchCount++;
      matchedKeywords.add(keyword);
    }
  }

  // 원래 키워드 수 기준으로 정규화
  return Math.min(matchCount / keywords.length, 1.0);
}

/**
 * 특정 키워드의 유의어 목록 조회
 */
export function getSynonyms(keyword: string): string[] {
  const lowerKeyword = keyword.toLowerCase();
  const synonyms = new Set<string>();

  // 정방향
  if (SYNONYMS[lowerKeyword]) {
    for (const s of SYNONYMS[lowerKeyword]) {
      synonyms.add(s.toLowerCase());
    }
  }

  // 역방향
  const reverse = REVERSE_SYNONYMS.get(lowerKeyword);
  if (reverse) {
    for (const s of reverse) {
      synonyms.add(s);
    }
  }

  return Array.from(synonyms);
}
