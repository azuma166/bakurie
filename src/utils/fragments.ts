import { DreamFragment } from '../components/BakuCanvas';

/**
 * Deterministic pseudo-random in [0,1) based on integer seed.
 * Avoids Math.random() so positions are stable across re-renders.
 */
function pr(seed: number, offset = 0): number {
  // Use seed+1 to avoid sin(0)=0 degenerate case when seed=0
  const x = Math.sin((seed + 1) * 127.1 + (offset + 1) * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Generate dream fragments distributed inside baku body.
 * - Index 0 = newest: large, bright, inner ring
 * - Index N-1 = oldest: small, faint, outer ring
 *
 * Body polygon centroid is roughly (+8, +5) from the SVG transform origin.
 * Inner ring radius ~15px, outer ring ~42px — clearly distinct for any count.
 */
export function generateFragments(recordCount: number, hues: number[] = []): DreamFragment[] {
  if (recordCount === 0) return [];

  const fragments: DreamFragment[] = [];

  for (let i = 0; i < recordCount; i++) {
    const ageRatio = recordCount === 1 ? 0 : i / (recordCount - 1); // 0=newest, 1=oldest

    // Golden angle gives maximum angular separation between adjacent fragments
    const angle = (i * 137.5 * Math.PI) / 180;

    // Radius: newest near center, oldest at body edge — with small per-fragment jitter
    const baseRadius = 15 + ageRatio * 27; // newest→15, oldest→42
    const radius = baseRadius + pr(i, 0) * 6 - 3; // ±3px organic jitter

    // Body centroid offset: BODY centroid ≈ (+8, +5) from transform origin
    const x = 8 + Math.cos(angle) * radius;
    const y = 5 + Math.sin(angle) * radius;

    // Hue: stored value or golden-angle fallback
    const hue = hues[i] ?? (i * 47 + 200) % 360;

    // Saturation: newest vivid, oldest muted
    const saturation = 72 - ageRatio * 38; // 72 → 34

    // Lightness: slight brightening with age
    const lightness = 58 + ageRatio * 12; // 58 → 70

    // Size: newest large, oldest tiny
    const size = 12 - ageRatio * 9 + pr(i, 2) * 2; // newest ~12-14, oldest ~3-5

    // Opacity: newest solid, oldest faint
    const opacity = 0.78 - ageRatio * 0.57 + pr(i, 3) * 0.04;

    fragments.push({
      id: `frag-${i}`,
      hue,
      saturation,
      lightness,
      size,
      opacity,
      x,
      y,
      phase: pr(i, 4) * Math.PI * 2,
    });
  }

  return fragments;
}
