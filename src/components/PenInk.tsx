import React from 'react';
import {clamp01, easeInOutSine, easeOut, lerp, ramp, smooth, smoother} from '../lib/timeline';
import {pageLift} from './Book';

// Qalam yozadigan chiziq (kitob lokal koordinatalarida, ochiq holat).
export const INK_T = {enter: [13.85, 14.75] as const, write: [14.75, 18.45] as const, exit: [18.45, 19.7] as const};
const LOOPS = [
  {s: 0.17, R: 21, dw: 0.028},
  {s: 0.5, R: 24, dw: 0.03},
  {s: 0.83, R: 21, dw: 0.028},
];
const X0 = -360;
const X1 = 360;
const H_OPEN = 22;

type Pt = {x: number; y: number};

const buildInk = () => {
  const pts: Pt[] = [];
  const N = 520;
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    let x = lerp(X0, X1, s);
    let y = 44 + 8 * Math.sin(s * Math.PI * 4.2 + 0.4);
    for (const L of LOOPS) {
      const w = (s - (L.s - L.dw)) / (2 * L.dw);
      if (w > 0 && w < 1) {
        const a = 2 * Math.PI * smooth(w);
        x += -L.R * 0.95 * Math.sin(a);
        y += -L.R * (1 - Math.cos(a));
      }
    }
    y += pageLift(x, H_OPEN);
    pts.push({x, y});
  }
  const cum: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  }
  return {pts, cum, total: cum[cum.length - 1]};
};

const INK = buildInk();
const INK_D = 'M ' + INK.pts.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' L ');

const pointAt = (frac: number): Pt & {ang: number} => {
  const L = clamp01(frac) * INK.total;
  let i = 1;
  while (i < INK.cum.length - 1 && INK.cum[i] < L) i++;
  const a = INK.pts[i - 1];
  const b = INK.pts[i];
  const seg = INK.cum[i] - INK.cum[i - 1] || 1;
  const u = (L - INK.cum[i - 1]) / seg;
  return {x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), ang: Math.atan2(b.y - a.y, b.x - a.x)};
};

const writeProgress = (t: number) =>
  ramp(t, INK_T.write[0], INK_T.write[1], (x) => lerp(clamp01(x), easeInOutSine(x), 0.5));

/** Yozuv progressi berilgan ulushga yetgan vaqt (bisection). */
const timeAtFrac = (frac: number) => {
  let a: number = INK_T.write[0];
  let b: number = INK_T.write[1];
  for (let k = 0; k < 40; k++) {
    const m = (a + b) / 2;
    if (writeProgress(m) < frac) a = m;
    else b = m;
  }
  return (a + b) / 2;
};

const loopFrac = (s: number) => {
  const idx = Math.round(s * 520);
  return INK.cum[idx] / INK.total;
};

// Belgilar: kitob, ilm chirog‘i, kelajak (quyosh chiqishi)
export const ICONS = LOOPS.map((L, i) => {
  const f = loopFrac(L.s);
  const p = pointAt(f);
  return {
    from: {x: p.x, y: p.y - 18},
    to: [
      {x: -290, y: -228},
      {x: 0, y: -258},
      {x: 290, y: -228},
    ][i],
    start: timeAtFrac(f) - 0.15,
  };
});

export const ICON_FADE = [21.35, 22.35] as const;

const IconBook: React.FC<{d: number}> = ({d}) => (
  <g>
    <path pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - d}
      d="M 0 -18 C -12 -30 -32 -32 -50 -22 L -50 30 C -32 20 -12 22 0 32 C 12 22 32 20 50 30 L 50 -22 C 32 -32 12 -30 0 -18 Z" />
    <path pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - d} d="M 0 -18 L 0 32" />
    <g strokeWidth={2.2} opacity={clamp01(d * 2 - 1)}>
      <path d="M -40 -8 C -28 -14 -16 -14 -8 -8" />
      <path d="M -40 4 C -28 -2 -16 -2 -8 4" />
      <path d="M -40 16 C -28 10 -16 10 -8 16" />
      <path d="M 40 -8 C 28 -14 16 -14 8 -8" />
      <path d="M 40 4 C 28 -2 16 -2 8 4" />
    </g>
  </g>
);

