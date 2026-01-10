#!/bin/zsh
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/banhang-backend"
START_SCRIPT="$ROOT_DIR/start-backend.command"

if [ ! -f "$START_SCRIPT" ]; then
  echo "Missing $START_SCRIPT" >&2
  exit 1
fi

if [ -f "$BACKEND_DIR/.env" ]; then
  PORT_LINE="$(grep -E '^PORT=' "$BACKEND_DIR/.env" | tail -n 1)"
  if [ -n "$PORT_LINE" ]; then
    PORT="${PORT_LINE#PORT=}"
  fi
fi
PORT="${PORT:-5000}"
URL="http://localhost:$PORT"

is_running() {
  curl -fsS "$URL/api/health" >/dev/null 2>&1
}

LAUNCH_AGENT_DIR="$HOME/Library/LaunchAgents"
LOG_DIR="$HOME/Library/Logs"
PLIST_PATH="$LAUNCH_AGENT_DIR/com.rostek.banhang.plist"

mkdir -p "$LAUNCH_AGENT_DIR" "$LOG_DIR"
chmod +x "$START_SCRIPT"

cat > "$PLIST_PATH" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.rostek.banhang</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>$START_SCRIPT</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>$LOG_DIR/banhang-backend.log</string>
  <key>StandardErrorPath</key>
  <string>$LOG_DIR/banhang-backend.error.log</string>
</dict>
</plist>
PLIST

if ! is_running; then
  USER_ID="$(id -u)"
  if launchctl list | grep -q "com.rostek.banhang"; then
    launchctl kickstart -k "gui/$USER_ID/com.rostek.banhang"
  else
    launchctl bootstrap "gui/$USER_ID" "$PLIST_PATH"
  fi

  for i in {1..20}; do
    if is_running; then
      break
    fi
    sleep 1
  done
fi

open "$URL"
