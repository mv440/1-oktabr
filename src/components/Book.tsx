import React from 'react';
import {clamp01, easeOut, lerp, ramp, smooth, smoother} from '../lib/timeline';
import {starPoints} from './Ornament';

// Kitob geometriyasi (kitobning lokal koordinatalari: umurtqa markazi = 0,0)
export const PW = 430; // sahifa kengligi
export const PH = 290; // sahifa balandligi (perspektivada)
const CM = 16; // muqova chetdan chiqishi
const CMV = 13;
const CW = PW + CM;
const CH = PH + 2 * CMV;
const LAYERS = 6;
const STEP = 2.6;
const K_LIFT = 0.32; // varaq ko‘tarilganda “tepaga” siljish koeffitsiyenti

// Vaqtlar (soniya)
export const BOOK_T = {
  outline: [6.75, 7.75] as const,
  fill: [7.2, 8.15] as const,
  cover: [8.1, 9.75] as const,
  pages: 8.4,
  pageStep: 0.2,
  pageDur: 1.45,
  curve: [9.9, 11.0] as const,
  light: [9.1, 11.4] as const,
};
const N_FLIP = 4;

/** Sahifa egriligi (umurtqa yonida ko‘tarilgan varaqlar). */
const curveF = (u: number) => (1 - Math.exp(-u * 10)) * (1 - 0.42 * u);
export const pageLift = (x: number, h: number) => -h * curveF(Math.min(1, Math.abs(x) / PW));

const sheetPath = (sign: number, w: number, hh: number, h: number, dy = 0, dx = 0) => {
  const top: string[] = [];
  const bot: string[] = [];
  const n = 22;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const x = sign * (u * w + (u > 0 ? dx : 0));
    const lift = -h * curveF(u);
    top.push(`${x.toFixed(2)},${(-hh / 2 + lift + dy).toFixed(2)}`);
    bot.push(`${x.toFixed(2)},${(hh / 2 + lift + dy).toFixed(2)}`);
  }
  return `M ${top.join(' L ')} L ${bot.reverse().join(' L ')} Z`;
};

const affine = (theta: number) => {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return `matrix(${c} ${-K_LIFT * s} 0 1 0 0)`;
};

const CoverFront: React.FC = () => (
  <g>
    <rect x={0} y={-CH / 2} width={CW} height={CH} rx={6} fill="url(#cover-grad)" />
    <rect x={0} y={-CH / 2} width={CW} height={CH} rx={6} fill="none" stroke="#c9a45c" strokeWidth={2} />
    <rect x={18} y={-CH / 2 + 18} width={CW - 36} height={CH - 36} rx={3} fill="none" stroke="#d8b36a" strokeWidth={1.6} />
    <rect x={26} y={-CH / 2 + 26} width={CW - 52} height={CH - 52} rx={2} fill="none" stroke="#d8b36a" strokeWidth={0.7} opacity={0.8} />
    <g transform={`translate(${CW / 2 + 6} 0)`} fill="none" stroke="#e2c07c">
      <circle r={70} strokeWidth={1.2} opacity={0.7} />
      <circle r={62} strokeWidth={0.7} opacity={0.6} />
      <polygon points={starPoints(0, 0, 54)} strokeWidth={1.8} fill="rgba(216,179,106,0.12)" />
      <polygon points={starPoints(0, 0, 30)} strokeWidth={1.2} transform="rotate(22.5)" />
      <circle r={8} fill="#e2c07c" stroke="none" />
    </g>
    {[
      [30, -CH / 2 + 30],
      [CW - 30, -CH / 2 + 30],
      [30, CH / 2 - 30],
      [CW - 30, CH / 2 - 30],
    ].map(([x, y], i) => (
      <polygon key={i} points={starPoints(x, y, 7)} fill="#d8b36a" />
    ))}
    {/* umurtqa tomondagi soya */}
    <rect x={0} y={-CH / 2} width={22} height={CH} fill="url(#spine-shade)" />
  </g>
);

