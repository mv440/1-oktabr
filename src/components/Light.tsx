import React from 'react';
import {BOOK, ORB_ARRIVE, ORB_BIRTH, clamp01, easeOut, easeOutQuint, lerp, orbWorld, ramp, smooth, smoother} from '../lib/timeline';

export const LightDefs: React.FC = () => (
  <defs>
    <filter id="soft-glow" x="-50%" y="-200%" width="200%" height="500%">
      <feGaussianBlur stdDeviation={7} />
    </filter>
    <filter id="wide-glow" x="-50%" y="-400%" width="200%" height="900%">
      <feGaussianBlur stdDeviation={18} />
    </filter>
    <radialGradient id="orb-halo">
      <stop offset="0" stopColor="#ffe7ae" stopOpacity={0.5} />
      <stop offset="0.35" stopColor="#f0c472" stopOpacity={0.16} />
      <stop offset="1" stopColor="#f0c472" stopOpacity={0} />
    </radialGradient>
    <radialGradient id="orb-mid">
      <stop offset="0" stopColor="#fff6dc" stopOpacity={0.95} />
      <stop offset="0.4" stopColor="#ffdf9a" stopOpacity={0.45} />
      <stop offset="1" stopColor="#ffdf9a" stopOpacity={0} />
    </radialGradient>
    <radialGradient id="orb-core">
      <stop offset="0" stopColor="#ffffff" stopOpacity={1} />
      <stop offset="0.5" stopColor="#fff4d6" stopOpacity={0.9} />
      <stop offset="1" stopColor="#ffe4a8" stopOpacity={0} />
    </radialGradient>
  </defs>
);

/** Gorizontal oltin nur chizig‘i (markaz, yarim kenglik). */
export const GlowLine: React.FC<{
  x1: number;
  x2: number;
  y: number;
  opacity: number;
  edgeFade?: number;
  id: string;
  heads?: number;
  thickness?: number;
}> = ({x1, x2, y, opacity, edgeFade = 0.14, id, heads = 0, thickness = 1}) => {
  if (opacity <= 0.001 || x2 - x1 < 0.5) return null;
  const ef = Math.max(0.001, Math.min(0.49, edgeFade));
  return (
    <g opacity={opacity}>
      <defs>
        <linearGradient id={id} x1={x1} x2={x2} y1={0} y2={0} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f3d596" stopOpacity={0} />
          <stop offset={ef} stopColor="#f3d596" stopOpacity={1} />
          <stop offset="0.5" stopColor="#fff3d6" stopOpacity={1} />
          <stop offset={1 - ef} stopColor="#f3d596" stopOpacity={1} />
          <stop offset="1" stopColor="#f3d596" stopOpacity={0} />
        </linearGradient>
      </defs>
      <line x1={x1} x2={x2} y1={y} y2={y} stroke={`url(#${id})`} strokeWidth={16 * thickness} opacity={0.5} filter="url(#wide-glow)" />
      <line x1={x1} x2={x2} y1={y} y2={y} stroke={`url(#${id})`} strokeWidth={6 * thickness} opacity={0.75} filter="url(#soft-glow)" />
      <line x1={x1} x2={x2} y1={y} y2={y} stroke={`url(#${id})`} strokeWidth={2.4 * thickness} strokeLinecap="round" />
      {heads > 0.001 && (
        <g opacity={heads}>
          <circle cx={x1} cy={y} r={34} fill="url(#orb-mid)" />
          <circle cx={x2} cy={y} r={34} fill="url(#orb-mid)" />
          <circle cx={x1} cy={y} r={6} fill="url(#orb-core)" />
          <circle cx={x2} cy={y} r={6} fill="url(#orb-core)" />
        </g>
      )}
    </g>
  );
};

