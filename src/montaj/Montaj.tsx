import React from 'react';
import {AbsoluteFill, Audio, Freeze, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import meta from '../../montaj/v3/shots.json';

// 9:16 montaj v3 (mobilograf uslubi). 30 fps, 876 kadr = 29.2 s. Musiqa taktlari: 1 takt = 60 kadr (120 BPM).
export const MONTAJ_FRAMES = 876;
type Id = keyof typeof meta;

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const ramp = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const backOut = (x: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(clamp(x) - 1, 3) + c1 * Math.pow(clamp(x) - 1, 2);
};
const noise = (f: number, s: number) => Math.sin(f * 12.9898 + s * 78.233) * 0.6 + Math.sin(f * 4.1 + s * 1.7) * 0.4;

/** Kadr: global [from, to) oralig'ida ko'rinadi; pre/post — o'tishlar uchun zaxira kadrlar. */
const Clip: React.FC<{id: Id; from: number; to: number; pre?: number; post?: number; style?: React.CSSProperties}> = ({
  id,
  from,
  to,
  pre = 0,
  post = 0,
  style,
}) => {
  const m = meta[id];
  return (
    <Sequence from={from - pre} durationInFrames={to - from + pre + post} layout="none">
      <AbsoluteFill style={style}>
        <OffthreadVideo src={staticFile(`montaj/${id}.mp4`)} startFrom={m.handle - pre} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
    </Sequence>
  );
};

const Filters: React.FC<{hb: number; vb: number; rgb: number}> = ({hb, vb, rgb}) => (
  <svg width={0} height={0} style={{position: 'absolute'}}>
    <defs>
      <filter id="hblur" x="-10%" y="0" width="120%" height="100%">
        <feGaussianBlur stdDeviation={`${hb} 0`} />
      </filter>
      <filter id="vblur" x="0" y="-10%" width="100%" height="120%">
        <feGaussianBlur stdDeviation={`0 ${vb}`} />
      </filter>
      <filter id="rgb" x="0" y="0" width="100%" height="100%">
        <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
        <feOffset in="r" dx={rgb} dy={0} result="ro" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
        <feOffset in="b" dx={-rgb} dy={0} result="bo" />
        <feBlend in="ro" in2="g" mode="screen" result="rg" />
        <feBlend in="rg" in2="bo" mode="screen" />
      </filter>
    </defs>
  </svg>
);

// Takt chegaralaridagi effektlar (global kadr)
const PUNCH: [number, number][] = [[60, 0.22], [240, 0.14], [360, 0.08], [660, 0.2], [840, 0.05]];
const FLASH: [number, number, number][] = [[60, 1, 7], [420, 0.85, 5], [480, 0.5, 10], [660, 0.9, 7]];
const SHAKE: [number, number, number][] = [[60, 26, 12], [660, 22, 12], [840, 10, 8]];
const RGB: [number, number][] = [[60, 5], [600, 4], [660, 4]];

export const Montaj: React.FC = () => {
  const f = useCurrentFrame();

  // Global kamera: punch, shake, takt pulsi
  let scale = 1;
  for (const [c, a] of PUNCH) if (f >= c && f < c + 10) scale *= 1 + a * (1 - easeOut((f - c) / 10));
  if (f >= 60 && f < 840) scale *= 1 + 0.018 * Math.exp(-((f - 60) % 60) / 5);
  let sx = 0;
  let sy = 0;
  for (const [c, a, d] of SHAKE)
    if (f >= c && f < c + d) {
      const k = 1 - (f - c) / d;
      sx += a * k * noise(f, 1);
      sy += a * k * noise(f, 2);
    }
  let rgb = 0;
  for (const [c, d] of RGB) if (f >= c && f < c + d) rgb = 22 * (1 - (f - c) / d);
  let flash = 0;
  for (const [c, a, d] of FLASH) if (f >= c - 2 && f < c + d) flash = Math.max(flash, a * (f < c ? (f - c + 2) / 2 : 1 - (f - c) / d));

  // Whip'lar: 120 (chapga), 300 (yuqoriga), 600 (o'ngga)
  const whip = (c: number) => {
    // bitta progress: chiqayotgan va kirayotgan kadr yonma-yon siljiydi (bo'shliq yo'q)
    const p = easeInOut(ramp(f, c - 4, c + 4));
    const out = p;
    const inn = p;
    const blur = 70 * Math.sin(Math.PI * ramp(f, c - 4, c + 4));
    return {out, inn, blur};
  };
  const w1 = whip(120);
  const w2 = whip(300);
  const w3 = whip(600);
  const hb = Math.max(w1.blur, w3.blur);
  const vb = w2.blur;

  // Freeze (420–450): "foto" effekti
  const fz = f >= 420 && f < 450;
  const pop = backOut(ramp(f, 420, 428));
  const unpop = easeInOut(ramp(f, 444, 450));
  const photoScale = 1 - 0.16 * pop * (1 - unpop);
  const photoRot = -3 * pop * (1 - unpop);
  const border = 26 * pop * (1 - unpop);

  // Ochilish (0–60): 3 vertikal panel
  const panel = (k: number, id: Id) => {
    const t0 = k * 15;
    const enter = backOut(ramp(f, t0, t0 + 9));
    const dir = k % 2 === 0 ? -1 : 1;
    const isMid = k === 1;
    const grow = isMid ? easeInOut(ramp(f, 50, 60)) : 0;
    const left = [0, 360, 720][k] + (isMid ? -360 * grow : 0);
    const width = 360 + (isMid ? 720 * grow : 0);
    const push = 1 + 0.05 * ramp(f, 45, 60);
    return (
      <div
        key={id}
        style={{
          position: 'absolute',
          top: 0,
          left: left + 4,
          width: width - 8,
          height: 1920,
          overflow: 'hidden',
          transform: `translateY(${(1 - enter) * dir * 1920}px)`,
          zIndex: isMid ? 2 : 1,
          borderRadius: 18 * (1 - grow),
        }}
      >
        <div style={{position: 'absolute', left: -(1080 - (width - 8)) / 2, top: 0, width: 1080, height: 1920, transform: `scale(${push})`}}>
          <Clip id={id} from={t0} to={60} />
        </div>
      </div>
    );
  };

  const vignette = 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.42) 100%)';
  const fadeOut = ramp(f, 846, 876);
  const leak = (c: number, d: number) => Math.sin(Math.PI * ramp(f, c - d, c + d));
  const leakA = Math.max(leak(480, 10), leak(780, 14), 0.6 * leak(60, 8));

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Audio src={staticFile('montaj/music.wav')} />
      <Filters hb={hb} vb={vb} rgb={rgb} />
      <AbsoluteFill
        style={{
          transform: `translate(${sx}px, ${sy}px) scale(${scale})`,
          filter: rgb > 0.5 ? 'url(#rgb)' : undefined,
        }}
      >
        {f < 60 && <AbsoluteFill style={{backgroundColor: '#05070c'}}>{[panel(0, 'p2'), panel(2, 'p3'), panel(1, 'p1')]}</AbsoluteFill>}

        {/* s1 hook -> whip chapga -> s2 */}
        <Clip id="s1" from={60} to={120} post={4} style={{transform: `translateX(${-1080 * w1.out}px)`, filter: w1.blur > 1 ? 'url(#hblur)' : undefined}} />
        <Clip id="s2" from={120} to={240} pre={4} style={{transform: `translateX(${1080 * (1 - w1.inn)}px)`, filter: w1.blur > 1 && f < 125 ? 'url(#hblur)' : undefined}} />
        <Clip id="s3" from={240} to={300} post={4} style={{transform: `translateY(${-1920 * w2.out}px)`, filter: w2.blur > 1 ? 'url(#vblur)' : undefined}} />
        <Clip id="s4" from={300} to={360} pre={4} style={{transform: `translateY(${1920 * (1 - w2.inn)}px)`, filter: w2.blur > 1 && f < 305 ? 'url(#vblur)' : undefined}} />

        {/* s5: topshirish lahzasi, 420–450 freeze */}
        <Clip id="s5" from={360} to={420} />
        {fz && (
          <Sequence from={420} durationInFrames={30} layout="none">
            <Freeze frame={0}>
              <AbsoluteFill>
                <AbsoluteFill style={{filter: 'blur(28px) brightness(0.55)', transform: 'scale(1.1)'}}>
                  <OffthreadVideo src={staticFile('montaj/s5.mp4')} startFrom={meta.s5.handle + 60} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                </AbsoluteFill>
                <AbsoluteFill
                  style={{
                    transform: `scale(${photoScale}) rotate(${photoRot}deg)`,
                    boxShadow: `0 30px 80px rgba(0,0,0,${0.55 * pop * (1 - unpop)})`,
                    border: `${border}px solid #fbf8f2`,
                    overflow: 'hidden',
                  }}
                >
                  <OffthreadVideo src={staticFile('montaj/s5.mp4')} startFrom={meta.s5.handle + 60} muted style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1 + 0.05 * ramp(f, 420, 450)})`}} />
                </AbsoluteFill>
              </AbsoluteFill>
            </Freeze>
          </Sequence>
        )}
        <Sequence from={450} durationInFrames={30 + 10} layout="none">
          <AbsoluteFill>
            <OffthreadVideo src={staticFile('montaj/s5.mp4')} startFrom={meta.s5.handle + 60} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </AbsoluteFill>
        </Sequence>

        {/* s6: dissolve (476–486) */}
        <Clip id="s6" from={480} to={600} pre={6} post={4} style={{opacity: ramp(f, 474, 486), transform: `translateX(${-1080 * w3.out}px)`, filter: w3.blur > 1 ? 'url(#hblur)' : undefined}} />
        <Clip id="s7" from={600} to={660} pre={4} style={{transform: `translateX(${1080 * (1 - w3.inn)}px)`, filter: w3.blur > 1 && f < 605 ? 'url(#hblur)' : undefined}} />
        <Clip id="s8" from={660} to={780} post={8} />
        <Clip id="s9" from={780} to={876} pre={9} style={{opacity: ramp(f, 771, 789), transform: `scale(${1 + 0.06 * ramp(f, 771, 876)})`}} />
      </AbsoluteFill>

      {/* yorug'lik sizishi (light leak) */}
      {leakA > 0.01 && (
        <AbsoluteFill
          style={{
            mixBlendMode: 'screen',
            opacity: leakA * 0.75,
            background: `radial-gradient(circle at ${30 + 40 * ramp(f, 460, 800)}% 35%, rgba(255,170,90,0.9), rgba(255,120,60,0.35) 35%, rgba(0,0,0,0) 65%)`,
          }}
        />
      )}
      <AbsoluteFill style={{background: vignette}} />
      <Grain f={f} />
      {flash > 0 && <AbsoluteFill style={{backgroundColor: '#fff', opacity: flash}} />}
      {fadeOut > 0 && <AbsoluteFill style={{backgroundColor: '#000', opacity: fadeOut}} />}
    </AbsoluteFill>
  );
};

/** Nozik kino doni: statik shovqin har kadrda siljiydi (arzon). */
const Grain: React.FC<{f: number}> = ({f}) => {
  const dx = Math.round((Math.sin(f * 91.7) * 0.5 + 0.5) * 200);
  const dy = Math.round((Math.sin(f * 37.3) * 0.5 + 0.5) * 200);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, mixBlendMode: 'overlay', opacity: 0.16}}>
      <filter id="grain-m">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={1} seed={3} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect x={-dx} y={-dy} width={1400} height={2240} filter="url(#grain-m)" />
    </svg>
  );
};
