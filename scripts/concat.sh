#!/usr/bin/env bash
# Ikkala tayyor qismni QAYTA RENDER QILMASDAN birlashtiradi -> out/03_ustozlar_toliq_60s.mp4
#  - Video: har bir qismning H.264 oqimi alohida (audiosiz) ajratiladi va concat demuxer bilan
#    o'zgarishsiz (-c copy) ulanadi: 1800 kadr, bir tekis 1/30 s vaqt belgilari.
#  - Audio: har bir qismning AAC oqimi PCM ga dekodlanadi va aynan 1 440 000 namunaga
#    (30.000 s) kesiladi, ketma-ket ulanadi va bitta uzluksiz AAC oqimiga kodlanadi.
#    Shu tarzda AAC "priming"/to'ldirish 30-soniyada chertki yoki uzilish hosil qilmaydi.
set -euo pipefail
cd "$(dirname "$0")/.."
FFMPEG="${FFMPEG:-ffmpeg}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
P1="$PWD/out/01_ustozlar_0-30.mp4"
P2="$PWD/out/02_ustozlar_30-60.mp4"
i=0
for src in "$P1" "$P2"; do
  i=$((i + 1))
  "$FFMPEG" -hide_banner -loglevel error -y -i "$src" -map 0:v:0 -c copy "$TMP/v$i.mp4"
  "$FFMPEG" -hide_banner -loglevel error -y -i "$src" -vn -af "atrim=end_sample=1440000" -c:a pcm_f32le "$TMP/a$i.wav"
  printf "file '%s'\n" "$TMP/v$i.mp4" >> "$TMP/v.txt"
  printf "file '%s'\n" "$TMP/a$i.wav" >> "$TMP/a.txt"
done
"$FFMPEG" -hide_banner -loglevel error -y -f concat -safe 0 -i "$TMP/v.txt" -c copy "$TMP/video.mp4"
"$FFMPEG" -hide_banner -loglevel error -y -f concat -safe 0 -i "$TMP/a.txt" -c:a pcm_f32le "$TMP/audio.wav"
"$FFMPEG" -hide_banner -loglevel error -y -i "$TMP/video.mp4" -i "$TMP/audio.wav" \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 \
  -movflags +faststart out/03_ustozlar_toliq_60s.mp4
echo "out/03_ustozlar_toliq_60s.mp4 tayyor"
