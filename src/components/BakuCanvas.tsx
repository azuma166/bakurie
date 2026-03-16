/**
 * BakuCanvas – D-2型バクの描画コンポーネント
 * @shopify/react-native-skia v2 + react-native-reanimated v3
 */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  Group,
} from '@shopify/react-native-skia';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  Easing,
  useAnimatedProps,
} from 'react-native-reanimated';

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

export type DreamFragment = {
  id: string;
  hue: number;
  saturation: number;
  lightness: number;
  size: number;
  opacity: number;
  x: number;
  y: number;
  phase: number;
};

// ----------------------------------------------------------------
// Geometry helpers
// ----------------------------------------------------------------

type Pt = [number, number];

function poly(pts: Pt[], close = true): string {
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) d += ` L ${pts[i][0]} ${pts[i][1]}`;
  if (close) d += ' Z';
  return d;
}

function scalePts(pts: Pt[], sx: number, sy: number): Pt[] {
  return pts.map(([x, y]) => [x * sx, y * sy]);
}

function offPts(pts: Pt[], dx: number, dy: number): Pt[] {
  return pts.map(([x, y]) => [x + dx, y + dy]);
}

function makePath(pts: Pt[], close = true) {
  const p = Skia.Path.MakeFromSVGString(poly(pts, close));
  return p ?? Skia.Path.Make();
}

// ----------------------------------------------------------------
// Base geometry (D-2型)
// ----------------------------------------------------------------

const BODY: Pt[] = [[10, -40], [65, 5], [12, 48], [-55, 8]];
const HEAD: Pt[] = [[10, -40], [38, -52], [44, -74], [14, -66]];
const EAR: Pt[] = [[38, -52], [44, -74], [52, -56]];
const EYE: Pt[] = [[28, -56], [34, -60], [40, -54], [34, -50]];
const SNOUT: Pt[] = [[44, -66], [58, -60], [46, -54]];
const TAIL: Pt[] = [[-55, 8], [-72, 0], [-76, 12], [-62, 18]];

type LegDef = { base: Pt; tip: Pt; hoof: [Pt, Pt, Pt] };
const LEGS: LegDef[] = [
  { base: [-45, 14], tip: [-56, 42], hoof: [[-56, 42], [-48, 56], [-64, 54]] },
  { base: [-22, 42], tip: [-24, 68], hoof: [[-24, 68], [-18, 80], [-30, 78]] },
  { base: [4, 48],   tip: [2, 74],   hoof: [[2, 74], [8, 86], [-4, 84]] },
  { base: [40, 36],  tip: [48, 60],  hoof: [[48, 60], [56, 70], [44, 72]] },
];

// ----------------------------------------------------------------
// Variant builder
// ----------------------------------------------------------------

type Config = {
  bodyPts: Pt[];
  headPts: Pt[];
  headOffY: number;
  earPts: Pt[][];
  showEye: boolean;
  snoutPts: Pt[];
  legs: LegDef[];
  legSW: number;
  tailPts: Pt[][];
  tailOffY: number;
  backSpikes: boolean;
  innerLines: boolean;
  doubleBody: boolean;
  globalScale: number;
  flipX: boolean;
  rotate: number;
  largeHooves: boolean;
  diamondBody: boolean;
  secondHead: boolean;
};

