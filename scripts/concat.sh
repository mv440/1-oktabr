#!/usr/bin/env bash
# Ikkala tayyor qismni QAYTA RENDER QILMASDAN birlashtiradi -> out/03_ustozlar_toliq_60s.mp4
#  - Video: ikkala qismning H.264 oqimi o'zgarishsiz nusxalanadi (-c:v copy).
#  - Audio: har bir qismning AAC oqimi PCM ga dekodlanadi (edit-list hisobga olinadi),
#    ketma-ket ulanadi va bitta uzluksiz AAC oqimiga kodlanadi. Shu tarzda har bir AAC
#    fayl boshidagi "priming" 30-soniyada chertki yoki uzilish hosil qilmaydi.
set -euo pipefail
cd "$(dirname "$0")/.."
FFMPEG="${FFMPEG:-ffmpeg}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
P1="$PWD/out/01_ustozlar_0-30.mp4"
P2="$PWD/out/02_ustozlar_30-60.mp4"
"$FFMPEG" -hide_banner -loglevel error -y -i "$P1" -vn -c:a pcm_f32le "$TMP/a1.wav"
"$FFMPEG" -hide_banner -loglevel error -y -i "$P2" -vn -c:a pcm_f32le "$TMP/a2.wav"
printf "file '%s'\nfile '%s'\n" "$TMP/a1.wav" "$TMP/a2.wav" > "$TMP/a.txt"
printf "file '%s'\nfile '%s'\n" "$P1" "$P2" > "$TMP/v.txt"
"$FFMPEG" -hide_banner -loglevel error -y -f concat -safe 0 -i "$TMP/a.txt" -c:a pcm_f32le "$TMP/audio.wav"
"$FFMPEG" -hide_banner -loglevel error -y -f concat -safe 0 -i "$TMP/v.txt" -i "$TMP/audio.wav" \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 \
  -movflags +faststart -shortest out/03_ustozlar_toliq_60s.mp4
echo "out/03_ustozlar_toliq_60s.mp4 tayyor"
