import { DreamFragment } from '../components/BakuCanvas';

/**
 * Generate dream fragments distributed inside baku body.
 * Recent records → larger, brighter, more centered.
 * Old records → smaller, faded, towards edges.
 * colorOffset shifts the hue of the newest fragment each feed.
 */
export function generateFragments(recordCount: number, colorOffset = 0): DreamFragment[] {
  if (recordCount === 0) return [];

  const fragments: DreamFragment[] = [];

  for (let i = 0; i < recordCount; i++) {
    const ageRatio = i / Math.max(recordCount - 1, 1); // 0 = newest, 1 = oldest
    const isNew = ageRatio < 0.2;

    // Position inside body (-30 to 30 range roughly)
    const angle = (i * 137.5 * Math.PI) / 180; // golden angle spread
    const radius = isNew ? 8 + Math.random() * 10 : 12 + ageRatio * 20;
    const x = Math.cos(angle) * radius * (0.5 + Math.random() * 0.5);
    const y = Math.sin(angle) * radius * (0.5 + Math.random() * 0.5);

    // Color: newest fragment uses colorOffset, older ones spread by fixed step
    const hue = (i * 47 + colorOffset) % 360;
    const saturation = isNew ? 70 : 40 - ageRatio * 20;
    const lightness = 60 + ageRatio * 10;
    const size = isNew ? 8 + Math.random() * 8 : 3 + (1 - ageRatio) * 3;
    const opacity = isNew ? 0.65 + Math.random() * 0.1 : 0.2 + (1 - ageRatio) * 0.1;

    fragments.push({
      id: `frag-${i}`,
      hue,
      saturation,
      lightness,
      size,
      opacity,
      x,
      y,
      phase: Math.random() * Math.PI * 2,
    });
  }

  return fragments;
}
