#!/usr/bin/env bash
#
# LAN URL hints and optional public tunnel (Cloudflare quick tunnel).
#
# Source for the hint function:
#   source "$REPO_ROOT/scripts/external-access.sh"
#   deerflow_print_access_hints 2026
#
# Public HTTPS URL (requires cloudflared; DeerFlow must already be running):
#   ./scripts/external-access.sh tunnel
#   TUNNEL_PORT=2026 ./scripts/external-access.sh tunnel

deerflow_print_access_hints() {
  local port="${1:-2026}"
  echo ""
  echo "  ── External / LAN access ──"
  echo "  This machine:  http://localhost:${port}"
  local ip=""
  if command -v hostname >/dev/null 2>&1; then
    ip=$(hostname -I 2>/dev/null | awk '{print $1}')
  fi
  if [ -z "$ip" ] || [ "$ip" = "127.0.0.1" ]; then
    if command -v ip >/dev/null 2>&1; then
      ip=$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for (i = 1; i <= NF; i++) if ($i == "src") { print $(i + 1); exit }}')
    fi
  fi
  if [ -n "$ip" ] && [ "$ip" != "127.0.0.1" ]; then
    echo "  Same LAN:       http://${ip}:${port}  (open port ${port}/tcp in the firewall if needed)"
  fi
  echo "  Temporary public HTTPS:  make tunnel  (install cloudflared; not for production)"
  echo ""
}

case "${1:-}" in
tunnel)
  set -e
  PORT="${TUNNEL_PORT:-2026}"
  export PATH="${HOME}/.local/bin:${PATH}"
  if ! command -v cloudflared >/dev/null 2>&1; then
    echo "cloudflared not found."
    echo "  Official: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
    echo "  If github.com is slow, mirror download to ~/.local/bin:"
    echo "    mkdir -p ~/.local/bin && curl -fL -o ~/.local/bin/cloudflared \\"
    echo "      'https://ghfast.top/https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64' \\"
    echo "      && chmod +x ~/.local/bin/cloudflared"
    exit 1
  fi
  echo "Exposing http://127.0.0.1:${PORT} via a temporary Cloudflare URL (Ctrl+C to stop)."
  echo "Ensure DeerFlow is already running (make dev, make dev-daemon, or Docker)."
  exec cloudflared tunnel --url "http://127.0.0.1:${PORT}"
  ;;
esac
