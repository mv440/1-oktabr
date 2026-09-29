# 1-oktabr — O‘qituvchi va murabbiylar kuni tabrik animatsiyasi

Muallif nomidan: **Qo‘qon shahar 23-maktab maslahatchisi Murodov Jasurbek**
G‘oya: *“Ustoz yoqqan ilm nuri kelajakni yoritadi”.*

## Tayyor videolar (`out/`)

| Fayl | Kadrlar | Davomiylik |
|---|---|---|
| `01_ustozlar_0-30.mp4` | 0–899 | 30,000 s |
| `02_ustozlar_30-60.mp4` | 900–1799 | 30,000 s |
| `03_ustozlar_toliq_60s.mp4` | 0–1799 (qismlar qayta render qilinmasdan ulangan) | 60,000 s |

Format: 1920×1080, 16:9, 30 fps, H.264 (yuv420p, BT.709) + AAC 48 kHz stereo 192 kbps.
Ikkala qism bir xil parametrlar bilan, **bitta 1800 kadrli kompozitsiyadan** render qilingan:
barcha harakat, kamera va zarrachalar global vaqtga bog‘liq, ikkinchi qismda hech narsa
noldan boshlanmaydi. Musiqa — bitta uzluksiz 60 soniyalik trek, video bilan aynan
30-soniyadan bo‘linadi (ikkinchi qismda qayta boshlanish yoki fade-in yo‘q).

## Texnologiya

Remotion 4 + React + SVG (kod bilan boshqariladigan vektor animatsiya, rasm ishlatilmagan).

```
src/
  Root.tsx              — "Ustozlar" kompozitsiyasi: 1920x1080, 30 fps, 1800 kadr
  Main.tsx              — qatlamlar: fon, naqsh, zarrachalar, dunyo (kamera), matnlar
  lib/timeline.ts       — global vaqt, easing, kamera va nur trayektoriyasi (monoton splayn)
  lib/fonts.ts          — Cormorant Garamond + Montserrat (O‘, G‘, ‘ ’ ʻ ʼ belgilari bilan)
  components/Book.tsx   — ochilayotgan kitob (2.5D muqova/varaqlar), nurlar
  components/PenInk.tsx — yozayotgan qalam, siyoh chizig‘i, belgilar (kitob, chiroq, quyosh)
  components/Light.tsx  — oltin nur chizig‘i, nur (orb) va uning izi
  components/Floral.tsx — yakuniy gul bezagi (lola, gullar, barglar)
  components/Ornament.tsx — chetlardagi girih naqshi va burchak islimiy bezaklari
  components/Particles.tsx — oltin zarrachalar (deterministik)
  components/Texts.tsx  — barcha ekrandagi matnlar
audio/build_audio.py    — original musiqa (MIDI → FluidSynth) + diktor ovozi uchun aralashtirish
audio/voice/            — ovoz matni, vaqt belgilari (cues.json), ulash yo‘riqnomasi
scripts/mux_audio.sh    — har bir qismga 60 s audio asosning aniq bo‘lagini joylash (video nusxalanadi)
scripts/concat.sh       — ikki qismni qayta render qilmasdan birlashtirish
scripts/verify.py       — format, kadrlar soni, 29–31 s ulanish (tasvir + audio) tekshiruvi
scripts/stills.mjs      — alohida kadrlarni PNG sifatida chiqarish
```

## Ishga tushirish

Talablar: Node.js 18+, Python 3 (`pip install mido numpy soundfile pyloudnorm`),
`ffmpeg`, `fluidsynth` va `fluid-soundfont-gm` (Ubuntu: `apt install ffmpeg fluidsynth fluid-soundfont-gm`).

```bash
npm install
npm run audio        # public/audio/mix.wav — 60 s audio asos
npm run studio       # brauzerda ko‘rish/tahrirlash
npm run render:1     # out/01_ustozlar_0-30.mp4   (--frames=0-899, so‘ng audio: 0–30 s)
npm run render:2     # out/02_ustozlar_30-60.mp4  (--frames=900-1799, so‘ng audio: 30–60 s)
npm run concat       # out/03_ustozlar_toliq_60s.mp4
npm run verify       # tekshiruv
# yoki hammasi birga:
npm run build
```

