import { DreamFragment } from '../components/BakuCanvas';

/**
 * Deterministic pseudo-random in [0,1) based on integer seed.
 * Same seed always returns the same value — fragments don't jump on re-render.
 */
function pr(seed: number, offset = 0): number {
  const x = Math.sin(seed * 127.1 + offset * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Generate dream fragments distributed inside baku body.
 * Fragments accumulate up to `recordCount` (max 100 for display).
 * Index 0 = newest (large, bright, center); higher index = older (small, faded, edge).
 * hues[i] is the per-fragment hue (index 0 = newest). Falls back to golden-angle
 * hue for fragments beyond the stored hue array.
 */
export function generateFragments(recordCount: number, hues: number[] = []): DreamFragment[] {
  if (recordCount === 0) return [];

  const fragments: DreamFragment[] = [];

  for (let i = 0; i < recordCount; i++) {
    const ageRatio = recordCount === 1 ? 0 : i / (recordCount - 1); // 0=newest, 1=oldest

    // Position: newest near center, oldest drifting to edges
    const angle = (i * 137.5 * Math.PI) / 180; // golden angle spread
    const radius = (8 + ageRatio * 26) * (0.55 + pr(i, 1) * 0.45);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    // Hue: use stored value or golden-angle fallback
    const hue = hues[i] ?? (i * 47 + 200) % 360;

    // Saturation: newest vivid, oldest muted
    const saturation = 72 - ageRatio * 38; // 72 → 34

    // Lightness: slight brightening with age
    const lightness = 58 + ageRatio * 12; // 58 → 70

    // Size: newest large, oldest tiny — clear visual difference
    const size = 13 * (1 - ageRatio * 0.8) + pr(i, 2) * 2; // newest ~13-15, oldest ~2-4

    // Opacity: newest solid, oldest faint
    const opacity = 0.78 - ageRatio * 0.58 + pr(i, 3) * 0.04; // newest ~0.78-0.82, oldest ~0.2-0.24

    fragments.push({
      id: `frag-${i}`,
      hue,
      saturation,
      lightness,
      size,
      opacity,
      x,
      y,
      phase: pr(i, 4) * Math.PI * 2, // deterministic floating phase
    });
  }

  return fragments;
}