function buildConfig(type: number): Config {
  const c: Config = {
    bodyPts: [...BODY],
    headPts: [...HEAD],
    headOffY: 0,
    earPts: [[...EAR]],
    showEye: true,
    snoutPts: [...SNOUT],
    legs: LEGS.map(l => ({ ...l, hoof: [...l.hoof] as [Pt,Pt,Pt] })),
    legSW: 2,
    tailPts: [[...TAIL]],
    tailOffY: 0,
    backSpikes: false,
    innerLines: false,
    doubleBody: false,
    globalScale: 1,
    flipX: false,
    rotate: 0,
    largeHooves: false,
    diamondBody: false,
    secondHead: false,
  };

  switch (type) {
    case 2: c.bodyPts = scalePts(BODY, 1, 1.3); c.legs = LEGS.map(l => ({ base: [l.base[0], l.base[1]*1.3] as Pt, tip: [l.tip[0], l.tip[1]*1.3] as Pt, hoof: l.hoof.map(([x,y]) => [x, y*1.3]) as [Pt,Pt,Pt] })); break;
    case 3: c.bodyPts = scalePts(BODY, 1.3, 1); break;
    case 4:
      c.legs = [
        ...LEGS,
        { base: [18, 40] as Pt, tip: [18, 66] as Pt, hoof: [[18, 66], [24, 78], [12, 76]] as [Pt,Pt,Pt] },
        { base: [56, 28] as Pt, tip: [64, 52] as Pt, hoof: [[64, 52], [70, 62], [58, 64]] as [Pt,Pt,Pt] },
      ];
      break;
    case 5:
      c.tailPts = [
        [[-55,8],[-72,0],[-76,12],[-62,18]],
        [[-76,12],[-93,4],[-97,16],[-83,22]],
        [[-97,16],[-114,8],[-118,20],[-104,26]],
      ];
      break;
    case 6: c.showEye = false; break;
    case 7:
      c.earPts = [
        [...EAR],
        [[38,-52],[44,-80],[36,-64]],
        [[40,-60],[50,-82],[54,-66]],
      ];
      break;
    case 8:
      c.legs = LEGS.map(l => ({
        base: l.base,
        tip: [l.base[0] + (l.tip[0]-l.base[0])*0.6, l.base[1] + (l.tip[1]-l.base[1])*0.6] as Pt,
        hoof: l.hoof,
      }));
      c.legSW = 4;
      break;
    case 9: c.headOffY = -16; break;
    case 10: c.backSpikes = true; break;
    case 11: c.innerLines = true; break;
    case 12: c.headOffY = 16; break;
    case 13: c.tailOffY = -20; break;
    case 14: c.globalScale = 0.65; break;
    case 15: c.doubleBody = true; break;
    case 16: c.flipX = true; break;
    case 17: c.largeHooves = true; break;
    case 18:
      c.diamondBody = true;
      c.bodyPts = [[0,-50],[60,0],[0,50],[-60,0]];
      break;
    case 19: c.secondHead = true; break;
    case 20: c.rotate = -12; break;
  }
  return c;
}

// ----------------------------------------------------------------
// Animated Baku using Reanimated + Skia
// ----------------------------------------------------------------

type Props = {
  bakuType: number;
  size?: number;
  fragments?: DreamFragment[];
};

