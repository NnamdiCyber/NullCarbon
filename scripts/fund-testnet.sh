#!/usr/bin/env bash
set -euo pipefail

# ─── NullCarbon — Fund Testnet Account ──────────────────────────────────
# Calls Stellar Friendbot to fund the deployer account with test XLM.
# Usage: ./scripts/fund-testnet.sh

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()   { echo -e "${GREEN}[✓]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }

# Load .env from root
if [ -f .env ]; then
  set -o allexport
  source .env
  set +o allexport
else
  error ".env file not found. Copy .env.example to .env and set DEPLOYER_PUBLIC_KEY."
  exit 1
fi

if [ -z "${DEPLOYER_PUBLIC_KEY:-}" ] || [ "${DEPLOYER_PUBLIC_KEY}" = "G..." ]; then
  error "DEPLOYER_PUBLIC_KEY is not set in .env"
  exit 1
fi

echo "================================================"
echo "  Funding Stellar Testnet Account"
echo "================================================"
echo ""
echo "  Address: ${DEPLOYER_PUBLIC_KEY}"
echo ""

# Call Friendbot
FRIENDBOT_URL="https://friendbot.stellar.org?addr=${DEPLOYER_PUBLIC_KEY}"
echo "  Calling Friendbot..."
echo "  GET ${FRIENDBOT_URL}"
echo ""

FRIENDBOT_RESPONSE=$(curl -s -w "\n%{http_code}" "${FRIENDBOT_URL}")
HTTP_CODE=$(echo "${FRIENDBOT_RESPONSE}" | tail -1)
BODY=$(echo "${FRIENDBOT_RESPONSE}" | sed '$d')

if [ "${HTTP_CODE}" -eq 200 ]; then
  log "Account funded successfully!"
else
  # Check if error is because account already exists
  if echo "${BODY}" | grep -q "already exists\|ALREADY_EXISTS\|duplicate"; then
    warn "Account already funded. Checking balance..."
  else
    error "Failed to fund account. HTTP ${HTTP_CODE}"
    echo "${BODY}"
    exit 1
  fi
fi

# Check balance via Horizon
HORIZON_URL="${STELLAR_HORIZON_URL:-https://horizon-testnet.stellar.org}/accounts/${DEPLOYER_PUBLIC_KEY}"
echo ""
echo "  Checking balance..."
BALANCE_RESPONSE=$(curl -s "${HORIZON_URL}")
XLM_BALANCE=$(echo "${BALANCE_RESPONSE}" | python3 -c "import sys,json; d=json.load(sys.stdin); print([b['balance'] for b in d['balances'] if b['asset_type']=='native'][0])" 2>/dev/null || echo "unknown")

if [ "${XLM_BALANCE}" != "unknown" ]; then
  log "Balance: ${XLM_BALANCE} XLM"
else
  warn "Could not parse balance. Check manually: ${HORIZON_URL}"
fi

echo ""
echo "Done."
