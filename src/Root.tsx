import React from 'react';
import {Composition} from 'remotion';
import {Main} from './Main';
import {FPS, HEIGHT, TOTAL_FRAMES, WIDTH} from './lib/timeline';

// Bitta 1800 kadrli (60 s) kompozitsiya. Qismlar --frames=0-899 va --frames=900-1799 bilan render qilinadi.
export const Root: React.FC = () => (
  <Composition id="Ustozlar" component={Main} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
);
