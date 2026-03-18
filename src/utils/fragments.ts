import { DreamFragment } from '../components/BakuCanvas';

/**
 * Deterministic pseudo-random in [0,1) based on integer seed.
 */
function pr(seed: number, offset = 0): number {
  const x = Math.sin(seed * 127.1 + offset * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// Body centroid offset from the SVG transform origin (translate(cx,cy)).
// BODY = [[10,-40],[65,5],[12,48],[-55,8]] → centroid ≈ (+8, +5)
const BODY_CX = 8;
const BODY_CY = 5;

// Ring spacing for the sunflower phyllotaxis pattern.
// sqrt(i+0.5) * SPREAD gives natural non-overlapping distribution.
// SPREAD=11: i=0 → r≈7.8, i=4 → r≈22.9, i=19 → r≈46.8 (body edge)
const SPREAD = 11;

/**
 * Generate dream fragments distributed inside baku body using
 * sunflower phyllotaxis (golden angle + sqrt-radius).
 *
 * Index 0 = newest → large, bright, center.
 * Index N-1 = oldest → small, faint, edge.
 * hues[i] is the per-fragment hue (index 0 = newest).
 */
export function generateFragments(recordCount: number, hues: number[] = []): DreamFragment[] {
  if (recordCount === 0) return [];

  const fragments: DreamFragment[] = [];

  for (let i = 0; i < recordCount; i++) {
    const ageRatio = recordCount === 1 ? 0 : i / (recordCount - 1); // 0=newest, 1=oldest

    // Sunflower phyllotaxis: sqrt spacing + golden angle
    const angle = (i * 137.5 * Math.PI) / 180;
    const radius = Math.sqrt(i + 0.5) * SPREAD + pr(i, 0) * 4;
    const x = BODY_CX + Math.cos(angle) * radius;
    const y = BODY_CY + Math.sin(angle) * radius;

    // Hue: stored value or golden-angle fallback
    const hue = hues[i] ?? (i * 47 + 200) % 360;

    // Saturation: newest vivid, oldest muted
    const saturation = 72 - ageRatio * 38; // 72 → 34

    // Lightness: slight brightening with age
    const lightness = 58 + ageRatio * 12; // 58 → 70

    // Size: newest large, oldest tiny
    const size = 13 * (1 - ageRatio * 0.82) + pr(i, 2) * 2; // newest ~13-15, oldest ~2-4

    // Opacity: newest solid, oldest faint
    const opacity = 0.78 - ageRatio * 0.58 + pr(i, 3) * 0.04;

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
