import { DreamFragment } from '../components/BakuCanvas';

/**
 * GLSL-style hash: produces a stable pseudo-random in [0,1) for any float seed.
 * Using hue as seed means each fragment has a unique, stable position.
 */
function fragHash(seed: number, slot: number): number {
  const x = Math.sin(seed * 12.9898 + slot * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Generate dream fragments distributed inside baku body.
 *
 * Position is seeded by each fragment's hue value (random per feed),
 * so different feeds always produce visually distinct positions.
 * Old fragments never move — their hue (and thus position) is fixed.
 *
 * Body polygon centroid ≈ (+8, +5) from SVG transform origin.
 * Radius range 15–40px keeps fragments inside the body.
 *
 * Index 0 = newest (large, bright), index N-1 = oldest (small, faint).
 */
export function generateFragments(recordCount: number, hues: number[] = []): DreamFragment[] {
  if (recordCount === 0) return [];

  const fragments: DreamFragment[] = [];

  for (let i = 0; i < recordCount; i++) {
    const ageRatio = recordCount === 1 ? 0 : i / (recordCount - 1); // 0=newest, 1=oldest

    // Each fragment's hue is unique (random per feed), so positions are unique and stable.
    const hue = hues[i] ?? (i * 47 + 200) % 360;

    // Position: seeded entirely by hue → differs for every feed, never changes after
    const angle = fragHash(hue, 0) * 2 * Math.PI;
    const radius = 15 + fragHash(hue, 1) * 25; // 15–40 px inside body
    const x = 8 + Math.cos(angle) * radius;
    const y = 5 + Math.sin(angle) * radius;

    // Ease-in curve: decay accelerates as fragments age (natural fading feel)
    const t = ageRatio * ageRatio; // 0 (newest) → 1 (oldest), eased

    // Visual attributes: all three decay together with age
    const size       = 14 - t * 11 + fragHash(hue, 2) * 1.5; // newest ~14–15, oldest ~3–4 px
    const opacity    = 0.92 - t * 0.78;                       // newest 0.92, oldest 0.14
    const saturation = 88 - t * 68;                           // newest 88%, oldest 20%
    const lightness  = 56 + t * 10;                           // newest 56%, oldest 66% (muted)

    fragments.push({
      id: `frag-${i}`,
      hue,
      saturation,
      lightness,
      size,
      opacity,
      x,
      y,
      phase: fragHash(hue, 4) * Math.PI * 2,
    });
  }

  return fragments;
}
