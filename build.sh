#!/bin/sh
# Builds index.html from the sources in src/ (head.html = styles + markup, theory.js = music engine, ui.js = the app)
set -e
cd "$(dirname "$0")"
{
  printf '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif}img{max-width:100%%}[hidden]{display:none!important}</style>\n</head>\n<body>\n'
  cat src/head.html
  printf '<script>\n'
  cat src/theory.js
  cat src/ui.js
  printf '</script>\n</body>\n</html>\n'
} > index.html
echo "built index.html"