const IconLamp: React.FC<{d: number; t: number}> = ({d, t}) => {
  const flick = 1 + 0.05 * Math.sin(t * 7.3) + 0.03 * Math.sin(t * 11.1);
  return (
    <g>
      <path pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - d}
        d="M -46 14 C -42 -2 -14 -6 8 0 L 46 -12 C 42 0 32 10 22 14 C 16 24 2 28 -14 28 C -32 28 -48 24 -46 14 Z" />
      <path pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - d} d="M -46 12 C -64 8 -64 -12 -44 -6" />
      <path pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - d} d="M -16 28 L -22 40 L 12 40 L 6 28" />
      <path pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - d} d="M -8 -2 C -6 -10 4 -10 6 -2" />
      <g opacity={clamp01(d * 1.6 - 0.6)} transform={`translate(47 -16) scale(1 ${flick})`}>
        <path d="M 0 0 C -9 -8 -8 -22 1 -36 C 9 -22 11 -9 0 0 Z" fill="#f7d98f" stroke="#fff1c4" strokeWidth={1.6} />
        <path d="M 0 -4 C -4 -9 -3 -16 1 -22 C 4 -15 5 -9 0 -4 Z" fill="#fffaf0" stroke="none" />
      </g>
    </g>
  );
};

const IconSunrise: React.FC<{d: number}> = ({d}) => (
  <g>
    <path pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - d} d="M -56 22 L 56 22" />
    <path pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - d} d="M -26 22 A 26 26 0 0 1 26 22" />
    {[150, 120, 90, 60, 30].map((deg, i) => {
      const a = (deg * Math.PI) / 180;
      const k = clamp01(d * 2 - 0.6 - i * 0.08);
      return (
        <line key={i} x1={Math.cos(a) * 36} y1={22 - Math.sin(a) * 36} x2={Math.cos(a) * lerp(36, 52, k)} y2={22 - Math.sin(a) * lerp(36, 52, k)} opacity={k > 0 ? 1 : 0} />
      );
    })}
    <g strokeWidth={2.2} opacity={clamp01(d * 2 - 1)}>
      <path d="M -40 34 L -10 34" />
      <path d="M 6 34 L 40 34" />
      <path d="M -22 44 L 22 44" />
    </g>
  </g>
);

