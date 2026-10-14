import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import meta from '../../montaj/v3/shots.json';
import {SANS, SERIF, loadFonts} from '../lib/fonts';
import {Montaj} from './Montaj';

loadFonts();

// Instagram Reels xavfsiz zonasi: tepada ~220 px, pastda ~520 px (caption), o'ngda ~170 px (tugmalar).
const SAFE_L = 90;
const SAFE_R = 170;

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const ramp = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);

/** So'zma-so'z chiqadigan sarlavha. */
const Line: React.FC<{text: string; f: number; a: number; out: number; size: number; weight?: number; color?: string; font?: string; italic?: boolean; step?: number}> = ({
  text,
  f,
  a,
  out,
  size,
  weight = 800,
  color = '#fff',
  font = SANS,
  italic,
  step = 3,
}) => (
  <div style={{fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: 1.08, color, fontStyle: italic ? 'italic' : 'normal', letterSpacing: font === SANS ? '-0.01em' : 0}}>
    {text.split(' ').map((w, i) => {
      const k = easeOut(ramp(f, a + i * step, a + i * step + 9));
      const o = ramp(f, out, out + 7);
      return (
        <span
          key={i}
          style={{
            display: 'inline-block',
            marginRight: '0.24em',
            opacity: k * (1 - o),
            transform: `translateY(${(1 - k) * 28 - o * 16}px) scale(${0.92 + 0.08 * k})`,
            filter: `blur(${(1 - k) * 8 + o * 6}px)`,
            textShadow: '0 4px 24px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.6)',
          }}
        >
          {w}
        </span>
      );
    })}
  </div>
);

const Block: React.FC<{f: number; a: number; b: number; top: number; children: React.ReactNode; align?: 'left' | 'center'}> = ({f, a, b, top, children, align = 'left'}) => {
  if (f < a - 1 || f > b + 8) return null;
  const bg = ramp(f, a - 4, a + 6) * (1 - ramp(f, b, b + 8));
  return (
    <>
      <AbsoluteFill style={{background: `linear-gradient(180deg, rgba(0,0,0,0) ${top / 19.2 - 8}%, rgba(0,0,0,${0.42 * bg}) ${top / 19.2 + 6}%, rgba(0,0,0,0) ${top / 19.2 + 22}%)`}} />
      <div style={{position: 'absolute', left: SAFE_L, right: SAFE_R, top, textAlign: align}}>{children}</div>
    </>
  );
};

const Kicker: React.FC<{text: string; f: number; a: number; out: number}> = ({text, f, a, out}) => {
  const k = easeOut(ramp(f, a, a + 10));
  const o = ramp(f, out, out + 7);
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22, opacity: k * (1 - o)}}>
      <div style={{width: 64 * k, height: 4, background: '#ffc773', borderRadius: 2}} />
      <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 30, letterSpacing: '0.16em', color: '#ffd796', textShadow: '0 2px 12px rgba(0,0,0,0.6)'}}>{text}</div>
    </div>
  );
};

export const ReelsText: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      {/* 0.3–3.7 s: hook */}
      <Block f={f} a={8} b={104} top={250}>
        <Kicker text="QO‘QON · 23-MAKTAB" f={f} a={8} out={104} />
        <Line text="Tongni tabassum" f={f} a={14} out={104} size={84} />
        <Line text="bilan boshladik" f={f} a={22} out={106} size={84} color="#ffd796" />
      </Block>
      {/* 14.0–15.6 s: freeze */}
      <Block f={f} a={424} b={466} top={1150}>
        <Line text="Kichik e’tibor," f={f} a={424} out={466} size={70} weight={700} />
        <Line text="katta quvonch." f={f} a={432} out={468} size={70} weight={700} color="#ffd796" />
      </Block>
      {/* 22.2–25.7 s: cho'qqi */}
      <Block f={f} a={668} b={770} top={250}>
        <Line text="Eng chiroyli dars:" f={f} a={668} out={770} size={70} weight={700} />
        <Line text="bolalar tabassumi" f={f} a={678} out={772} size={74} color="#ffd796" />
      </Block>
      {/* 26.3–29 s: yakun */}
      <Block f={f} a={790} b={866} top={760} align="center">
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <Line text="Qo‘qon shahar" f={f} a={790} out={866} size={56} weight={600} font={SANS} />
          <Line text="23-maktab" f={f} a={798} out={866} size={124} weight={800} color="#ffd796" />
        </div>
      </Block>
    </AbsoluteFill>
  );
};

export const MontajReels: React.FC = () => (
  <AbsoluteFill>
    <Montaj />
    <ReelsText />
  </AbsoluteFill>
);

/** Reels muqovasi (1080x1920; markaziy 1080x1350 — profil to'rida ko'rinadigan qism). */
export const ReelsCover: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#000'}}>
    <OffthreadVideo src={staticFile('montaj/s1.mp4')} startFrom={meta.s1.handle + 30} muted style={{width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.06)'}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.55) 30%, rgba(0,0,0,0) 48%)'}} />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.4) 100%)'}} />
    <div style={{position: 'absolute', left: 70, right: 70, top: 330, textAlign: 'center'}}>
      <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: '0.18em', color: '#ffd796', marginBottom: 22}}>QO‘QON · 23-MAKTAB</div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 90, lineHeight: 1.04, color: '#fff', textShadow: '0 6px 30px rgba(0,0,0,0.6)'}}>
        Tongni tabassum
        <br />
        <span style={{color: '#ffd796'}}>bilan boshladik</span>
      </div>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: 46, color: 'rgba(255,255,255,0.85)', marginTop: 18}}>maktabdagi bir tong</div>
    </div>
  </AbsoluteFill>
);
