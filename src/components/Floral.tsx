import React from 'react';
import {getLength, getPointAtLength, getTangentAtLength} from '@remotion/paths';
import {camera, clamp01, easeOut, lerp, ramp, smooth, smoother} from '../lib/timeline';

// Gul bezagi yakuniy kadrning ekran koordinatalarida chiziladi (chap yarmi, o‘ng tomoni — ko‘zgu),
// so‘ng dunyo koordinatalariga o‘tkaziladi — kamera orqaga chekinganda kompozitsiyaga tabiiy kiradi.

type Stem = {d: string; t0: number; t1: number; w: number};
const STEMS: Stem[] = [
  {d: 'M 640 905 C 520 940 390 922 322 852 C 256 786 226 690 236 590 C 246 490 282 410 300 330 C 307 298 304 266 292 238', t0: 38.7, t1: 42.5, w: 3},
  {d: 'M 520 931 C 470 985 380 1000 302 984 C 262 976 240 958 246 938 C 252 922 272 924 274 938', t0: 39.2, t1: 41.9, w: 2.4},
  {d: 'M 330 860 C 372 826 414 800 444 768', t0: 40.0, t1: 41.6, w: 2.2},
  {d: 'M 238 612 C 196 584 156 562 138 522 C 124 490 136 458 164 458 C 188 458 194 486 176 494', t0: 40.3, t1: 42.6, w: 2.2},
  {d: 'M 283 430 C 320 410 348 382 354 352 C 358 332 346 318 332 324', t0: 41.0, t1: 42.8, w: 2},
];

type Leaf = {stem: number; f: number; side: 1 | -1; len: number};
const LEAVES: Leaf[] = [
  {stem: 0, f: 0.12, side: 1, len: 30},
  {stem: 0, f: 0.22, side: -1, len: 34},
  {stem: 0, f: 0.36, side: 1, len: 32},
  {stem: 0, f: 0.5, side: -1, len: 30},
  {stem: 0, f: 0.63, side: 1, len: 30},
  {stem: 0, f: 0.76, side: -1, len: 26},
  {stem: 0, f: 0.87, side: 1, len: 22},
  {stem: 1, f: 0.3, side: -1, len: 26},
  {stem: 1, f: 0.55, side: 1, len: 24},
  {stem: 3, f: 0.3, side: 1, len: 22},
  {stem: 2, f: 0.45, side: -1, len: 20},
];

const lengths = STEMS.map((s) => getLength(s.d));

const at = (stem: number, f: number) => {
  const L = lengths[stem] * clamp01(f);
  const p = getPointAtLength(STEMS[stem].d, L);
  const tg = getTangentAtLength(STEMS[stem].d, L);
  return {x: p?.x ?? 0, y: p?.y ?? 0, ang: tg ? (Math.atan2(tg.y, tg.x) * 180) / Math.PI : 0};
};

const LeafShape: React.FC<{len: number}> = ({len}) => (
  <g>
    <path d={`M 0 0 C ${len * 0.3} ${-len * 0.34} ${len * 0.75} ${-len * 0.3} ${len} 0 C ${len * 0.75} ${len * 0.22} ${len * 0.3} ${len * 0.26} 0 0 Z`} fill="url(#leaf-grad)" stroke="#e6c47f" strokeWidth={1.2} />
    <path d={`M 2 0 C ${len * 0.4} ${-len * 0.04} ${len * 0.7} ${-len * 0.02} ${len * 0.92} 0`} stroke="#fff1cc" strokeWidth={0.9} fill="none" opacity={0.8} />
  </g>
);

const Tulip: React.FC<{k: number; t: number}> = ({k, t}) => {
  const open = smoother(k);
  const breathe = Math.sin(t * 0.8) * 1.2;
  return (
    <g transform={`scale(${lerp(0.2, 1, easeOut(k))})`}>
      <g transform={`rotate(${-14 * open - breathe})`}>
        <path d="M 0 0 C -18 -4 -30 -26 -22 -48 C -12 -36 -4 -20 0 0 Z" fill="url(#petal-grad)" stroke="#e8c67f" strokeWidth={1.3} />
      </g>
      <g transform={`rotate(${14 * open + breathe})`}>
        <path d="M 0 0 C 18 -4 30 -26 22 -48 C 12 -36 4 -20 0 0 Z" fill="url(#petal-grad)" stroke="#e8c67f" strokeWidth={1.3} />
      </g>
      <path d="M 0 2 C -15 -8 -16 -38 0 -58 C 16 -38 15 -8 0 2 Z" fill="url(#petal-grad-front)" stroke="#f0d08c" strokeWidth={1.4} />
      <path d="M 0 -6 L 0 -44" stroke="#c99c4e" strokeWidth={1} opacity={0.7} />
    </g>
  );
};

