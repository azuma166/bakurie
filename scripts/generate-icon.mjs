import sharp from 'sharp';

const SIZE = 1024;
const BG = '#F7F4EF';
const STROKE = '#2A2A2A';

// Baku geometry (same as BakuCanvas, type 1)
const cx = SIZE / 2;
const cy = SIZE / 2 + 40;
const scale = SIZE / 260; // scale from 260-unit space to 1024

function s(x) { return x * scale; }
function tx(x) { return cx + s(x); }
function ty(y) { return cy + s(y); }
function pt(arr) { return arr.map(([x, y]) => `${tx(x)},${ty(y)}`).join(' '); }

// Dream fragments (20 pieces, golden angle spread)
function fragments() {
  const frags = [];
  for (let i = 0; i < 20; i++) {
    const ageRatio = i / 19;
    const isNew = ageRatio < 0.2;
    const angle = (i * 137.5 * Math.PI) / 180;
    const radius = isNew ? 10 + (i % 5) * 3 : 15 + ageRatio * 25;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const hue = (i * 47 + 200) % 360;
    const sat = isNew ? 70 : 40 - ageRatio * 20;
    const lit = 60 + ageRatio * 10;
    const sz = isNew ? 12 + (i % 3) * 4 : 5 + (1 - ageRatio) * 4;
    const op = isNew ? 0.75 : 0.3 + (1 - ageRatio) * 0.1;
    const hs = sz / 2;
    const px = tx(x); const py = ty(y);
    frags.push(`<polygon points="${px},${py - hs * scale} ${px + hs * scale},${py} ${px},${py + hs * scale} ${px - hs * scale},${py}" fill="hsl(${hue},${sat}%,${lit}%)" opacity="${op}"/>`);
  }
  return frags.join('\n');
}

const BODY  = [[ 10,-40],[65,5],[12,48],[-55,8]];
const HEAD  = [[ 10,-40],[38,-52],[44,-74],[14,-66]];
const EAR   = [[ 38,-52],[44,-74],[52,-56]];
const EYE   = [[ 28,-56],[34,-60],[40,-54],[34,-50]];
const SNOUT = [[ 44,-66],[58,-60],[46,-54]];
const TAIL  = [[-55,  8],[-72,0],[-76,12],[-62,18]];
const LEGS  = [
  { b:[-45,14], t:[-56,42], h:[[-56,42],[-48,56],[-64,54]] },
  { b:[-22,42], t:[-24,68], h:[[-24,68],[-18,80],[-30,78]] },
  { b:[  4,48], t:[  2,74], h:[[  2,74],[  8,86], [ -4,84]] },
  { b:[ 40,36], t:[ 48,60], h:[[ 48,60],[ 56,70],[  44,72]] },
];

const sw = s(2.2);

const legsPath = LEGS.map(l =>
  `<line x1="${tx(l.b[0])}" y1="${ty(l.b[1])}" x2="${tx(l.t[0])}" y2="${ty(l.t[1])}" stroke="${STROKE}" stroke-width="${sw}" stroke-linecap="round"/>` +
  `<polygon points="${pt(l.h)}" fill="none" stroke="${STROKE}" stroke-width="${sw}" stroke-linejoin="round"/>`
).join('\n');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" rx="${SIZE * 0.22}" fill="${BG}"/>
  ${fragments()}
  <polygon points="${pt(TAIL)}" fill="none" stroke="${STROKE}" stroke-width="${sw}" stroke-linejoin="round"/>
  ${legsPath}
  <polygon points="${pt(BODY)}" fill="none" stroke="${STROKE}" stroke-width="${sw}" stroke-linejoin="round"/>
  <polygon points="${pt(HEAD)}" fill="none" stroke="${STROKE}" stroke-width="${sw}" stroke-linejoin="round"/>
  <polygon points="${pt(EAR)}"  fill="none" stroke="${STROKE}" stroke-width="${sw}" stroke-linejoin="round"/>
  <polygon points="${pt(EYE)}"  fill="${STROKE}" stroke="none"/>
  <polygon points="${pt(SNOUT)}" fill="none" stroke="${STROKE}" stroke-width="${sw}" stroke-linejoin="round"/>
</svg>`;

await sharp(Buffer.from(svg)).resize(1024, 1024).png().toFile('assets/icon.png');
await sharp(Buffer.from(svg)).resize(1024, 1024).png().toFile('assets/adaptive-icon.png');
await sharp(Buffer.from(svg)).resize(512,  512).png().toFile('assets/splash-icon.png');
await sharp(Buffer.from(svg)).resize(48,   48).png().toFile('assets/favicon.png');

console.log('Icons generated successfully.');
