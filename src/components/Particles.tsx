import React from 'react';
import {Cam, CX, CY, HEIGHT, WIDTH, mod, rand} from '../lib/timeline';

/**
 * Suzib yuruvchi oltin zarrachalar. Holat faqat global vaqt t va kamera holatiga bog‘liq —
 * 30-soniyadagi bo‘linishda hech narsa qayta boshlanmaydi.
 */
type P = {x0: number; y0: number; vx: number; vy: number; r: number; a: number; depth: number; ph: number; tw: number};

const makeParticles = (n: number, seed: number, near: boolean): P[] =>
  new Array(n).fill(0).map((_, i) => {
    const s = seed + i * 13.37;
    return {
      x0: rand(s + 1) * 4000,
      y0: rand(s + 2) * 3000,
      vx: (rand(s + 3) - 0.5) * (near ? 14 : 8),
      vy: -(near ? 6 : 5) - rand(s + 4) * (near ? 14 : 12),
      r: near ? 10 + rand(s + 5) * 26 : 0.8 + rand(s + 5) * 1.9,
      a: near ? 0.05 + rand(s + 6) * 0.1 : 0.25 + rand(s + 6) * 0.55,
      depth: near ? 1.25 + rand(s + 7) * 0.45 : 0.3 + rand(s + 7) * 0.55,
      ph: rand(s + 8) * Math.PI * 2,
      tw: 0.25 + rand(s + 9) * 0.6,
    };
  });

const FAR = makeParticles(110, 11, false);
const NEAR = makeParticles(14, 77, true);

const M = 80;
const place = (p: P, t: number, cam: Cam) => {
  const sway = Math.sin(t * 0.35 + p.ph) * 18;
  const x = p.x0 + p.vx * t + sway - (cam.x - CX) * p.depth * cam.z;
  const y = p.y0 + p.vy * t - (cam.y - CY) * p.depth * cam.z;
  return {x: mod(x, WIDTH + 2 * M) - M, y: mod(y, HEIGHT + 2 * M) - M};
};

export const DustParticles: React.FC<{t: number; cam: Cam; intensity: number}> = ({t, cam, intensity}) => (
  <g>
    {FAR.map((p, i) => {
      const {x, y} = place(p, t, cam);
      const tw = 0.55 + 0.45 * Math.sin(t * p.tw * 2.2 + p.ph);
      const r = p.r * (0.85 + 0.3 * cam.z * p.depth);
      return (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={r}
          fill={i % 5 === 0 ? '#fff4dc' : '#e9c886'}
          opacity={p.a * tw * intensity}
        />
      );
    })}
  </g>
);

export const BokehParticles: React.FC<{t: number; cam: Cam; intensity: number}> = ({t, cam, intensity}) => (
  <g>
    <defs>
      <radialGradient id="bokeh">
        <stop offset="0" stopColor="#f6d898" stopOpacity={1} />
        <stop offset="0.55" stopColor="#e2b76a" stopOpacity={0.45} />
        <stop offset="1" stopColor="#e2b76a" stopOpacity={0} />
      </radialGradient>
    </defs>
    {NEAR.map((p, i) => {
      const {x, y} = place(p, t, cam);
      const tw = 0.6 + 0.4 * Math.sin(t * p.tw + p.ph);
      return <circle key={i} cx={x} cy={y} r={p.r * cam.z} fill="url(#bokeh)" opacity={p.a * tw * intensity} />;
    })}
  </g>
);

/**
 * Nur izidan tarqaluvchi uchqunlar (dunyo koordinatalarida).
 * Har bir uchqunning tug‘ilish vaqti global vaqt chizig‘ida qat’iy belgilangan.
 */
export const TrailSparks: React.FC<{
  t: number;
  from: number;
  to: number;
  pos: (t: number) => {x: number; y: number};
  rate?: number;
  seed?: number;
  scale?: number;
}> = ({t, from, to, pos, rate = 18, seed = 5, scale = 1}) => {
  const out: React.ReactNode[] = [];
  const dt = 1 / rate;
  const first = Math.max(0, Math.floor((t - 2.8 - from) / dt));
  const last = Math.floor((Math.min(t, to) - from) / dt);
  for (let i = first; i <= last; i++) {
    const tb = from + i * dt;
    const life = 1.6 + rand(seed + i * 3.1) * 1.2;
    const age = t - tb;
    if (age < 0 || age > life) continue;
    const p = pos(tb);
    const ang = rand(seed + i * 7.7) * Math.PI * 2;
    const sp = (10 + rand(seed + i * 5.3) * 38) * scale;
    const k = 1 - Math.exp(-age * 1.4);
    const x = p.x + Math.cos(ang) * sp * k * 1.6;
    const y = p.y + Math.sin(ang) * sp * k * 1.6 - age * 14 * scale;
    const f = age / life;
    const a = Math.sin(Math.PI * Math.min(1, f * 1.15)) * (0.5 + 0.5 * rand(seed + i));
    const r = (1.2 + rand(seed + i * 2.2) * 2.4) * scale * (1 - f * 0.5);
    out.push(<circle key={i} cx={x} cy={y} r={r} fill={i % 3 === 0 ? '#fff6e2' : '#f0cf8a'} opacity={a} />);
  }
  return <g>{out}</g>;
};