export default function BakuCanvas({ bakuType, size = 260, fragments = [] }: Props) {
  const cfg = useMemo(() => buildConfig(bakuType), [bakuType]);
  const cx = size / 2;
  const cy = size / 2 + 20;

  const STROKE = '#2A2A2A';
  const SW = 1.8;

  // --- Static paths (no animation on shape, transform instead) ---

  const bodyPath = useMemo(() => makePath(cfg.bodyPts), [cfg.bodyPts]);
  const headPath = useMemo(() => makePath(offPts(cfg.headPts, 0, cfg.headOffY)), [cfg.headPts, cfg.headOffY]);
  const earPaths = useMemo(() => cfg.earPts.map(pts => makePath(offPts(pts, 0, cfg.headOffY))), [cfg.earPts, cfg.headOffY]);
  const eyePath  = useMemo(() => makePath(offPts(EYE, 0, cfg.headOffY)), [cfg.headOffY]);
  const snoutPath = useMemo(() => makePath(offPts(cfg.snoutPts, 0, cfg.headOffY)), [cfg.snoutPts, cfg.headOffY]);
  const tailPaths = useMemo(() => cfg.tailPts.map(pts => makePath(offPts(pts, 0, cfg.tailOffY))), [cfg.tailPts, cfg.tailOffY]);

  const legPaths = useMemo(() => cfg.legs.map(leg => {
    const p = Skia.Path.Make();
    p.moveTo(leg.base[0], leg.base[1]);
    p.lineTo(leg.tip[0], leg.tip[1]);
    const h = leg.hoof;
    if (cfg.largeHooves) {
      const hcx = (h[0][0]+h[1][0]+h[2][0])/3;
      const hcy = (h[0][1]+h[1][1]+h[2][1])/3;
      const s = 1.8;
      p.moveTo(hcx+(h[0][0]-hcx)*s, hcy+(h[0][1]-hcy)*s);
      p.lineTo(hcx+(h[1][0]-hcx)*s, hcy+(h[1][1]-hcy)*s);
      p.lineTo(hcx+(h[2][0]-hcx)*s, hcy+(h[2][1]-hcy)*s);
    } else {
      p.moveTo(h[0][0], h[0][1]);
      p.lineTo(h[1][0], h[1][1]);
      p.lineTo(h[2][0], h[2][1]);
    }
    p.close();
    return p;
  }), [cfg.legs, cfg.largeHooves]);

  const doubleBodyPath = useMemo(() => cfg.doubleBody ? makePath(offPts(cfg.bodyPts, 4, 4)) : null, [cfg.doubleBody, cfg.bodyPts]);

  const innerLinePath = useMemo(() => {
    if (!cfg.innerLines) return null;
    const pts = cfg.bodyPts;
    const p = Skia.Path.Make();
    p.moveTo(pts[0][0], pts[0][1]); p.lineTo(pts[2][0], pts[2][1]);
    p.moveTo(pts[1][0], pts[1][1]); p.lineTo(pts[3][0], pts[3][1]);
    return p;
  }, [cfg.innerLines, cfg.bodyPts]);

  const spikePathSet = useMemo(() => {
    if (!cfg.backSpikes) return [];
    return [[-30,-16],[-10,-24],[10,-20]].map(([bx,by]) => {
      const p = Skia.Path.Make();
      p.moveTo(bx-6, by); p.lineTo(bx, by-14); p.lineTo(bx+6, by); p.close();
      return p;
    });
  }, [cfg.backSpikes]);

  const secondHeadPath = useMemo(() => cfg.secondHead ? makePath([[-20,-30],[2,-42],[6,-60],[-18,-54]]) : null, [cfg.secondHead]);

  const fragmentPaths = useMemo(() => fragments.map(frag => {
    const p = Skia.Path.Make();
    const s = frag.size / 2;
    p.moveTo(frag.x, frag.y - s);
    p.lineTo(frag.x + s, frag.y);
    p.lineTo(frag.x, frag.y + s);
    p.lineTo(frag.x - s, frag.y);
    p.close();
    return { path: p, frag };
  }), [fragments]);

  const groupTransform = useMemo(() => {
    const t: any[] = [{ translateX: cx }, { translateY: cy }];
    if (cfg.flipX) t.push({ scaleX: -1 });
    if (cfg.rotate !== 0) t.push({ rotate: (cfg.rotate * Math.PI) / 180 });
    if (cfg.globalScale !== 1) t.push({ scale: cfg.globalScale });
    return t;
  }, [cx, cy, cfg.flipX, cfg.rotate, cfg.globalScale]);

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={{ flex: 1 }}>
        <Group transform={groupTransform}>
          {/* Double outline */}
          {doubleBodyPath && (
            <Path path={doubleBodyPath} style="stroke" strokeWidth={SW} color={STROKE} opacity={0.3} />
          )}

          {/* Body */}
          <Path path={bodyPath} style="stroke" strokeWidth={SW} color={STROKE} />

          {/* Inner lines */}
          {innerLinePath && (
            <Path path={innerLinePath} style="stroke" strokeWidth={1} color={STROKE} opacity={0.2} />
          )}

          {/* Back spikes */}
          {spikePathSet.map((sp, i) => (
            <Path key={`spike-${i}`} path={sp} style="stroke" strokeWidth={1.2} color={STROKE} />
          ))}

          {/* Tail */}
          {tailPaths.map((tp, i) => (
            <Path key={`tail-${i}`} path={tp} style="stroke" strokeWidth={SW} color={STROKE} />
          ))}

          {/* Legs */}
          {legPaths.map((lp, i) => (
            <Path key={`leg-${i}`} path={lp} style="stroke" strokeWidth={cfg.legSW} color={STROKE} />
          ))}

          {/* Head */}
          <Path path={headPath} style="stroke" strokeWidth={SW} color={STROKE} />

          {/* Second head */}
          {secondHeadPath && (
            <Path path={secondHeadPath} style="stroke" strokeWidth={SW * 0.8} color={STROKE} opacity={0.8} />
          )}

          {/* Ears */}
          {earPaths.map((ep, i) => (
            <Path key={`ear-${i}`} path={ep} style="stroke" strokeWidth={SW} color={STROKE} />
          ))}

          {/* Eye (filled) */}
          {cfg.showEye && (
            <Path path={eyePath} style="fill" color={STROKE} />
          )}

          {/* Snout */}
          <Path path={snoutPath} style="stroke" strokeWidth={SW} color={STROKE} />

          {/* Dream fragments */}
          {fragmentPaths.map(({ path, frag }) => (
            <Path
              key={frag.id}
              path={path}
              style="fill"
              color={`hsl(${frag.hue}, ${frag.saturation}%, ${frag.lightness}%)`}
              opacity={frag.opacity}
            />
          ))}
        </Group>
      </Canvas>
    </View>
  );
}
