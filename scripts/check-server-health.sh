#!/usr/bin/env bash
# Checks disk usage, swap pressure, and container health, alerting by email
# via SendGrid's HTTP API directly — not through the app itself, since an
# app that's down or unreachable should still be able to page someone.
#
# Usage: ./scripts/check-server-health.sh
# Cron:  */15 * * * * cd /home/deploy/AfricaHR && ./scripts/check-server-health.sh >> /home/deploy/health-check.log 2>&1
set -euo pipefail

ENV_FILE=".env.production"
STATE_DIR="${STATE_DIR:-$HOME/.server-health-state}"
ALERT_EMAIL="${ALERT_EMAIL:-btontoh1876@gmail.com}"
DISK_THRESHOLD="${DISK_THRESHOLD:-85}"     # percent used on /
SWAP_THRESHOLD="${SWAP_THRESHOLD:-50}"     # percent of swap used
ALERT_COOLDOWN_SECONDS="${ALERT_COOLDOWN_SECONDS:-14400}" # 4 hours

if [ ! -f "$ENV_FILE" ]; then
  echo "check-server-health: $ENV_FILE not found — run this from the repo root (~/AfricaHR)." >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a; . "./$ENV_FILE"; set +a

mkdir -p "$STATE_DIR"

send_alert() {
  local subject="$1" body="$2"
  if [ -z "${SENDGRID_API_KEY:-}" ] || [ -z "${SENDGRID_FROM_EMAIL:-}" ]; then
    echo "check-server-health: SendGrid not configured — would have alerted: $subject" >&2
    return 0
  fi
  curl -sS --fail -X POST https://api.sendgrid.com/v3/mail/send \
    -H "Authorization: Bearer $SENDGRID_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"personalizations\": [{\"to\": [{\"email\": \"$ALERT_EMAIL\"}]}],
      \"from\": {\"email\": \"$SENDGRID_FROM_EMAIL\"},
      \"subject\": \"$subject\",
      \"content\": [{\"type\": \"text/plain\", \"value\": \"$body\"}]
    }" >/dev/null || echo "check-server-health: failed to send alert email" >&2
}

# Alerts immediately the moment a check flips to/from "problem", but only
# re-alerts on an *ongoing* problem once per ALERT_COOLDOWN_SECONDS — so a
# disk stuck at 90% for a week doesn't spam every 15 minutes, but you still
# hear about it the instant it starts, and the instant it's fixed.
check() {
  local name="$1" is_problem="$2" message="$3"
  local state_file="$STATE_DIR/$name"
  local was_problem="ok"
  [ -f "$state_file" ] && was_problem="problem"

  if [ "$is_problem" = "true" ]; then
    if [ "$was_problem" = "ok" ]; then
      echo "check-server-health: NEW problem — $name: $message"
      send_alert "[ParotHR] $name: problem detected" "$message"
      date +%s > "$state_file"
    else
      local last_alert now elapsed
      last_alert=$(cat "$state_file")
      now=$(date +%s)
      elapsed=$((now - last_alert))
      if [ "$elapsed" -ge "$ALERT_COOLDOWN_SECONDS" ]; then
        echo "check-server-health: ongoing problem — $name: $message"
        send_alert "[ParotHR] $name: still a problem" "$message"
        date +%s > "$state_file"
      else
        echo "check-server-health: ongoing problem (cooldown) — $name: $message"
      fi
    fi
  else
    if [ "$was_problem" = "problem" ]; then
      echo "check-server-health: RECOVERED — $name"
      send_alert "[ParotHR] $name: recovered" "$name is back to normal."
      rm -f "$state_file"
    fi
  fi
}

# --- Disk usage ---
DISK_PCT=$(df --output=pcent / | tail -1 | tr -dc '0-9')
if [ "$DISK_PCT" -ge "$DISK_THRESHOLD" ]; then
  check "disk" true "Root disk is ${DISK_PCT}% full (threshold ${DISK_THRESHOLD}%)."
else
  check "disk" false ""
fi

# --- Swap usage — a better memory-pressure signal than raw "used" memory,
# since Linux uses free RAM for disk cache aggressively and that's normal. ---
SWAP_TOTAL=$(free | awk '/^Swap:/{print $2}')
SWAP_USED=$(free | awk '/^Swap:/{print $3}')
if [ "$SWAP_TOTAL" -gt 0 ]; then
  SWAP_PCT=$(( SWAP_USED * 100 / SWAP_TOTAL ))
else
  SWAP_PCT=0
fi
if [ "$SWAP_PCT" -ge "$SWAP_THRESHOLD" ]; then
  check "swap" true "Swap usage is ${SWAP_PCT}% (threshold ${SWAP_THRESHOLD}%) — the server may be under memory pressure."
else
  check "swap" false ""
fi

# --- Container health ---
for service in postgres redis api web caddy; do
  container="africahr-${service}-1"
  status=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null || echo "missing")
  if [ "$status" != "running" ]; then
    check "container-$service" true "Container $container is '$status', expected 'running'."
  else
    check "container-$service" false ""
  fi
done

echo "check-server-health: done"