export const Icons: React.FC<{t: number}> = ({t}) => {
  const fade = ramp(t, ICON_FADE[0], ICON_FADE[1], smooth);
  if (t < ICONS[0].start || fade >= 1) return null;
  return (
    <g>
      <defs>
        <radialGradient id="icon-halo">
          <stop offset="0" stopColor="#ffe2a0" stopOpacity={0.55} />
          <stop offset="0.5" stopColor="#f0c878" stopOpacity={0.16} />
          <stop offset="1" stopColor="#f0c878" stopOpacity={0} />
        </radialGradient>
        <filter id="icon-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={4} />
        </filter>
      </defs>
      {ICONS.map((ic, i) => {
        const rise = ramp(t, ic.start, ic.start + 1.25, smoother);
        if (rise <= 0) return null;
        const d = ramp(t, ic.start + 0.2, ic.start + 1.35, easeOut);
        const bob = Math.sin(t * 1.3 + i * 2.1) * 5 * ramp(t, ic.start + 1.2, ic.start + 2.2);
        // yig‘ilish: nurga aylanib, kitob markaziga tortiladi
        const gx = lerp(ic.to.x, 0, easeInOutSine(fade) * 0.85);
        const gy = lerp(ic.to.y, -150, easeInOutSine(fade) * 0.85);
        const x = lerp(ic.from.x, gx, rise);
        const y = lerp(ic.from.y, gy, rise) + bob;
        const sc = lerp(0.35, 1, rise) * lerp(1, 0.55, fade);
        const op = clamp01(rise * 1.5) * (1 - fade);
        const inner = i === 0 ? <IconBook d={d} /> : i === 1 ? <IconLamp d={d} t={t} /> : <IconSunrise d={d} />;
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${sc})`} opacity={op}>
            <circle r={105} fill="url(#icon-halo)" />
            <g fill="none" stroke="#ffd98a" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" opacity={0.45} filter="url(#icon-glow)">
              {inner}
            </g>
            <g fill="none" stroke="#f3d596" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
              {inner}
            </g>
          </g>
        );
      })}
    </g>
  );
};

export const Ink: React.FC<{t: number}> = ({t}) => {
  const p = writeProgress(t);
  if (p <= 0) return null;
  const fadeGlow = 1 - ramp(t, 20.5, 23.5);
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={INK_D} stroke="#ffd98a" strokeWidth={7} opacity={0.3 * fadeGlow} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} filter="url(#icon-glow)" />
      <path d={INK_D} stroke="#a67a2c" strokeWidth={2.8} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
    </g>
  );
};

const PenShape: React.FC<{shadow?: boolean}> = ({shadow}) => {
  if (shadow) {
    return (
      <path d="M 0 0 C 12 -3 30 -9 46 -10 L 96 -13 L 322 -13 C 334 -13 338 -6 338 0 C 338 6 334 13 322 13 L 96 13 L 46 10 C 30 9 12 3 0 0 Z" fill="#1a1206" />
    );
  }
  return (
    <g>
      {/* korpus */}
      <path d="M 96 -13 L 322 -13 C 334 -13 338 -6 338 0 C 338 6 334 13 322 13 L 96 13 Z" fill="url(#pen-body)" />
      <path d="M 100 -8 L 320 -8" stroke="#6f8fc7" strokeWidth={2} opacity={0.5} strokeLinecap="round" />
      {/* tutqich */}
      <path d="M 46 -10 L 96 -12 L 96 12 L 46 10 Z" fill="#0b1630" />
      <rect x={90} y={-13.5} width={8} height={27} fill="url(#pen-gold)" />
      <rect x={176} y={-13.5} width={6} height={27} fill="url(#pen-gold)" />
      <rect x={300} y={-13.5} width={5} height={27} fill="url(#pen-gold)" />
      {/* qisqich */}
      <path d="M 200 -17 L 306 -17 C 310 -17 312 -15 312 -13 L 200 -13 Z" fill="url(#pen-gold)" />
      <circle cx={204} cy={-16} r={3.4} fill="#f1d9a0" />
      {/* pero */}
      <path d="M 0 0 C 12 -3 30 -9 46 -10 L 46 10 C 30 9 12 3 0 0 Z" fill="url(#pen-gold)" />
      <path d="M 3 0 L 30 0" stroke="#7a5a22" strokeWidth={1.1} />
      <circle cx={31} cy={0} r={2.3} fill="#7a5a22" />
      <path d="M 12 -3 C 22 -5 34 -7 44 -7" stroke="#fff3cf" strokeWidth={1} opacity={0.7} fill="none" />
    </g>
  );
};

export const Pen: React.FC<{t: number}> = ({t}) => {
  if (t < INK_T.enter[0] || t > INK_T.exit[1]) return null;
  const start = pointAt(0);
  const end = pointAt(1);
  let x: number;
  let y: number;
  let lift: number;
  let rot = -52;
  if (t < INK_T.write[0]) {
    const k = ramp(t, INK_T.enter[0], INK_T.enter[1], easeOut);
    x = lerp(start.x + 460, start.x, k);
    y = lerp(start.y - 360, start.y, k);
    lift = lerp(60, 0, k);
    rot += lerp(-8, 0, k);
  } else if (t <= INK_T.write[1]) {
    const p = pointAt(writeProgress(t));
    x = p.x;
    y = p.y;
    lift = 0;
    rot += Math.sin(p.ang) * 4 + Math.sin(t * 3.1) * 1.2;
  } else {
    const k = ramp(t, INK_T.exit[0], INK_T.exit[1], (v) => smoother(v));
    x = lerp(end.x, end.x + 430, k);
    y = lerp(end.y, end.y - 420, k);
    lift = lerp(0, 70, k);
    rot += lerp(0, -10, k);
  }
  const op = ramp(t, INK_T.enter[0], INK_T.enter[0] + 0.35) * (1 - ramp(t, INK_T.exit[1] - 0.45, INK_T.exit[1]));
  return (
    <g opacity={op}>
      <defs>
        <linearGradient id="pen-body" x1="0" y1="-13" x2="0" y2="13" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2c4c86" />
          <stop offset="0.35" stopColor="#15305f" />
          <stop offset="1" stopColor="#081631" />
        </linearGradient>
        <linearGradient id="pen-gold" x1="0" y1="-14" x2="0" y2="14" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff0c2" />
          <stop offset="0.4" stopColor="#dcb56a" />
          <stop offset="1" stopColor="#8f6a2c" />
        </linearGradient>
        <filter id="pen-shadow-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={7} />
        </filter>
      </defs>
      {/* soya: yorug‘lik yuqori-chapdan */}
      <g transform={`translate(${x + lift * 0.7} ${y + lift * 0.9}) rotate(${rot + 14})`} opacity={0.28} filter="url(#pen-shadow-blur)">
        <PenShape shadow />
      </g>
      <g transform={`translate(${x} ${y - lift}) rotate(${rot})`}>
        <PenShape />
      </g>
    </g>
  );
};
