import React from 'react';
import {Cam, CX, CY, HEIGHT, WIDTH, camTransform, clamp01} from '../lib/timeline';
import {COLORS} from './Background';

const S = 150; // girih plitasi o‘lchami

const starPoints = (cx: number, cy: number, R: number) => {
  const pts: string[] = [];
  const r = R * 0.7654;
  for (let k = 0; k < 16; k++) {
    const a = (k * Math.PI) / 8 - Math.PI / 2;
    const rr = k % 2 === 0 ? R : r;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
};

const octagon = (cx: number, cy: number, R: number) => {
  const pts: string[] = [];
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4 + Math.PI / 8;
    pts.push(`${(cx + R * Math.cos(a)).toFixed(2)},${(cy + R * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
};

/** O‘zbek girih naqshi (8 qirrali yulduz to‘ri) — faqat ekran chetlarida, juda mayin. */
export const GirihPattern: React.FC<{cam: Cam; opacity: number}> = ({cam, opacity}) => {
  const c = S / 2;
  const R = S * 0.3;
  const spokes: [number, number][] = [
    [S, c],
    [0, c],
    [c, 0],
    [c, S],
    [0, 0],
    [S, 0],
    [0, S],
    [S, S],
  ];
  return (
    <g opacity={opacity}>
      <defs>
        <pattern id="girih" width={S} height={S} patternUnits="userSpaceOnUse">
          <g fill="none" stroke={COLORS.gold} strokeWidth={1.3} strokeLinejoin="round">
            <polygon points={starPoints(c, c, R)} />
            <polygon points={starPoints(c, c, R * 0.55)} strokeWidth={0.9} />
            {spokes.map(([x, y], i) => {
              const a = Math.atan2(y - c, x - c);
              const rr = i < 4 ? R : R;
              return (
                <line
                  key={i}
                  x1={c + rr * Math.cos(a)}
                  y1={c + rr * Math.sin(a)}
                  x2={x}
                  y2={y}
                />
              );
            })}
            {[
              [0, 0],
              [S, 0],
              [0, S],
              [S, S],
            ].map(([x, y], i) => (
              <polygon key={i} points={octagon(x, y, S * 0.1)} strokeWidth={1} />
            ))}
          </g>
        </pattern>
        <radialGradient
          id="girih-mask-grad"
          cx={CX}
          cy={CY}
          r={1080}
          gradientUnits="userSpaceOnUse"
          gradientTransform={`translate(${CX} ${CY}) scale(1 0.62) translate(${-CX} ${-CY})`}
        >
          <stop offset="0.58" stopColor="#000" />
          <stop offset="0.86" stopColor="#fff" stopOpacity={0.75} />
          <stop offset="1" stopColor="#fff" />
        </radialGradient>
        <mask id="girih-mask" maskUnits="userSpaceOnUse" x={0} y={0} width={WIDTH} height={HEIGHT}>
          <rect width={WIDTH} height={HEIGHT} fill="url(#girih-mask-grad)" />
        </mask>
      </defs>
      <g mask="url(#girih-mask)">
        <g transform={camTransform(cam, 0.22)}>
          <rect x={-2400} y={-2000} width={7200} height={5200} fill="url(#girih)" />
        </g>
      </g>
    </g>
  );
};

/** Burchakdagi nafis islimiy bezak (yuqori-chap burchak uchun chizilgan, qolganlari ko‘zgu). */
const CornerPiece: React.FC<{draw: number}> = ({draw}) => {
  const d = clamp01(draw);
  const dash = {strokeDasharray: '1 1', strokeDashoffset: 1 - d};
  return (
    <g fill="none" stroke="url(#corner-grad)" strokeLinecap="round" strokeLinejoin="round">
      <path pathLength={1} style={dash} strokeWidth={1.6} d="M 64 330 L 64 64 L 330 64" />
      <path pathLength={1} style={dash} strokeWidth={1} d="M 76 250 L 76 76 L 250 76" />
      <path
        pathLength={1}
        style={dash}
        strokeWidth={1.4}
        d="M 76 76 C 118 88 150 118 150 152 C 150 180 124 192 108 178 C 94 166 102 144 120 146 C 134 148 136 164 126 168"
      />
      <path
        pathLength={1}
        style={dash}
        strokeWidth={1.2}
        d="M 112 84 C 150 70 196 78 214 104 C 226 122 212 140 196 132 C 184 126 190 110 202 114"
      />
      <path
        pathLength={1}
        style={dash}
        strokeWidth={1.2}
        d="M 84 112 C 70 150 78 196 104 214 C 122 226 140 212 132 196 C 126 184 110 190 114 202"
      />
      <g opacity={d}>
        <polygon points={starPoints(64, 64, 13)} strokeWidth={1.2} fill="rgba(216,179,106,0.18)" />
        <path strokeWidth={1.1} d="M 250 76 C 262 68 278 68 290 76 C 278 84 262 84 250 76 Z" />
        <path strokeWidth={1.1} d="M 76 250 C 68 262 68 278 76 290 C 84 278 84 262 76 250 Z" />
        <circle cx={330} cy={64} r={2.6} fill={COLORS.gold} stroke="none" />
        <circle cx={64} cy={330} r={2.6} fill={COLORS.gold} stroke="none" />
      </g>
    </g>
  );
};

export const Corners: React.FC<{draw: number; opacity: number}> = ({draw, opacity}) => (
  <g opacity={opacity}>
    <defs>
      <linearGradient id="corner-grad" x1="0" y1="0" x2="340" y2="340" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor={COLORS.goldLight} />
        <stop offset="0.6" stopColor={COLORS.gold} />
        <stop offset="1" stopColor={COLORS.gold} stopOpacity={0.2} />
      </linearGradient>
    </defs>
    <CornerPiece draw={draw} />
    <g transform={`translate(${WIDTH} 0) scale(-1 1)`}>
      <CornerPiece draw={draw} />
    </g>
    <g transform={`translate(0 ${HEIGHT}) scale(1 -1)`}>
      <CornerPiece draw={draw} />
    </g>
    <g transform={`translate(${WIDTH} ${HEIGHT}) scale(-1 -1)`}>
      <CornerPiece draw={draw} />
    </g>
  </g>
);

export {starPoints};
