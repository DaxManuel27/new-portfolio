#!/bin/zsh
set -e
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
cd "${0:A:h}/web"
if /usr/bin/curl --silent --max-time 2 http://127.0.0.1:5173/ | /usr/bin/grep -q 'Dax Manuel'; then
  /usr/bin/open 'http://127.0.0.1:5173/'
  exit 0
fi
if ! command -v npm >/dev/null; then
  echo 'Node.js is needed to run this preview. Install Node.js, then open this file again.'
  read '?Press Return to close.'
  exit 1
fi
if [[ ! -d node_modules ]]; then npm ci; fi
echo 'Portfolio preview: http://127.0.0.1:5173/'
echo 'Keep this window open. Press Control-C here to stop the preview.'
exec npm run dev -- --open
