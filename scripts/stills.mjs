// Tekshiruv uchun alohida kadrlarni PNG sifatida chiqaradi: node scripts/stills.mjs 0 90 300 ...
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const frames = process.argv.slice(2).map(Number);
const outDir = process.env.STILLS_DIR || 'out/stills';
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browserExecutable = process.env.REMOTION_BROWSER || null;
const composition = await selectComposition({serveUrl, id: 'Ustozlar', browserExecutable});
for (const f of frames) {
  const output = path.join(outDir, `f${String(f).padStart(4, '0')}.png`);
  await renderStill({composition, serveUrl, frame: f, output, browserExecutable, imageFormat: 'png'});
  console.log('wrote', output);
}