Oflayn muhitda Remotion brauzer yuklay olmasa: `REMOTION_BROWSER=/yo‘l/headless_shell npm run render:1`.

## Sahnalar (umumiy vaqt chizig‘i)

| Vaqt | Sahna | Ekrandagi matn |
|---|---|---|
| 00:00–00:06 | Oltin nur chizig‘i sanani ochadi, chetlarda girih naqshi | 1-oktabr · O‘qituvchi va murabbiylar kuni |
| 00:06–00:14 | Chiziq pastga tushib kitob konturiga aylanadi, kitob ochiladi, nur taraladi | Aziz ustozlar, qadrli murabbiylar! |
| 00:14–00:22 | Qalam sahifada chiziq chizadi, undan kitob, ilm chirog‘i, quyosh belgilari ko‘tariladi | Har bir sabog‘ingiz — kelajakka qo‘yilgan poydevor. |
| 00:22–00:30 | Belgilar nurga yig‘iladi, nur o‘ngga yoyiladi, kamera ergashadi (30 s da harakat davom etmoqda) | Mehringiz va sabringiz uchun rahmat! (28 s gacha chiqib ketadi) |
| 00:30–00:38 | Nur o‘sha trayektoriyada davom etib, chiziqqa yoyiladi va yozuvni ochadi | Siz yoqqan ilm nuri avlodlar yo‘lini yoritadi. |
| 00:38–00:46 | Kamera orqaga chekinadi: ochiq kitob va o‘sayotgan gul bezagi | Mustahkam sog‘lik · Oilaviy baxt · Sharafli mehnatingizga ulkan muvaffaqiyatlar! |
| 00:46–00:53 | Tantanali, sokin tabrik, oltin zarralar | Bayramingiz muborak, aziz ustozlar! |
| 00:53–01:00 | Yakuniy imzo (6 s to‘liq ko‘rinadi), oxirgi soniyada musiqa pasayadi | Hurmat va ehtirom bilan, · Qo‘qon shahar 23-maktab maslahatchisi · **Murodov Jasurbek** |

## Audio

- **Musiqa**: shu loyiha uchun yozilgan original instrumental (pianino, torli cholg‘ular,
  kontrabas, arfa; D-major, 72 BPM, 18 takt = aynan 60 s). Sintez: FluidSynth + FluidR3_GM
  soundfont (MIT litsenziyasi) — erkin foydalanish mumkin. 30-soniyada kadensiya yo‘q,
  kuy iborasi chegaradan o‘tib ketadi; faqat 59–60 s da muloyim pasayadi.
- **Diktor ovozi**: bu muhitda tekshirilgan, tabiiy o‘zbekcha erkak TTS ovozi mavjud emas edi,
  shuning uchun noto‘g‘ri talaffuzli ovoz qo‘shilmadi. Matn va vaqt belgilari:
  `audio/voice/ovoz_matni.md`, `audio/voice/cues.json`. Yozuvni qo‘yib `npm run build`
  qilinsa — ovoz musiqa ustiga avtomatik joylashadi (ducking bilan) va videolar qayta chiqadi.

## Tekshiruv natijasi

`out/tekshiruv.txt` — `npm run verify` natijasi: har bir qism 900 kadr / 30,000 s, 60 s fayl
1800 kadr / 60,000 s, parametrlar bir xil; 29–31 s oralig‘ida qora kadr, takroriy kadr,
tasvir sakrashi va audio uzilishi yo‘q; audio yagona asos bilan namunagacha mos.

Texnik izoh: Remotion AAC oqimiga kodlovchi “priming”ini (2048 namuna) edit-list bilan
belgilamaydi — natijada audio ~43 ms kechikadi va fayl 30,059 s bo‘lib qoladi. Shu sababli
`scripts/mux_audio.sh` har bir qismning audiosini yagona `mix.wav` dan aniq namunalar
bo‘yicha qayta joylaydi (video oqimi o‘zgarmaydi).

## Shriftlar

Cormorant Garamond va Montserrat (SIL Open Font License), `@fontsource` paketlaridan,
`public/fonts/` ichida lokal saqlangan — render internetga bog‘liq emas.
