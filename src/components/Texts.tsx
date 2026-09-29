import React from 'react';
import {SANS, SERIF} from '../lib/fonts';
import {Cam, clamp01, easeOut, lerp, ramp, smoother, worldToScreen} from '../lib/timeline';
import {INTRO_LINE_Y} from './Light';

// Barcha ekrandagi matnlar (o‘zbek lotin alifbosi, ‘ = U+2018).
export const TEXT = {
  date: '1-oktabr',
  holiday: 'O‘qituvchi va murabbiylar kuni',
  greet1: 'Aziz ustozlar,',
  greet2: 'qadrli murabbiylar!',
  lesson1: 'Har bir sabog‘ingiz —',
  lesson2: 'kelajakka qo‘yilgan poydevor.',
  thanks1: 'Mehringiz va sabringiz',
  thanks2: 'uchun rahmat!',
  light1: 'Siz yoqqan ilm nuri',
  light2: 'avlodlar yo‘lini yoritadi.',
  wish1: 'Mustahkam sog‘lik',
  wish2: 'Oilaviy baxt',
  wish3: 'Sharafli mehnatingizga ulkan muvaffaqiyatlar!',
  holiday1: 'Bayramingiz muborak,',
  holiday2: 'aziz ustozlar!',
  sign1: 'Hurmat va ehtirom bilan,',
  sign2: 'Qo‘qon shahar 23-maktab maslahatchisi',
  sign3: 'Murodov Jasurbek',
};

const IVORY = '#f8f0e0';
const SHADOW = '0 2px 20px rgba(2,7,18,0.8), 0 0 3px rgba(2,7,18,0.6)';

const goldText: React.CSSProperties = {
  backgroundImage: 'linear-gradient(180deg, #fff3d2 0%, #f0d596 38%, #d2a95e 72%, #b58a42 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  textShadow: 'none',
  filter: 'drop-shadow(0 3px 12px rgba(2,7,18,0.8))',
};

const base: React.CSSProperties = {
  position: 'absolute',
  left: 0,
  width: 1920,
  textAlign: 'center',
  whiteSpace: 'nowrap',
  color: IVORY,
  textShadow: SHADOW,
  fontVariantNumeric: 'lining-nums',
  fontFeatureSettings: '"lnum" 1',
};

/** Kirish/chiqish: shaffoflik + yengil ko‘tarilish + xiralikdan aniqlikka. */
const fx = (t: number, a: number, b: number, c: number, d: number, dy = 26, blur = 10) => {
  const i = ramp(t, a, b, easeOut);
  const o = ramp(t, c, d, smoother);
  const op = clamp01(ramp(t, a, b, smoother) * (1 - o));
  return {
    opacity: op,
    transform: `translateY(${(1 - i) * dy - o * dy * 0.6}px)`,
    filter: `blur(${(1 - i) * blur + o * blur * 0.7}px)`,
  };
};

/** So‘zma-so‘z paydo bo‘lish. */
const Words: React.FC<{text: string; t: number; a: number; step: number; dur: number; c: number; d: number; style?: React.CSSProperties}> = ({
  text,
  t,
  a,
  step,
  dur,
  c,
  d,
  style,
}) => (
  <>
    {text.split(' ').map((w, i) => {
      const s = fx(t, a + i * step, a + i * step + dur, c, d, 22, 8);
      return (
        <span key={i} style={{display: 'inline-block', ...s, ...style}}>
          {w}
          {i < text.split(' ').length - 1 ? ' ' : ''}
        </span>
      );
    })}
  </>
);