const Rosette: React.FC<{k: number; r: number; petals?: number; t: number}> = ({k, r, petals = 8, t}) => {
  const open = easeOut(k);
  const spin = t * 2;
  return (
    <g transform={`rotate(${spin}) scale(${lerp(0.15, 1, open)})`}>
      {new Array(petals).fill(0).map((_, i) => (
        <g key={i} transform={`rotate(${(360 / petals) * i + (1 - open) * 30})`}>
          <path d={`M 0 0 C ${r * 0.3} ${-r * 0.25} ${r * 0.8} ${-r * 0.32} ${r} 0 C ${r * 0.8} ${r * 0.32} ${r * 0.3} ${r * 0.25} 0 0 Z`} fill="url(#petal-grad)" stroke="#e8c67f" strokeWidth={1.1} />
        </g>
      ))}
      <circle r={r * 0.3} fill="#f5dfa8" stroke="#c99c4e" strokeWidth={1.2} />
      <circle r={r * 0.12} fill="#b98a3e" />
    </g>
  );
};

const Bud: React.FC<{k: number}> = ({k}) => (
  <g transform={`scale(${easeOut(k)})`}>
    <path d="M 0 0 C -9 -6 -9 -22 0 -30 C 9 -22 9 -6 0 0 Z" fill="url(#petal-grad-front)" stroke="#e8c67f" strokeWidth={1.2} />
  </g>
);

const Half: React.FC<{t: number}> = ({t}) => {
  const grow = STEMS.map((s) => ramp(t, s.t0, s.t1, (x) => smoother(x) * 0.6 + easeOut(x) * 0.4));
  const tip0 = at(0, 1);
  const tip2 = at(2, 1);
  const tip4 = at(4, 1);
  const tip3 = at(3, 1);
  return (
    <g>
      {STEMS.map((s, i) =>
        grow[i] > 0 ? (
          <path key={i} d={s.d} fill="none" stroke="url(#stem-grad)" strokeWidth={s.w} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - grow[i]} />
        ) : null,
      )}
      {LEAVES.map((l, i) => {
        const g = grow[l.stem];
        const k = clamp01((g - l.f) / 0.12);
        if (k <= 0) return null;
        const p = at(l.stem, l.f);
        const sway = Math.sin(t * 0.9 + i * 1.3) * 3;
        return (
          <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.ang + l.side * 58 + sway}) scale(${easeOut(k)})`}>
            <LeafShape len={l.len} />
          </g>
        );
      })}
      {grow[0] > 0.97 && (
        <g transform={`translate(${tip0.x} ${tip0.y}) rotate(${tip0.ang + 90})`}>
          <Tulip k={ramp(t, 42.2, 43.8)} t={t} />
        </g>
      )}
      {grow[2] > 0.97 && (
        <g transform={`translate(${tip2.x} ${tip2.y})`}>
          <Rosette k={ramp(t, 41.5, 43.1)} r={24} t={t} />
        </g>
      )}
      {grow[4] > 0.97 && (
        <g transform={`translate(${tip4.x} ${tip4.y}) rotate(${tip4.ang + 90})`}>
          <Bud k={ramp(t, 42.6, 43.6)} />
        </g>
      )}
      {grow[3] > 0.97 && (
        <g transform={`translate(${tip3.x} ${tip3.y})`}>
          <Rosette k={ramp(t, 42.5, 43.7)} r={13} petals={6} t={-t} />
        </g>
      )}
    </g>
  );
};

const CAM_F = camera(47);

export const Floral: React.FC<{t: number}> = ({t}) => {
  if (t < 38.6) return null;
  const glow = ramp(t, 42, 45, smooth);
  const sw = Math.sin(t * 0.55) * 0.5;
  return (
    <g transform={`translate(${CAM_F.x} ${CAM_F.y}) scale(${1 / CAM_F.z}) translate(-960 -540)`}>
      <defs>
        <linearGradient id="stem-grad" x1="0" y1="200" x2="0" y2="1000" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f3d596" />
          <stop offset="1" stopColor="#b8904a" />
        </linearGradient>
        <linearGradient id="leaf-grad" x1="0" y1="-10" x2="0" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#e9c985" stopOpacity={0.95} />
          <stop offset="1" stopColor="#a67e3a" stopOpacity={0.9} />
        </linearGradient>
        <linearGradient id="petal-grad" x1="0" y1="-50" x2="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff4dc" />
          <stop offset="1" stopColor="#d8b36a" />
        </linearGradient>
        <linearGradient id="petal-grad-front" x1="0" y1="-58" x2="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fffaf0" />
          <stop offset="0.6" stopColor="#f1d9a0" />
          <stop offset="1" stopColor="#c99c4e" />
        </linearGradient>
        <filter id="floral-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={6} />
        </filter>
      </defs>
      {[1, -1].map((side) => (
        <g key={side} transform={side === 1 ? '' : 'translate(1920 0) scale(-1 1)'}>
          <g transform={`rotate(${sw * side} 640 905)`}>
            <g opacity={0.35 * glow} filter="url(#floral-glow)">
              <Half t={t} />
            </g>
            <Half t={t} />
          </g>
        </g>
      ))}
    </g>
  );
};

export {lerp};