// Kirish chizig‘i: 1-oktabr yozuvini ochadi, so‘ng pastga tushib kitob muqovasining yuqori qirrasiga aylanadi.
export const INTRO_LINE_Y = 562;
export const IntroLine: React.FC<{t: number}> = ({t}) => {
  if (t > 8.2) return null;
  const draw = ramp(t, 0.45, 2.35, easeOutQuint);
  const half = 575 * draw;
  // Pastga tushish (dunyo koordinatalarida kitob muqovasining yuqori qirrasiga)
  const d = ramp(t, 5.0, 6.95, smoother);
  const coverTop = BOOK.y - 162;
  const coverX1 = BOOK.x - 223;
  const coverX2 = BOOK.x + 223;
  const x1 = lerp(960 - half, coverX1, d);
  const x2 = lerp(960 + half, coverX2, d);
  const y = lerp(INTRO_LINE_Y, coverTop, d);
  const heads = (1 - ramp(t, 1.9, 2.8)) * ramp(t, 0.45, 0.8);
  const op = ramp(t, 0.4, 0.8) * (1 - ramp(t, 7.1, 8.1));
  // Nozik yorug‘ “uchqun” chiziq bo‘ylab yuradi
  const shimmerT = (t - 2.6) / 2.2;
  return (
    <g>
      <GlowLine id="intro-line" x1={x1} x2={x2} y={y} opacity={op} edgeFade={lerp(0.16, 0.02, d)} heads={heads} />
      {shimmerT > 0 && shimmerT < 1 && (
        <circle cx={lerp(x1, x2, smooth(shimmerT))} cy={y} r={46} fill="url(#orb-mid)" opacity={Math.sin(Math.PI * shimmerT) * 0.5} />
      )}
    </g>
  );
};

/** Kitobdan ko‘tarilib o‘ngga yoyiluvchi oltin nur (dunyo koordinatalarida) + iz. */
export const Orb: React.FC<{t: number}> = ({t}) => {
  if (t < ORB_BIRTH || t > ORB_ARRIVE + 1.4) return null;
  const grow = ramp(t, ORB_BIRTH, ORB_BIRTH + 0.9, easeOut);
  const dissolve = ramp(t, ORB_ARRIVE - 0.2, ORB_ARRIVE + 1.2, smooth);
  const p = orbWorld(t);
  const pulse = 1 + 0.06 * Math.sin(t * 2.4);
  const s = grow * pulse * lerp(1, 1.6, dissolve);
  // iz: oldingi pozitsiyalar
  const trail: React.ReactNode[] = [];
  const N = 36;
  for (let k = N; k >= 1; k--) {
    const ta = Math.max(ORB_BIRTH, t - k * 0.04);
    const tb = Math.max(ORB_BIRTH, t - (k - 1) * 0.04);
    const a = orbWorld(ta);
    const b = orbWorld(tb);
    const f = 1 - k / N;
    trail.push(
      <line key={k} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#f7d58c" strokeLinecap="round" strokeWidth={lerp(1, 13, f) * grow} opacity={f * f * 0.55} />,
    );
  }
  return (
    <g opacity={1 - ramp(t, ORB_ARRIVE + 0.5, ORB_ARRIVE + 1.4)}>
      <g filter="url(#soft-glow)" opacity={1 - dissolve * 0.8}>{trail}</g>
      <circle cx={p.x} cy={p.y} r={300 * s} fill="url(#orb-halo)" />
      <circle cx={p.x} cy={p.y} r={95 * s} fill="url(#orb-mid)" />
      <circle cx={p.x} cy={p.y} r={20 * s * (1 - dissolve * 0.6)} fill="url(#orb-core)" />
    </g>
  );
};

// 30–38 s: nur yoyilib yangi yozuvni ochadi (ekran koordinatalarida, markazda).
export const SPREAD = {start: ORB_ARRIVE - 0.35, full: ORB_ARRIVE + 1.25, fadeOut: [37.7, 38.9] as const};
export const SpreadLine: React.FC<{t: number; y: number}> = ({t, y}) => {
  if (t < SPREAD.start || t > SPREAD.fadeOut[1]) return null;
  const k = ramp(t, SPREAD.start, SPREAD.full, easeOutQuint);
  const half = 640 * k;
  const op = clamp01(ramp(t, SPREAD.start, SPREAD.start + 0.3)) * (1 - ramp(t, SPREAD.fadeOut[0], SPREAD.fadeOut[1]));
  return <GlowLine id="spread-line" x1={960 - half} x2={960 + half} y={y} opacity={op} heads={1 - ramp(t, SPREAD.full - 0.4, SPREAD.full + 0.6)} edgeFade={0.18} />;
};

export {smooth};
