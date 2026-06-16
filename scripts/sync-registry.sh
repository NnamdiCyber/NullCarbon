#!/usr/bin/env bash
set -euo pipefail

# ─── NullCarbon — Sync Registry Data ────────────────────────────────────
# Pulls carbon credit data from Verra and Gold Standard APIs via the backend.
# Usage: ./scripts/sync-registry.sh

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()   { echo -e "${GREEN}[✓]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }

API_BASE="${API_BASE_URL:-http://localhost:3000}"

echo "================================================"
echo "  NullCarbon — Registry Sync"
echo "================================================"
echo ""

# Sync Verra
echo "--- Syncing Verra ---"
VERRA_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/registry/sync" \
  -H "Content-Type: application/json" \
  -d '{"registry":"Verra"}' 2>/dev/null || true)
VERRA_CODE=$(echo "${VERRA_RESPONSE}" | tail -1)
if [ "${VERRA_CODE}" = "200" ] || [ "${VERRA_CODE}" = "201" ]; then
  log "Verra credits synced"
else
  warn "Verra sync returned HTTP ${VERRA_CODE}"
fi

# Sync Gold Standard
echo ""
echo "--- Syncing Gold Standard ---"
GS_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/registry/sync" \
  -H "Content-Type: application/json" \
  -d '{"registry":"GoldStandard"}' 2>/dev/null || true)
GS_CODE=$(echo "${GS_RESPONSE}" | tail -1)
if [ "${GS_CODE}" = "200" ] || [ "${GS_CODE}" = "201" ]; then
  log "Gold Standard credits synced"
else
  warn "Gold Standard sync returned HTTP ${GS_CODE}"
fi

echo ""
echo "Done."