/** Chiziqdan chiqib keluvchi yozuv (niqob orqali). dir=-1 — yuqoriga, 1 — pastga. */
const FromLine: React.FC<{
  t: number;
  lineY: number;
  dir: -1 | 1;
  height: number;
  a: number;
  b: number;
  c: number;
  d: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({t, lineY, dir, height, a, b, c, d, children, style}) => {
  const k = ramp(t, a, b, easeOut);
  const o = ramp(t, c, d, smoother);
  const off = (1 - k) * height * 0.9 * -dir;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        width: 1920,
        top: dir < 0 ? lineY - height : lineY,
        height,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          ...base,
          top: 0,
          height,
          lineHeight: `${height}px`,
          transform: `translateY(${off - o * 14 * -dir}px)`,
          opacity: clamp01(ramp(t, a, a + (b - a) * 0.5)) * (1 - o),
          filter: `blur(${o * 6}px)`,
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export const Texts: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const els: React.ReactNode[] = [];

  // 00:00–00:06 — sana va bayram nomi (kamera bilan birga yengil yaqinlashadi)
  if (t < 6) {
    const p = worldToScreen(cam, 960, INTRO_LINE_Y);
    els.push(
      <div
        key="intro"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          transformOrigin: `960px ${INTRO_LINE_Y}px`,
          transform: `translate(${p.x - 960}px, ${p.y - INTRO_LINE_Y}px) scale(${cam.z})`,
        }}
      >
        <FromLine t={t} lineY={INTRO_LINE_Y - 14} dir={-1} height={230} a={1.25} b={2.75} c={4.65} d={5.35}
          style={{fontFamily: SERIF, fontWeight: 700, fontSize: 196, letterSpacing: '0.01em'}}>
          <span style={{...goldText, padding: '0 20px'}}>{TEXT.date}</span>
        </FromLine>
        <FromLine t={t} lineY={INTRO_LINE_Y + 18} dir={1} height={100} a={2.0} b={3.25} c={4.75} d={5.45}
          style={{fontFamily: SERIF, fontWeight: 600, fontSize: 70, letterSpacing: '0.035em'}}>
          {TEXT.holiday}
        </FromLine>
      </div>,
    );
  }

  // 00:06–00:14
  if (t > 7.4 && t < 14.2) {
    els.push(
      <div key="greet" style={{...base, top: 150, fontFamily: SERIF, fontWeight: 600, fontSize: 108, lineHeight: '122px'}}>
        <div style={fx(t, 7.6, 8.9, 13.3, 14.0)}>
          <span style={goldText}>{TEXT.greet1}</span>
        </div>
        <div style={fx(t, 8.0, 9.3, 13.35, 14.05)}>{TEXT.greet2}</div>
      </div>,
    );
  }

  // 00:14–00:22
  if (t > 14.2 && t < 22.1) {
    els.push(
      <div key="lesson" style={{...base, top: 112, fontFamily: SERIF, fontWeight: 600, fontSize: 86, lineHeight: '104px'}}>
        <div>
          <Words text={TEXT.lesson1} t={t} a={14.45} step={0.2} dur={0.95} c={21.2} d={21.9} />
        </div>
        <div>
          <Words text={TEXT.lesson2} t={t} a={15.2} step={0.22} dur={0.95} c={21.25} d={21.95} style={goldText} />
        </div>
      </div>,
    );
  }

  // 00:22–00:28 (28-soniyagacha to‘liq chiqib ketadi)
  if (t > 22.4 && t < 28.1) {
    els.push(
      <div key="thanks" style={{...base, top: 150, fontFamily: SERIF, fontWeight: 600, fontSize: 100, lineHeight: '118px'}}>
        <div style={fx(t, 22.65, 23.9, 27.1, 27.85)}>{TEXT.thanks1}</div>
        <div style={fx(t, 23.1, 24.35, 27.15, 27.9)}>
          <span style={goldText}>{TEXT.thanks2}</span>
        </div>
      </div>,
    );
  }

  // 00:30–00:38 — nur yoyilib ochadigan yozuv
  if (t > 32.5 && t < 38.4) {
    const lineY = 540;
    els.push(
      <React.Fragment key="light">
        <FromLine t={t} lineY={lineY - 12} dir={-1} height={128} a={33.3} b={34.7} c={37.55} d={38.25}
          style={{fontFamily: SERIF, fontWeight: 600, fontSize: 100}}>
          Siz yoqqan <span style={goldText}>ilm nuri</span>
        </FromLine>
        <FromLine t={t} lineY={lineY + 14} dir={1} height={128} a={33.6} b={35.0} c={37.6} d={38.3}
          style={{fontFamily: SERIF, fontWeight: 600, fontSize: 100}}>
          {TEXT.light2}
        </FromLine>
      </React.Fragment>,
    );
  }

  // 00:38–00:46 — tilaklar ketma-ket
  if (t > 38.3 && t < 46.1) {
    const out: [number, number] = [45.3, 46.0];
    els.push(
      <div key="wishes" style={{...base, top: 0, fontFamily: SERIF, fontWeight: 600}}>
        <div style={{...base, top: 200, fontSize: 88, lineHeight: '110px', ...fx(t, 38.55, 39.75, out[0], out[1])}}>
          <span style={goldText}>{TEXT.wish1}</span>
        </div>
        <Divider y={330} t={t} a={39.4} c={out[0]} d={out[1]} />
        <div style={{...base, top: 350, fontSize: 88, lineHeight: '110px', ...fx(t, 39.9, 41.1, out[0] + 0.05, out[1] + 0.05)}}>
          <span style={goldText}>{TEXT.wish2}</span>
        </div>
        <Divider y={480} t={t} a={40.8} c={out[0]} d={out[1]} />
        <div style={{...base, top: 500, fontSize: 70, lineHeight: '96px', ...fx(t, 41.25, 42.5, out[0] + 0.1, out[1] + 0.1)}}>
          {TEXT.wish3}
        </div>
      </div>,
    );
  }

  // 00:46–00:53 — asosiy bayram tabrigi
  if (t > 46 && t < 53.2) {
    const letters = (txt: string, a: number, style?: React.CSSProperties) =>
      txt.split('').map((ch, i) => {
        const s = fx(t, a + i * 0.045, a + i * 0.045 + 1.0, 52.3 + i * 0.008, 53.0, 18, 9);
        return (
          <span key={i} style={{display: 'inline-block', whiteSpace: 'pre', ...s, ...style}}>
            {ch}
          </span>
        );
      });
    const sweep = ramp(t, 48.6, 50.6);
    els.push(
      <div key="holiday" style={{...base, top: 262, fontFamily: SERIF, fontWeight: 700, fontSize: 124, lineHeight: '146px'}}>
        <div>{letters(TEXT.holiday1, 46.25, goldText)}</div>
        <div style={{fontWeight: 600}}>{letters(TEXT.holiday2, 47.0)}</div>
        {sweep > 0 && sweep < 1 && (
          <div
            style={{
              position: 'absolute',
              left: lerp(260, 1660, sweep) - 160,
              top: -20,
              width: 320,
              height: 332,
              background: 'radial-gradient(closest-side, rgba(255,240,205,0.22), rgba(255,240,205,0))',
              mixBlendMode: 'screen',
              opacity: Math.sin(Math.PI * sweep),
            }}
          />
        )}
      </div>,
    );
  }

  // 00:53–01:00 — imzo (kamida 5 soniya to‘liq ko‘rinadi)
  if (t > 52.9) {
    els.push(
      <div key="sign" style={{...base, top: 0}}>
        <div style={{...base, top: 214, fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: 62, lineHeight: '76px', ...fx(t, 53.05, 54.0, 99, 100)}}>
          {TEXT.sign1}
        </div>
        <div style={{...base, top: 306, fontFamily: SANS, fontWeight: 500, fontSize: 44, lineHeight: '60px', letterSpacing: '0.05em', ...fx(t, 53.3, 54.25, 99, 100)}}>
          {TEXT.sign2}
        </div>
        <Divider y={402} t={t} a={53.5} c={99} d={100} wide />
        <div style={{...base, top: 420, fontFamily: SERIF, fontWeight: 700, fontSize: 134, lineHeight: '160px', ...fx(t, 53.55, 54.5, 99, 100, 20, 12)}}>
          <span style={{...goldText, padding: '0 16px'}}>{TEXT.sign3}</span>
        </div>
      </div>,
    );
  }

  return <>{els}</>;
};

