#!/bin/zsh
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"
BACKUP_KEEP="${BACKUP_KEEP:-3}"
BACKUP_INTERVAL_DAYS="${BACKUP_INTERVAL_DAYS:-3}"
MONGO_DB="${MONGO_DB:-banhang}"

if ! [[ "$BACKUP_KEEP" =~ '^[0-9]+$' ]]; then
  echo "BACKUP_KEEP must be a number" >&2
  exit 1
fi
if ! [[ "$BACKUP_INTERVAL_DAYS" =~ '^[0-9]+$' ]]; then
  echo "BACKUP_INTERVAL_DAYS must be a number" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

get_mtime() {
  local file="$1"
  local mtime=""

  mtime="$(stat -f "%m" "$file" 2>/dev/null || true)"
  if [ -n "$mtime" ]; then
    echo "$mtime"
    return
  fi

  mtime="$(stat -c "%Y" "$file" 2>/dev/null || true)"
  if [ -n "$mtime" ]; then
    echo "$mtime"
  fi
}

should_run() {
  if [ "$BACKUP_INTERVAL_DAYS" -le 0 ]; then
    return 0
  fi

  local latest=""
  latest="$(ls -1t "$BACKUP_DIR"/banhang-*.archive.gz 2>/dev/null | head -n 1 || true)"
  if [ -z "$latest" ]; then
    return 0
  fi

  local last_mtime=""
  last_mtime="$(get_mtime "$latest")"
  if [ -z "$last_mtime" ]; then
    return 0
  fi

  local now
  now="$(date +%s)"
  local interval
  interval="$((BACKUP_INTERVAL_DAYS * 86400))"

  if [ $((now - last_mtime)) -ge "$interval" ]; then
    return 0
  fi

  return 1
}

if ! should_run; then
  echo "Skip backup: last backup is within ${BACKUP_INTERVAL_DAYS} day(s)."
  exit 0
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
