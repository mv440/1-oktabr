import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {BokehParticles, DustParticles, TrailSparks} from './components/Particles';
import {Backdrop, Grain, Layer, Vignette} from './components/Background';
import {Book, BookRays, bookState} from './components/Book';
import {Corners, GirihPattern} from './components/Ornament';
import {Floral} from './components/Floral';
import {IntroLine, LightDefs, Orb, SPREAD, SpreadLine} from './components/Light';
import {Icons, Ink, Pen} from './components/PenInk';
import {Texts} from './components/Texts';
import {loadFonts} from './lib/fonts';
import {
  BOOK,
  FPS,
  HEIGHT,
  ORB_ARRIVE,
  ORB_BIRTH,
  WIDTH,
  camera,
  lerp,
  orbWorld,
  ramp,
  rand,
  smooth,
  worldToScreen,
} from './lib/timeline';

loadFonts();

/** 46–60 s: kompozitsiyani bezovchi sokin oltin zarralar (ekran koordinatalarida). */
const Celebration: React.FC<{t: number}> = ({t}) => {
  if (t < 45.8) return null;
  const out: React.ReactNode[] = [];
  const rate = 16;
  const from = 45.8;
  const first = Math.max(0, Math.floor((t - 5 - from) * rate));
  const last = Math.floor((t - from) * rate);
  for (let i = first; i <= last; i++) {
    const tb = from + i / rate;
    const life = 3 + rand(i * 1.7 + 3) * 2;
    const age = t - tb;
    if (age < 0 || age > life) continue;
    const side = rand(i * 2.9 + 1);
    const x0 = side < 0.5 ? lerp(330, 900, rand(i * 3.3)) : lerp(1020, 1590, rand(i * 3.3));
    const y0 = lerp(600, 860, rand(i * 4.1));
    const x = x0 + Math.sin(age * 0.9 + i) * 16;
    const y = y0 - age * (22 + rand(i * 5.5) * 26);
    const f = age / life;
    const tw = 0.6 + 0.4 * Math.sin(age * 5 + i);
    const a = Math.sin(Math.PI * f) * tw * (0.35 + 0.5 * rand(i * 6.1));
    const r = 1.4 + rand(i * 7.3) * 2.6;
    out.push(<circle key={i} cx={x} cy={y} r={r} fill={i % 4 === 0 ? '#fff7e6' : '#f2d28e'} opacity={a} />);
  }
  const intensity = ramp(t, 45.8, 47) * (1 - 0.45 * ramp(t, 53, 55));
  return <g opacity={intensity}>{out}</g>;
};

export type MainProps = {photo: string | null};

export const Main: React.FC<MainProps> = ({photo}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS; // global vaqt — qism bo‘yicha qayta boshlanmaydi
  const cam = camera(t);
  const bs = bookState(t);

  // Iliq fon yorug‘ligi asosiy nur manbaiga ergashadi
  const bookGlow = worldToScreen(cam, BOOK.x, BOOK.y - 150);
  const orbP = t >= ORB_BIRTH ? worldToScreen(cam, orbWorld(t).x, orbWorld(t).y) : bookGlow;
  const toOrb = ramp(t, ORB_BIRTH, ORB_BIRTH + 2, smooth) * (1 - ramp(t, 38, 42.5, smooth));
  const glowX = lerp(bookGlow.x, orbP.x, toOrb);
  const glowY = lerp(bookGlow.y, orbP.y, toOrb);
  const warmth = Math.max(ramp(t, 0.6, 3) * 0.55, bs.light) * (1 - 0.15 * ramp(t, 53, 58));

  const raysIntensity = bs.light * lerp(1, 0.6, ramp(t, 21.5, 24)) * lerp(1, 1.15, ramp(t, 40, 44));
  const ornament = ramp(t, 0.3, 3.2) * 0.14;

  return (
    <AbsoluteFill style={{backgroundColor: '#050d1f'}}>
      <Audio src={staticFile('audio/mix.wav')} />
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{position: 'absolute', inset: 0}}>
        <LightDefs />
        <Backdrop cam={cam} warmth={warmth} glowX={glowX} glowY={glowY} />
        <GirihPattern cam={cam} opacity={ornament} />
        <DustParticles t={t} cam={cam} intensity={ramp(t, 0.2, 2.5)} />
        <Layer cam={cam}>
          <IntroLine t={t} />
          <Floral t={t} />
          <g transform={`translate(${BOOK.x + bs.shiftX} ${BOOK.y})`}>
            <Book t={t}>
              <Ink t={t} />
              <Icons t={t} />
            </Book>
            <BookRays t={t} intensity={raysIntensity} />
            <Pen t={t} />
          </g>
          <Orb t={t} />
          <TrailSparks t={t} from={ORB_BIRTH + 0.3} to={ORB_ARRIVE + 0.4} pos={orbWorld} rate={20} seed={9} />
        </Layer>
        <Corners draw={ramp(t, 0.6, 3.6)} opacity={0.5} />
        <SpreadLine t={t} y={540} />
        <Vignette />
        <Celebration t={t} />
      </svg>
      <AbsoluteFill>
        <Texts t={t} cam={cam} photo={photo} />
      </AbsoluteFill>
      <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
        <BokehParticles t={t} cam={cam} intensity={ramp(t, 1, 4)} />
        <Grain />
      </svg>
    </AbsoluteFill>
  );
};

export {SPREAD};