/** Nozik oltin ajratgich: chiziq + romb. */
const Divider: React.FC<{y: number; t: number; a: number; c: number; d: number; wide?: boolean}> = ({y, t, a, c, d, wide}) => {
  const k = ramp(t, a, a + 0.9, easeOut);
  const o = ramp(t, c, d);
  const w = (wide ? 300 : 150) * k;
  return (
    <svg style={{position: 'absolute', left: 0, top: y - 10, opacity: clamp01(k * 1.4) * (1 - o)}} width={1920} height={20}>
      <defs>
        <linearGradient id={`div-${y}`} x1={960 - w - 10} x2={960 + w + 10} y1={0} y2={0} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#e3c27f" stopOpacity={0} />
          <stop offset="0.5" stopColor="#f1d9a0" stopOpacity={1} />
          <stop offset="1" stopColor="#e3c27f" stopOpacity={0} />
        </linearGradient>
      </defs>
      <line x1={960 - w - 10} x2={960 - 14} y1={10} y2={10} stroke={`url(#div-${y})`} strokeWidth={1.6} />
      <line x1={960 + 14} x2={960 + w + 10} y1={10} y2={10} stroke={`url(#div-${y})`} strokeWidth={1.6} />
      <polygon points="960,3 967,10 960,17 953,10" fill="#f1d9a0" transform={`rotate(${(1 - k) * 90} 960 10)`} />
    </svg>
  );
};
