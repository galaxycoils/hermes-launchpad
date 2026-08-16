export const DURATIONS = { FAST: 0.25, NORMAL: 0.5, SLOW: 0.8 } as const;
export const EASES = { DEFAULT: "power2.out", BOUNCE: "back.out(1.7)", SMOOTH: "power3.inOut", SPRING: "back.out(1.4)" } as const;
export const STAGGERS = { CARDS: 0.12, TEXT_CHARS: 0.015, FIELDS: 0.06, SMALL: 0.06 } as const;

export const MATCH_MEDIA = {
  REDUCE_MOTION: "(prefers-reduced-motion: reduce)",
  MOBILE: "(max-width: 767px)",
  DESKTOP: "(min-width: 768px)",
} as const;