const CoverInside: React.FC = () => (
  <g>
    <rect x={0} y={-CH / 2} width={CW} height={CH} rx={6} fill="#183260" />
    <rect x={0} y={-CH / 2} width={CW} height={CH} rx={6} fill="none" stroke="#c9a45c" strokeWidth={2} />
    <rect x={10} y={-CH / 2 + 10} width={CW - 20} height={CH - 20} fill="none" stroke="#c9a45c" strokeWidth={0.8} opacity={0.6} />
  </g>
);

const PageFlat: React.FC<{shade: number}> = ({shade}) => (
  <g>
    <rect x={0} y={-PH / 2} width={PW} height={PH} fill="url(#page-grad-r)" />
    <rect x={0} y={-PH / 2} width={PW} height={PH} fill="#3a2a10" opacity={(1 - shade) * 0.55} />
    <rect x={0} y={-PH / 2} width={PW} height={PH} fill="none" stroke="#cdb88f" strokeWidth={0.8} />
  </g>
);

/** Sahifadagi juda xira “matn qatorlari”. */
const TextLines: React.FC<{sign: number; h: number}> = ({sign, h}) => {
  const lines: React.ReactNode[] = [];
  const rows = [-104, -84, -64, -44, 96, 116];
  rows.forEach((y, i) => {
    const x0 = 46;
    const x1 = PW - 40 - (i % 3 === 2 ? 90 : 0);
    const pts: string[] = [];
    for (let k = 0; k <= 10; k++) {
      const x = lerp(x0, x1, k / 10);
      pts.push(`${(sign * x).toFixed(1)},${(y + pageLift(x, h)).toFixed(1)}`);
    }
    lines.push(<polyline key={i} points={pts.join(' ')} />);
  });
  return (
    <g fill="none" stroke="#8a7550" strokeWidth={3} strokeLinecap="round" opacity={0.13} strokeDasharray="26 7 40 6 18 8">
      {lines}
    </g>
  );
};

export const BookDefs: React.FC = () => (
  <defs>
    <linearGradient id="cover-grad" x1="0" y1={-CH / 2} x2={CW} y2={CH / 2} gradientUnits="userSpaceOnUse">
      <stop offset="0" stopColor="#1f3d72" />
      <stop offset="0.55" stopColor="#132a55" />
      <stop offset="1" stopColor="#0c1d3d" />
    </linearGradient>
    <linearGradient id="spine-shade" x1="0" x2="22" y1="0" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stopColor="#000" stopOpacity={0.45} />
      <stop offset="1" stopColor="#000" stopOpacity={0} />
    </linearGradient>
    <linearGradient id="page-grad-r" x1="0" x2={PW} y1="0" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stopColor="#d6c29c" />
      <stop offset="0.07" stopColor="#ecdfc3" />
      <stop offset="0.45" stopColor="#fbf4e3" />
      <stop offset="1" stopColor="#f3e8d0" />
    </linearGradient>
    <linearGradient id="page-grad-l" x1="0" x2={-PW} y1="0" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stopColor="#d6c29c" />
      <stop offset="0.07" stopColor="#ecdfc3" />
      <stop offset="0.45" stopColor="#fbf4e3" />
      <stop offset="1" stopColor="#f3e8d0" />
    </linearGradient>
    <radialGradient id="page-glow" cx="0" cy={-PH / 2 + 20} r={430} gradientUnits="userSpaceOnUse">
      <stop offset="0" stopColor="#fff1c9" stopOpacity={0.95} />
      <stop offset="0.5" stopColor="#ffd98a" stopOpacity={0.35} />
      <stop offset="1" stopColor="#ffd98a" stopOpacity={0} />
    </radialGradient>
    <filter id="book-shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation={26} />
    </filter>
  </defs>
);

export type BookState = {
  appear: number;
  fill: number;
  open: number;
  h: number;
  light: number;
  shiftX: number;
};

