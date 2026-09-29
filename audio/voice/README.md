# Diktor ovozi (keyinchalik ulash uchun)

Ushbu muhitda tabiiy o‘zbekcha talaffuzli, tekshirilgan erkak ovozi (TTS) mavjud emas edi,
shuning uchun videolar **faqat musiqa bilan** eksport qilindi — noto‘g‘ri talaffuzli yoki
boshqa tildagi ovoz qo‘shilmadi.

Diktor yozuvini ulash:

1. Matn: `ovoz_matni.md` (to‘liq matn va vaqt belgilari).
2. Har bir iborani alohida yozib, shu papkaga `v01.wav … v09.wav` nomi bilan qo‘ying
   (48 kHz, WAV). Boshlanish vaqtlari va chegaralar — `cues.json`.
   *Yoki* bitta tayyor 60 soniyalik trekni `voice_full.wav` nomi bilan qo‘ying.
3. `npm run build` — audio qayta yig‘iladi (musiqa ovoz ostida avtomatik pasaytiriladi),
   ikkala qism render qilinadi va 60 soniyalik fayl birlashtiriladi.

Muhim: 4-ibora 29,4 s dan oldin tugashi, 5-ibora 30,8 s da boshlanishi kerak —
gap 30-soniyadagi bo‘linish chegarasida kesilmaydi. Skript chegaradan oshgan iborani
ogohlantirish bilan ko‘rsatadi.
