#!/bin/zsh
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"
BACKUP_KEEP="${BACKUP_KEEP:-30}"
MONGO_DB="${MONGO_DB:-banhang}"

if ! [[ "$BACKUP_KEEP" =~ '^[0-9]+$' ]]; then
  echo "BACKUP_KEEP must be a number" >&2
  exit 1
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose)
else
  echo "docker compose not found" >&2
  exit 1
fi

CONTAINER_ID="$("${COMPOSE_CMD[@]}" ps -q mongo)"
if [ -z "$CONTAINER_ID" ]; then
  echo "Mongo container not running" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

STAMP="$(date +"%Y%m%d-%H%M%S")"
BACKUP_NAME="banhang-$STAMP.archive.gz"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
TMP_FILE="/tmp/banhang.archive.gz"

"${COMPOSE_CMD[@]}" exec -T mongo mongodump --db "$MONGO_DB" --archive="$TMP_FILE" --gzip
docker cp "$CONTAINER_ID:$TMP_FILE" "$BACKUP_PATH"
"${COMPOSE_CMD[@]}" exec -T mongo rm -f "$TMP_FILE"

if [ "$BACKUP_KEEP" -gt 0 ]; then
  LIST="$(ls -1t "$BACKUP_DIR"/banhang-*.archive.gz 2>/dev/null || true)"
  if [ -n "$LIST" ]; then
    echo "$LIST" | tail -n +"$((BACKUP_KEEP+1))" | xargs -r rm -f
  fi
fi

echo "Backup saved to $BACKUP_PATH"