export const bookState = (t: number): BookState => {
  const open = ramp(t, BOOK_T.cover[0], BOOK_T.cover[1], smoother);
  return {
    appear: ramp(t, BOOK_T.outline[0], BOOK_T.outline[1], smooth),
    fill: ramp(t, BOOK_T.fill[0], BOOK_T.fill[1]),
    open,
    h: 22 * ramp(t, BOOK_T.curve[0], BOOK_T.curve[1]),
    light: ramp(t, BOOK_T.light[0], BOOK_T.light[1]),
    shiftX: -(CW / 2) * (1 - open),
  };
};

/** Ochilayotgan kitob. Lokal koordinatalarda chiziladi (0,0 — umurtqa). */
export const Book: React.FC<{t: number; children?: React.ReactNode}> = ({t, children}) => {
  const st = bookState(t);
  if (st.appear <= 0) return null;
  const {h, fill} = st;

  const thetaC = Math.PI * ramp(t, BOOK_T.cover[0], BOOK_T.cover[1], smoother);
  const pageThetas = new Array(N_FLIP)
    .fill(0)
    .map((_, j) =>
      Math.PI * ramp(t, BOOK_T.pages + j * BOOK_T.pageStep, BOOK_T.pages + j * BOOK_T.pageStep + BOOK_T.pageDur, smoother),
    );
  const landedPages = pageThetas.filter((th) => th >= Math.PI - 1e-6).length;
  const coverLanded = thetaC >= Math.PI - 1e-6;

  // aylanayotgan elementlar: o‘ng tomonda — muqova eng ustida; chap tomonda — oxirgi tushgani ustida
  type Flip = {kind: 'cover' | 'page'; th: number; idx: number};
  const flips: Flip[] = [];
  if (!coverLanded) flips.push({kind: 'cover', th: thetaC, idx: -1});
  pageThetas.forEach((th, j) => {
    if (th < Math.PI - 1e-6) flips.push({kind: 'page', th, idx: j});
  });
  const right = flips.filter((f) => Math.cos(f.th) >= 0);
  const left = flips.filter((f) => Math.cos(f.th) < 0);
  right.sort((a, b) => b.idx - a.idx); // oxirgi sahifa pastda, muqova (idx -1) eng ustida
  left.sort((a, b) => a.idx - b.idx); // muqova birinchi tushadi, keyingilari ustiga

  const renderFlip = (f: Flip) => {
    const c = Math.cos(f.th);
    if (f.kind === 'cover') {
      return (
        <g key={`c`} transform={`translate(0 -4) ${affine(f.th)}`}>
          {c >= 0 ? <CoverFront /> : <CoverInside />}
        </g>
      );
    }
    const shade = 0.72 + 0.28 * Math.abs(c);
    return (
      <g key={`p${f.idx}`} transform={`translate(0 ${-1 - f.idx * 0.4}) ${affine(f.th)}`}>
        <PageFlat shade={shade} />
      </g>
    );
  };

  const leftLayers = coverLanded ? Math.min(LAYERS, 2 + landedPages) : 0;

  const stack = (sign: number, layers: number) => {
    const out: React.ReactNode[] = [];
    for (let i = layers; i >= 1; i--) {
      out.push(
        <path
          key={i}
          d={sheetPath(sign, PW, PH, h, i * STEP, i * 0.5)}
          fill={i % 2 ? '#e9dcc0' : '#ddcfb0'}
          stroke="#bba77f"
          strokeWidth={0.6}
        />,
      );
    }
    out.push(
      <path key="top" d={sheetPath(sign, PW, PH, h)} fill={`url(#page-grad-${sign > 0 ? 'r' : 'l'})`} stroke="#cdb88f" strokeWidth={0.8} />,
    );
    return out;
  };

  const baseCover = (sign: number) => (
    <g>
      <path d={sheetPath(sign, CW, CH, h * 0.7, LAYERS * STEP + 4)} fill="#0f2248" stroke="#c9a45c" strokeWidth={1.6} />
    </g>
  );

  // Konturni chizish (oltin chiziq kitobga ulanadi)
  const top = -CH / 2 - 4;
  const bottom = CH / 2 - 4 + LAYERS * STEP;
  const outlineOpacity = st.appear * (1 - ramp(t, 7.7, 8.4));

  return (
    <g>
      <BookDefs />
      {/* soya */}
      <ellipse
        cx={st.shiftX + (1 - st.open) * 0 + 0}
        cy={CH / 2 + 34}
        rx={lerp(CW * 0.62, CW * 1.15, st.open)}
        ry={46}
        fill="#01040c"
        opacity={0.55 * fill}
        filter="url(#book-shadow)"
      />
      <g opacity={fill}>
        {baseCover(1)}
        {coverLanded && baseCover(-1)}
        {stack(1, LAYERS)}
        {leftLayers > 0 && stack(-1, leftLayers)}
        <g opacity={st.open}>
          <TextLines sign={1} h={h} />
          {coverLanded && landedPages === N_FLIP && <TextLines sign={-1} h={h} />}
        </g>
        {right.map(renderFlip)}
        {left.map(renderFlip)}
      </g>
      {/* sahifalar ustidagi iliq nur */}
      {st.light > 0 && (
        <g style={{mixBlendMode: 'screen'}} opacity={st.light * 0.55}>
          <path d={sheetPath(1, PW, PH, h)} fill="url(#page-glow)" />
          <path d={sheetPath(-1, PW, PH, h)} fill="url(#page-glow)" />
        </g>
      )}
      {children}
      {/* oltin kontur */}
      {outlineOpacity > 0.001 && (
        <g fill="none" stroke="#f3d596" strokeWidth={2.4} strokeLinecap="round" opacity={outlineOpacity}>
          <path
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - easeOut(st.appear)}
            d={`M 0 ${top} L 0 ${bottom} L ${CW / 2} ${bottom}`}
          />
          <path
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - easeOut(st.appear)}
            d={`M ${CW} ${top} L ${CW} ${bottom} L ${CW / 2} ${bottom}`}
          />
          <line x1={0} y1={top} x2={CW} y2={top} />
        </g>
      )}
    </g>
  );
};

