import React from 'react';
import {Composition} from 'remotion';
import {Main} from './Main';
import {Montaj, MONTAJ_FRAMES} from './montaj/Montaj';
import {MontajReels, ReelsCover} from './montaj/ReelsText';
import {PHOTO_FILE} from './lib/photo';
import {FPS, HEIGHT, TOTAL_FRAMES, WIDTH} from './lib/timeline';

// Bitta 1800 kadrli (60 s) kompozitsiya. Qismlar --frames=0-899 va --frames=900-1799 bilan render qilinadi.
export const Root: React.FC = () => (
  <Composition
    id="Ustozlar"
    component={Main}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
    defaultProps={{photo: PHOTO_FILE}}
  />
);

export const RootAll: React.FC = () => (
  <>
    <Root />
    <Composition id="Montaj" component={Montaj} durationInFrames={MONTAJ_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="MontajReels" component={MontajReels} durationInFrames={MONTAJ_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="ReelsCover" component={ReelsCover} durationInFrames={1} fps={30} width={1080} height={1920} />
  </>
);
