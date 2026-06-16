#!/usr/bin/env bash
set -euo pipefail

# ─── NullCarbon — Soroban Contract Deployment Script ────────────────────
# Deploys all three contracts to Stellar testnet in dependency order.
# Usage: ./contracts/scripts/deploy.sh

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()   { echo -e "${GREEN}[✓]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }

# ─── 1. Load environment ──────────────────────────────────────────────
if [ -f .env ]; then
  set -o allexport
  source .env
  set +o allexport
else
  error "Root .env file not found"
  exit 1
fi

if [ -z "${DEPLOYER_SECRET_KEY:-}" ] || [ "${DEPLOYER_SECRET_KEY}" = "S..." ]; then
  error "DEPLOYER_SECRET_KEY not set in .env"
  exit 1
fi

NETWORK_ARGS="--source ${DEPLOYER_SECRET_KEY} --network testnet"
CONTRACTS_DIR="$(dirname "$0")/.."

echo "================================================"
echo "  NullCarbon — Contract Deployment"
echo "================================================"
echo "  Network: testnet"
echo "  Deployer: ${DEPLOYER_PUBLIC_KEY}"
echo ""

# ─── 2. Check stellar-cli ─────────────────────────────────────────────
if ! command -v stellar &>/dev/null; then
  error "stellar-cli not found. Install: cargo install --locked stellar-cli --features opt"
  exit 1
fi

# ─── 3. Build and optimize contracts ──────────────────────────────────
echo "--- Building contracts ---"
cd "${CONTRACTS_DIR}"

for contract in nullifier_registry credit_registry retirement_verifier; do
  echo "  Building ${contract}..."
  cargo build --target wasm32-unknown-unknown --release -p "${contract}"
done

echo "--- Optimizing WASMs ---"
for contract in nullifier_registry credit_registry retirement_verifier; do
  wasm_path="target/wasm32-unknown-unknown/release/${contract}.wasm"
  if [ -f "${wasm_path}" ]; then
    stellar contract optimize --wasm "${wasm_path}"
    log "Optimized ${contract}.wasm"
  else
    error "WASM not found: ${wasm_path}"
    exit 1
  fi
done

# ─── 4. Deploy NullifierRegistry ──────────────────────────────────────
echo ""
echo "--- Deploying NullifierRegistry ---"
NULLIFIER_REGISTRY_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/nullifier_registry.optimized.wasm \
  ${NETWORK_ARGS} 2>/dev/null)
log "NullifierRegistry deployed: ${NULLIFIER_REGISTRY_ID}"

stellar contract invoke \
  --id "${NULLIFIER_REGISTRY_ID}" \
  --fn initialize \
  --arg "${DEPLOYER_PUBLIC_KEY}" \
  ${NETWORK_ARGS} >/dev/null 2>&1
log "NullifierRegistry initialized"

# ─── 5. Deploy CreditRegistry ─────────────────────────────────────────
echo ""
echo "--- Deploying CreditRegistry ---"
CREDIT_REGISTRY_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/credit_registry.optimized.wasm \
  ${NETWORK_ARGS} 2>/dev/null)
log "CreditRegistry deployed: ${CREDIT_REGISTRY_ID}"

stellar contract invoke \
  --id "${CREDIT_REGISTRY_ID}" \
  --fn initialize \
  --arg "${DEPLOYER_PUBLIC_KEY}" \
  ${NETWORK_ARGS} >/dev/null 2>&1
log "CreditRegistry initialized"

# ─── 6. Deploy RetirementVerifier ────────────────────────────────────
echo ""
echo "--- Deploying RetirementVerifier ---"
RETIREMENT_VERIFIER_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/retirement_verifier.optimized.wasm \
  ${NETWORK_ARGS} 2>/dev/null)
log "RetirementVerifier deployed: ${RETIREMENT_VERIFIER_ID}"

# Read verification key from circuits output
VK_PATH="${CONTRACTS_DIR}/../circuits/target/retirement_vk"
if [ -f "${VK_PATH}" ]; then
  VK_BASE64=$(base64 -w0 "${VK_PATH}")
else
  warn "Verification key not found at ${VK_PATH}. Using placeholder."
  VK_BASE64="placeholder"
fi

stellar contract invoke \
  --id "${RETIREMENT_VERIFIER_ID}" \
  --fn initialize \
  --arg "${VK_BASE64}" \
  --arg "${NULLIFIER_REGISTRY_ID}" \
  --arg "${CREDIT_REGISTRY_ID}" \
  ${NETWORK_ARGS} >/dev/null 2>&1
log "RetirementVerifier initialized"

# Set verifier in CreditRegistry
stellar contract invoke \
  --id "${CREDIT_REGISTRY_ID}" \
  --fn set_verifier \
  --arg "${RETIREMENT_VERIFIER_ID}" \
  ${NETWORK_ARGS} >/dev/null 2>&1
log "CreditRegistry verifier set to RetirementVerifier"

# ─── 7. Update .env ──────────────────────────────────────────────
echo ""
echo "--- Updating .env ---"
cd "${CONTRACTS_DIR}/.."

if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s/RETIREMENT_VERIFIER_ID=C.../RETIREMENT_VERIFIER_ID=${RETIREMENT_VERIFIER_ID}/" .env
  sed -i '' "s/NULLIFIER_REGISTRY_ID=C.../NULLIFIER_REGISTRY_ID=${NULLIFIER_REGISTRY_ID}/" .env
  sed -i '' "s/CREDIT_REGISTRY_ID=C.../CREDIT_REGISTRY_ID=${CREDIT_REGISTRY_ID}/" .env
else
  sed -i "s/RETIREMENT_VERIFIER_ID=C.../RETIREMENT_VERIFIER_ID=${RETIREMENT_VERIFIER_ID}/" .env
  sed -i "s/NULLIFIER_REGISTRY_ID=C.../NULLIFIER_REGISTRY_ID=${NULLIFIER_REGISTRY_ID}/" .env
  sed -i "s/CREDIT_REGISTRY_ID=C.../CREDIT_REGISTRY_ID=${CREDIT_REGISTRY_ID}/" .env
fi

log ".env updated with contract IDs"

# ─── 8. Summary ───────────────────────────────────────────────────────
echo ""
echo "================================================"
echo -e "${GREEN}  Deployment Complete${NC}"
echo "================================================"
echo ""
echo "  NullifierRegistry:    ${NULLIFIER_REGISTRY_ID}"
echo "  CreditRegistry:       ${CREDIT_REGISTRY_ID}"
echo "  RetirementVerifier:   ${RETIREMENT_VERIFIER_ID}"
echo "  Network:              testnet"
echo ""