/** Kitob ustidan taraluvchi yumshoq nurlar (lokal koordinatalarda). */
export const BookRays: React.FC<{t: number; intensity: number}> = ({t, intensity}) => {
  if (intensity <= 0.001) return null;
  const rays = 13;
  return (
    <g style={{mixBlendMode: 'screen'}} opacity={intensity}>
      <defs>
        <linearGradient id="ray-grad" x1="0" y1="0" x2="0" y2="-1000" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff0c8" stopOpacity={0.55} />
          <stop offset="0.35" stopColor="#f5d58f" stopOpacity={0.2} />
          <stop offset="1" stopColor="#f5d58f" stopOpacity={0} />
        </linearGradient>
        <radialGradient id="gutter-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff3d1" stopOpacity={0.9} />
          <stop offset="0.3" stopColor="#ffd98f" stopOpacity={0.4} />
          <stop offset="1" stopColor="#ffd98f" stopOpacity={0} />
        </radialGradient>
        <filter id="ray-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={9} />
        </filter>
      </defs>
      <g transform={`translate(0 ${-PH / 2 + 30})`}>
        <g filter="url(#ray-blur)">
          {new Array(rays).fill(0).map((_, i) => {
            const base = -76 + (152 * i) / (rays - 1);
            const ang = base + Math.sin(t * 0.23 + i * 1.7) * 2.2;
            const L = 820 + 260 * Math.abs(Math.sin(i * 2.3));
            const w1 = 50 + 60 * Math.abs(Math.sin(i * 1.3));
            const a = 0.45 + 0.35 * Math.sin(t * 0.5 + i * 2.1);
            return (
              <polygon
                key={i}
                transform={`rotate(${ang})`}
                points={`-7,0 7,0 ${w1},${-L} ${-w1},${-L}`}
                fill="url(#ray-grad)"
                opacity={a}
              />
            );
          })}
        </g>
        <ellipse cx={0} cy={0} rx={560} ry={260} fill="url(#gutter-glow)" opacity={0.7} />
      </g>
    </g>
  );
};

export const bookLight = (t: number) => bookState(t).light;
export {clamp01};
