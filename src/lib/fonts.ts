import {continueRender, delayRender, staticFile} from 'remotion';

// O‘zbek lotin yozuvi uchun: lotin to‘plami U+2018 (‘), U+2019 (’), U+02BB (ʻ), U+02BC (ʼ)
// va U+2014 (—) belgilarini o‘z ichiga oladi.
export const SERIF = '"Cormorant Garamond", Georgia, serif';
export const SANS = '"Montserrat", "Helvetica Neue", Arial, sans-serif';

const faces: [string, string, string, string][] = [
  ['Cormorant Garamond', 'cormorant-garamond-latin-500-normal.woff2', '500', 'normal'],
  ['Cormorant Garamond', 'cormorant-garamond-latin-600-normal.woff2', '600', 'normal'],
  ['Cormorant Garamond', 'cormorant-garamond-latin-700-normal.woff2', '700', 'normal'],
  ['Cormorant Garamond', 'cormorant-garamond-latin-500-italic.woff2', '500', 'italic'],
  ['Cormorant Garamond', 'cormorant-garamond-latin-600-italic.woff2', '600', 'italic'],
  ['Montserrat', 'montserrat-latin-400-normal.woff2', '400', 'normal'],
  ['Montserrat', 'montserrat-latin-500-normal.woff2', '500', 'normal'],
  ['Montserrat', 'montserrat-latin-600-normal.woff2', '600', 'normal'],
];

let loaded = false;
export const loadFonts = () => {
  if (loaded || typeof document === 'undefined') return;
  loaded = true;
  const handle = delayRender('Shriftlar yuklanmoqda');
  Promise.all(
    faces.map(([family, file, weight, style]) => {
      const face = new FontFace(family, `url(${staticFile(`fonts/${file}`)}) format("woff2")`, {
        weight,
        style,
      });
      return face.load().then((f) => document.fonts.add(f));
    }),
  )
    .then(() => continueRender(handle))
    .catch((e) => {
      console.error(e);
      continueRender(handle);
    });
};
