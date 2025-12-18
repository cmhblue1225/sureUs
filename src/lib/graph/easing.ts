/**
 * Easing 함수 모음
 * 자연스러운 애니메이션을 위한 보간 함수들
 *
 * 모든 함수는 t (0-1) 입력을 받아 0-1 출력 반환
 */

/**
 * 선형 (변화 없음)
 */
export function linear(t: number): number {
  return t;
}

/**
 * Ease Out Cubic - 빠르게 시작, 천천히 종료
 * 가장 자연스러운 일반적인 애니메이션에 적합
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Ease Out Quart - 더 빠르게 시작, 더 천천히 종료
 */
export function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

/**
 * Ease Out Quint - 가장 빠르게 시작, 가장 천천히 종료
 */
export function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

/**
 * Ease In Out Quad - 부드러운 시작과 종료
 * 왕복 애니메이션에 적합
 */
export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * Ease In Out Cubic - 더 극적인 시작과 종료
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Ease Out Elastic - 탄성 효과 (튕김)
 * 주의 깊게 사용 - 과도하면 어지러울 수 있음
 */
export function easeOutElastic(t: number): number {
  const c4 = (2 * Math.PI) / 3;

  return t === 0
    ? 0
    : t === 1
    ? 1
    : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

/**
 * Ease Out Back - 약간 오버슈트 후 정착
 * 노드 이동에 생동감 추가
 */
export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;

  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/**
 * Ease Out Expo - 지수 감소
 * 빠른 시작 후 점진적 정지
 */
export function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/**
 * 부드러운 스텝 (Smoothstep)
 * CSS 트랜지션과 유사한 느낌
 */
export function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/**
 * 더 부드러운 스텝 (Smootherstep)
 */
export function smootherstep(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/**
 * 스프링 효과 - 물리적인 스프링처럼 진동 후 정착
 * @param dampingRatio 감쇠 비율 (0.5 = 많이 진동, 1.0 = 진동 없음)
 */
export function createSpring(dampingRatio: number = 0.7): (t: number) => number {
  return (t: number) => {
    const omega = 10; // 각속도
    const decay = Math.exp(-dampingRatio * omega * t);
    const oscillation = Math.cos(omega * Math.sqrt(1 - dampingRatio * dampingRatio) * t);
    return 1 - decay * oscillation;
  };
}

/**
 * 두 값 사이 보간
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * 두 위치 사이 보간
 */
export function lerpPosition(
  start: { x: number; y: number },
  end: { x: number; y: number },
  t: number
): { x: number; y: number } {
  return {
    x: lerp(start.x, end.x, t),
    y: lerp(start.y, end.y, t),
  };
}
