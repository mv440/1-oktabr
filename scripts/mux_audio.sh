#!/usr/bin/env bash
# Har bir qismga yagona 60 s audio asosning aniq bo'lagini joylaydi (video qayta render qilinmaydi,
# H.264 oqimi o'zgarishsiz nusxalanadi):
#   1-qism: mix.wav [0 .. 1 440 000) namuna = 0.000–30.000 s
#   2-qism: mix.wav [1 440 000 .. 2 880 000) namuna = 30.000–60.000 s
# ffmpeg AAC kodlovchisi "priming"ni edit-list orqali belgilaydi — audio videoga aniq mos,
# har bir fayl aynan 30.000 s, 30-soniyada ulanish joyida uzilish yoki takror bo'lmaydi.
set -euo pipefail
cd "$(dirname "$0")/.."
FFMPEG="${FFMPEG:-ffmpeg}"
mux() { # $1 video, $2 start_sample, $3 end_sample
  local tmp="${1%.mp4}.tmp.mp4"
  "$FFMPEG" -hide_banner -loglevel error -y -i "$1" -i public/audio/mix.wav \
    -filter_complex "[1:a]atrim=start_sample=$2:end_sample=$3,asetpts=PTS-STARTPTS[a]" \
    -map 0:v:0 -map "[a]" -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart "$tmp"
  mv "$tmp" "$1"
  echo "$1: audio $2..$3"
}
PART="${1:-all}"
if [[ "$PART" == 1 || "$PART" == all ]]; then mux out/01_ustozlar_0-30.mp4 0 1440000; fi
if [[ "$PART" == 2 || "$PART" == all ]]; then mux out/02_ustozlar_30-60.mp4 1440000 2880000; fi
