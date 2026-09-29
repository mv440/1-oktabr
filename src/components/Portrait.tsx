import React from 'react';
import {Img, staticFile} from 'remotion';
import {SANS} from '../lib/fonts';
import {clamp01, easeOut, lerp, ramp, smoother} from '../lib/timeline';
import {starPoints} from './Ornament';

// Yakuniy sahnadagi portret: ravoq (mehrob) shaklidagi oltin ramka ichida.
export const ARCH = {x: 430, y: 176, w: 330, h: 468};
export const PORTRAIT_T = {frame: [52.95, 54.1] as const, photo: [53.35, 54.6] as const};

/** Uchli ravoq konturi (lokal koordinatalarda, 0..w, 0..h). */
const archPath = (w: number, h: number, inset = 0) => {
  const x0 = inset;
  const x1 = w - inset;
  const y0 = inset;
  const y1 = h - inset;
  const cx = w / 2;
  const s = y0 + w * 0.5; // yon devorlar boshlanadigan balandlik
  return `M ${x0} ${y1} L ${x0} ${s} C ${x0} ${y0 + w * 0.2} ${cx - w * 0.12} ${y0 + w * 0.06} ${cx} ${y0} C ${cx + w * 0.12} ${y0 + w * 0.06} ${x1} ${y0 + w * 0.2} ${x1} ${s} L ${x1} ${y1} Z`;
};

export const Portrait: React.FC<{t: number; photo: string}> = ({t, photo}) => {
  const {x, y, w, h} = ARCH;
  const draw = ramp(t, PORTRAIT_T.frame[0], PORTRAIT_T.frame[1], easeOut);
  const show = ramp(t, PORTRAIT_T.photo[0], PORTRAIT_T.photo[1], smoother);
  if (draw <= 0) return null;
  const zoom = lerp(1.08, 1.02, ramp(t, 53.3, 60, (v) => clamp01(v)));
  const placeholder = photo === '__placeholder__';
  const clip = `path('${archPath(w, h, 14)}')`;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h}}>
      {/* iliq yorug‘lik */}
      <div
        style={{
          position: 'absolute',
          left: -120,
          top: -100,
          width: w + 240,
          height: h + 200,
          background: 'radial-gradient(closest-side, rgba(243,201,121,0.22), rgba(243,201,121,0))',
          opacity: draw,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: clip,
          opacity: show,
          filter: `blur(${(1 - show) * 10}px)`,
          background: '#0d1f40',
        }}
      >
        {placeholder ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, #1f3c6e 0%, #122a53 60%, #0c1d3d 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              color: 'rgba(247,239,223,0.75)',
              fontFamily: SANS,
              fontWeight: 500,
              fontSize: 26,
              letterSpacing: '0.12em',
              lineHeight: '40px',
            }}
          >
            RASMINGIZ
            <br />
            SHU YERDA
          </div>
        ) : (
          <Img
            src={staticFile(photo)}
            style={{width: '100%', height: '100%', objectFit: 'cover', transformOrigin: '50% 42%', transform: `scale(${zoom})`}}
          />
        )}
        {/* chetlari yumshoq qorong‘ilashadi — ramka bilan uyg‘unlashadi */}
        <div style={{position: 'absolute', inset: 0, boxShadow: 'inset 0 0 46px 10px rgba(110,78,32,0.38), inset 0 0 8px 2px rgba(5,13,31,0.5)'}} />
      </div>
      <svg width={w + 40} height={h + 40} style={{position: 'absolute', left: -20, top: -20, overflow: 'visible'}}>
        <defs>
          <linearGradient id="arch-gold" x1="0" y1="0" x2="0" y2={h} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fff0c8" />
            <stop offset="0.5" stopColor="#e2bf78" />
            <stop offset="1" stopColor="#b08a45" />
          </linearGradient>
          <filter id="arch-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={5} />
          </filter>
        </defs>
        <g transform="translate(20 20)" fill="none" strokeLinejoin="round">
          <path d={archPath(w, h, 2)} stroke="#f3d596" strokeWidth={6} opacity={0.35 * draw} filter="url(#arch-glow)" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
          <path d={archPath(w, h, 2)} stroke="url(#arch-gold)" strokeWidth={2.6} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
          <path d={archPath(w, h, 12)} stroke="url(#arch-gold)" strokeWidth={1.1} opacity={0.85} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
          <g opacity={clamp01(draw * 1.5 - 0.5)}>
            <polygon points={starPoints(w / 2, -2, 13)} fill="#f1d9a0" stroke="#fff0c8" strokeWidth={1} />
            <polygon points={starPoints(2, h - 2, 7)} fill="#e2bf78" />
            <polygon points={starPoints(w - 2, h - 2, 7)} fill="#e2bf78" />
          </g>
        </g>
      </svg>
    </div>
  );
};
