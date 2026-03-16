/**
 * BakuCanvas – D-2型バクの描画コンポーネント
 * react-native-svg 版（Expo Go 対応）
 */
import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import Svg, { Polygon, Polyline, Line, G } from 'react-native-svg';

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

function pts(arr: Pt[]): string {
  return arr.map(([x, y]) => `${x},${y}`).join(' ');
}

function scalePts(arr: Pt[], sx: number, sy: number): Pt[] {
  return arr.map(([x, y]) => [x * sx, y * sy]);
}

function offPts(arr: Pt[], dx: number, dy: number): Pt[] {
  return arr.map(([x, y]) => [x + dx, y + dy]);
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
    legs: LEGS.map(l => ({ ...l, hoof: [...l.hoof] as [Pt, Pt, Pt] })),
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
    case 2:
      c.bodyPts = scalePts(BODY, 1, 1.3);
      c.legs = LEGS.map(l => ({
        base: [l.base[0], l.base[1] * 1.3] as Pt,
        tip: [l.tip[0], l.tip[1] * 1.3] as Pt,
        hoof: l.hoof.map(([x, y]) => [x, y * 1.3]) as [Pt, Pt, Pt],
      }));
      break;
    case 3: c.bodyPts = scalePts(BODY, 1.3, 1); break;
    case 4:
      c.legs = [
        ...LEGS,
        { base: [18, 40] as Pt, tip: [18, 66] as Pt, hoof: [[18, 66], [24, 78], [12, 76]] as [Pt, Pt, Pt] },
        { base: [56, 28] as Pt, tip: [64, 52] as Pt, hoof: [[64, 52], [70, 62], [58, 64]] as [Pt, Pt, Pt] },
      ];
      break;
    case 5:
      c.tailPts = [
        [[-55, 8], [-72, 0], [-76, 12], [-62, 18]],
        [[-76, 12], [-93, 4], [-97, 16], [-83, 22]],
        [[-97, 16], [-114, 8], [-118, 20], [-104, 26]],
      ];
      break;
    case 6: c.showEye = false; break;
    case 7:
      c.earPts = [
        [...EAR],
        [[38, -52], [44, -80], [36, -64]],
        [[40, -60], [50, -82], [54, -66]],
      ];
      break;
    case 8:
      c.legs = LEGS.map(l => ({
        base: l.base,
        tip: [
          l.base[0] + (l.tip[0] - l.base[0]) * 0.6,
          l.base[1] + (l.tip[1] - l.base[1]) * 0.6,
        ] as Pt,
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
      c.bodyPts = [[0, -50], [60, 0], [0, 50], [-60, 0]];
      break;
    case 19: c.secondHead = true; break;
    case 20: c.rotate = -12; break;
  }
  return c;
}

// ----------------------------------------------------------------
// BakuCanvas component
// ----------------------------------------------------------------

type Props = {
  bakuType: number;
  size?: number;
  fragments?: DreamFragment[];
};

const STROKE = '#2A2A2A';
const SW = 1.8;

// Natural canvas size — geometry is always drawn in this coordinate space
const NATURAL = 260;

export default function BakuCanvas({ bakuType, size = 260, fragments = [] }: Props) {
  const cfg = useMemo(() => buildConfig(bakuType), [bakuType]);
  const cx = NATURAL / 2;
  const cy = NATURAL / 2 + 10;

  // ── 呼吸アニメーション（scaleY, native driver, 周期4秒）──────────
  const breathe = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1.015, duration: 2000, useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0.985, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ── JSアニメーションクロック（脚・尻尾・かけら用、20fps）────────
  const [animTime, setAnimTime] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      setAnimTime((Date.now() - start) / 1000);
    }, 50);
    return () => clearInterval(id);
  }, []);

  // ── まばたき（10〜15秒に一度、150ms 目が消える）─────────────────
  const [eyeVisible, setEyeVisible] = useState(true);
  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;
    const scheduleBlink = () => {
      t1 = setTimeout(() => {
        setEyeVisible(false);
        t2 = setTimeout(() => {
          setEyeVisible(true);
          scheduleBlink();
        }, 150);
      }, 10000 + Math.random() * 5000);
    };
    scheduleBlink();
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // ── 頭・耳・目・鼻先（静的オフセット）──────────────────────────
  const headPts = offPts(cfg.headPts, 0, cfg.headOffY);
  const earPtsList = cfg.earPts.map(ep => offPts(ep, 0, cfg.headOffY));
  const eyePts = offPts(EYE, 0, cfg.headOffY);
  const snoutPts = offPts(cfg.snoutPts, 0, cfg.headOffY);

  // ── 尻尾アニメーション（振幅5px、周期5秒）──────────────────────
  const tailOffX = Math.sin((animTime * Math.PI * 2) / 5) * 5;
  const animatedTailPtsList = cfg.tailPts.map(tp => {
    const base = offPts(tp, 0, cfg.tailOffY);
    // 根元(idx=0)は固定、先端へ向かうほど大きく揺れる
    return base.map((pt, idx) =>
      idx === 0 ? pt : [pt[0] + tailOffX * (idx / (base.length - 1)), pt[1]] as Pt
    );
  });

  // ── 脚アニメーション（振幅3px、周期2秒、4本の位相をずらす）────
  const animatedLegs = cfg.legs.map((leg, i) => {
    const phase = (i / 4) * Math.PI * 2;
    const xOff = Math.sin((animTime * Math.PI * 2) / 2 + phase) * 3;
    return {
      base: leg.base,
      tip: [leg.tip[0] + xOff, leg.tip[1]] as Pt,
      hoof: leg.hoof.map(([x, y]) => [x + xOff, y]) as [Pt, Pt, Pt],
    };
  });

  // ── グローバル transform ─────────────────────────────────────
  const transforms: string[] = [`translate(${cx}, ${cy})`];
  if (cfg.globalScale !== 1) transforms.push(`scale(${cfg.globalScale})`);
  if (cfg.flipX) transforms.push('scale(-1, 1)');
  if (cfg.rotate !== 0) transforms.push(`rotate(${cfg.rotate})`);
  const transform = transforms.join(' ');

  const spikePts: [number, number, number][] = [[-30, -16, 14], [-10, -24, 14], [10, -20, 14]];

  function hoofPts(hoof: [Pt, Pt, Pt]): Pt[] {
    if (!cfg.largeHooves) return hoof;
    const hcx = (hoof[0][0] + hoof[1][0] + hoof[2][0]) / 3;
    const hcy = (hoof[0][1] + hoof[1][1] + hoof[2][1]) / 3;
    return hoof.map(([x, y]) => [hcx + (x - hcx) * 1.8, hcy + (y - hcy) * 1.8]) as Pt[];
  }

  return (
    <Animated.View style={{ width: size, height: size, transform: [{ scaleY: breathe }] }}>
      <Svg width={size} height={size} viewBox={`0 0 ${NATURAL} ${NATURAL}`}>
        <G transform={transform}>
          {/* Double body outline */}
          {cfg.doubleBody && (
            <Polygon
              points={pts(offPts(cfg.bodyPts, 4, 4))}
              fill="none"
              stroke={STROKE}
              strokeWidth={SW}
              opacity={0.3}
            />
          )}

          {/* Body */}
          <Polygon points={pts(cfg.bodyPts)} fill="none" stroke={STROKE} strokeWidth={SW} />

          {/* Inner lines */}
          {cfg.innerLines && cfg.bodyPts.length >= 4 && (
            <>
              <Line
                x1={cfg.bodyPts[0][0]} y1={cfg.bodyPts[0][1]}
                x2={cfg.bodyPts[2][0]} y2={cfg.bodyPts[2][1]}
                stroke={STROKE} strokeWidth={1} opacity={0.2}
              />
              <Line
                x1={cfg.bodyPts[1][0]} y1={cfg.bodyPts[1][1]}
                x2={cfg.bodyPts[3][0]} y2={cfg.bodyPts[3][1]}
                stroke={STROKE} strokeWidth={1} opacity={0.2}
              />
            </>
          )}

          {/* Back spikes */}
          {cfg.backSpikes && spikePts.map(([bx, by, h], i) => (
            <Polygon
              key={`spike-${i}`}
              points={`${bx - 6},${by} ${bx},${by - h} ${bx + 6},${by}`}
              fill="none"
              stroke={STROKE}
              strokeWidth={1.2}
            />
          ))}

          {/* Tail（アニメーション済み） */}
          {animatedTailPtsList.map((tp, i) => (
            <Polygon key={`tail-${i}`} points={pts(tp)} fill="none" stroke={STROKE} strokeWidth={SW} />
          ))}

          {/* Legs（アニメーション済み） */}
          {animatedLegs.map((leg, i) => (
            <G key={`leg-${i}`}>
              <Polyline
                points={`${leg.base[0]},${leg.base[1]} ${leg.tip[0]},${leg.tip[1]}`}
                fill="none"
                stroke={STROKE}
                strokeWidth={cfg.legSW}
              />
              <Polygon
                points={pts(hoofPts(leg.hoof))}
                fill="none"
                stroke={STROKE}
                strokeWidth={cfg.legSW}
              />
            </G>
          ))}

          {/* Head */}
          <Polygon points={pts(headPts)} fill="none" stroke={STROKE} strokeWidth={SW} />

          {/* Second head (type 19) */}
          {cfg.secondHead && (
            <Polygon
              points="-20,-30 2,-42 6,-60 -18,-54"
              fill="none"
              stroke={STROKE}
              strokeWidth={SW * 0.8}
              opacity={0.8}
            />
          )}

          {/* Ears */}
          {earPtsList.map((ep, i) => (
            <Polygon key={`ear-${i}`} points={pts(ep)} fill="none" stroke={STROKE} strokeWidth={SW} />
          ))}

          {/* Eye（まばたきアニメーション） */}
          {cfg.showEye && eyeVisible && (
            <Polygon points={pts(eyePts)} fill={STROKE} stroke="none" />
          )}

          {/* Snout */}
          <Polygon points={pts(snoutPts)} fill="none" stroke={STROKE} strokeWidth={SW} />

          {/* Dream fragments（漂うアニメーション） */}
          {fragments.map(frag => {
            const animX = frag.x + Math.sin(animTime * 0.5 + frag.phase) * 2;
            const animY = frag.y + Math.cos(animTime * 0.4 + frag.phase) * 2;
            const s = frag.size / 2;
            const fragPts: Pt[] = [
              [animX, animY - s],
              [animX + s, animY],
              [animX, animY + s],
              [animX - s, animY],
            ];
            return (
              <Polygon
                key={frag.id}
                points={pts(fragPts)}
                fill={`hsl(${frag.hue}, ${frag.saturation}%, ${frag.lightness}%)`}
                opacity={frag.opacity}
                stroke="none"
              />
            );
          })}
        </G>
      </Svg>
    </Animated.View>
  );
}
