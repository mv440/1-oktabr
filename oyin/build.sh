#!/usr/bin/env bash
# oyin/mosh.html (artifact manbasi) -> to'liq HTML: out/08_gapdon_mosh.html va docs/index.html (GitHub Pages)
set -e
cd "$(dirname "$0")/.."
mkdir -p docs out
{ printf '<!doctype html><html lang="uz"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>*{box-sizing:border-box}body{margin:0;font:14px system-ui}img{max-width:100%%}[hidden]{display:none!important}:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}</style></head><body>'
  cat oyin/mosh.html; printf '</body></html>\n'; } > out/08_gapdon_mosh.html
cp out/08_gapdon_mosh.html docs/index.html
touch docs/.nojekyll
echo "ok: out/08_gapdon_mosh.html, docs/index.html"
