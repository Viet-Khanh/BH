#!/bin/zsh
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$ROOT_DIR/banhang"
BACKEND_DIR="$ROOT_DIR/banhang-backend"
DIST_DIR="$FRONTEND_DIR/dist"

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

if [ -s "$HOME/.nvm/nvm.sh" ]; then
  . "$HOME/.nvm/nvm.sh"
fi

if [ ! -f "$DIST_DIR/index.html" ]; then
  (cd "$FRONTEND_DIR" && yarn build)
fi

cd "$BACKEND_DIR"
export NODE_ENV=production
yarn start
