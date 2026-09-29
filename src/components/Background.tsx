import React from 'react';
import {Cam, CX, CY, HEIGHT, WIDTH, camTransform, clamp01} from '../lib/timeline';

export const COLORS = {
  navyDeep: '#050d1f',
  navy: '#0b1a36',
  navyMid: '#12284f',
  navyLight: '#1d3a6b',
  ivory: '#f7efdf',
  warmWhite: '#fff8ea',
  gold: '#d8b36a',
  goldLight: '#f1d9a0',
  goldDeep: '#a9813f',
};

/** Butun ekranni egallovchi fon: chuqur ko‘k gradient + iliq markaziy yorug‘lik. */
export const Backdrop: React.FC<{cam: Cam; warmth: number; glowX: number; glowY: number}> = ({
  cam,
  warmth,
  glowX,
  glowY,
}) => {
  // Fon juda sekin parallax bilan siljiydi.
  const bx = CX - (cam.x - CX) * 0.05;
  const by = CY - (cam.y - CY) * 0.05;
  return (
    <g>
      <defs>
        <radialGradient id="bg-base" cx={bx} cy={by} r={1250} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#173462" />
          <stop offset="0.45" stopColor="#0f2447" />
          <stop offset="1" stopColor={COLORS.navyDeep} />
        </radialGradient>
        <radialGradient id="bg-warm" cx={glowX} cy={glowY} r={760} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f3c979" stopOpacity={0.22} />
          <stop offset="0.35" stopColor="#c89449" stopOpacity={0.09} />
          <stop offset="1" stopColor="#c89449" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={WIDTH} height={HEIGHT} fill="url(#bg-base)" />
      <rect width={WIDTH} height={HEIGHT} fill="url(#bg-warm)" opacity={clamp01(warmth)} />
    </g>
  );
};

/** Chekkalarni qoraytiruvchi vinyetka. */
export const Vignette: React.FC = () => (
  <g>
    <defs>
      <radialGradient id="vignette" cx={CX} cy={CY} r={1150} gradientUnits="userSpaceOnUse">
        <stop offset="0.5" stopColor="#020610" stopOpacity={0} />
        <stop offset="0.85" stopColor="#020610" stopOpacity={0.42} />
        <stop offset="1" stopColor="#020610" stopOpacity={0.7} />
      </radialGradient>
    </defs>
    <rect width={WIDTH} height={HEIGHT} fill="url(#vignette)" />
  </g>
);

/** Juda nozik statik don — to‘q gradientlarda “banding”ni kamaytiradi. */
export const Grain: React.FC = () => (
  <g style={{mixBlendMode: 'soft-light'}} opacity={0.22}>
    <defs>
      <filter id="grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={7} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
    </defs>
    <rect width={WIDTH} height={HEIGHT} filter="url(#grain)" />
  </g>
);

/** Parallax qatlami uchun yordamchi. */
export const Layer: React.FC<{cam: Cam; depth?: number; children: React.ReactNode}> = ({
  cam,
  depth = 1,
  children,
}) => <g transform={camTransform(cam, depth)}>{children}</g>;
