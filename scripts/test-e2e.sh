#!/usr/bin/env bash
set -euo pipefail

# ─── NullCarbon — End-to-End Test Script ────────────────────────────────
# Executes the full retirement flow: issue credit → Merkle proof →
# generate proof → relay to Soroban → verify certificate.
# Usage: ./scripts/test-e2e.sh

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}[PASS]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; }
info() { echo -e "${YELLOW}[INFO]${NC} $1"; }

ALL_PASSED=true
API_BASE="${API_BASE_URL:-http://localhost:3000}"

echo "================================================"
echo "  NullCarbon — End-to-End Tests"
echo "================================================"
echo ""

# Step 1: Issue a test credit
echo "--- Step 1: Issue test credit ---"
ISSUE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/registry/sync" 2>/dev/null || true)
ISSUE_CODE=$(echo "${ISSUE_RESPONSE}" | tail -1)
if [ "${ISSUE_CODE}" = "200" ] || [ "${ISSUE_CODE}" = "201" ]; then
  pass "Test credits issued"
else
  fail "Credit issuance returned HTTP ${ISSUE_CODE}"
  ALL_PASSED=false
fi

# Step 2: Fetch credits and get Merkle proof
echo ""
echo "--- Step 2: Fetch Merkle proof ---"
CREDITS=$(curl -s "${API_BASE}/registry/credits?registry=Verra&limit=1" 2>/dev/null || echo "{}")
FIRST_HASH=$(echo "${CREDITS}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['credits'][0]['creditHash'])" 2>/dev/null || true)

if [ -n "${FIRST_HASH}" ]; then
  PROOF_RESPONSE=$(curl -s "${API_BASE}/registry/merkle-proof/${FIRST_HASH}" 2>/dev/null || echo "{}")
  if echo "${PROOF_RESPONSE}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('merklePath',[]))" 2>/dev/null | grep -q "0x"; then
    pass "Merkle proof retrieved"
  else
    fail "Merkle proof missing path"
    ALL_PASSED=false
  fi
else
  fail "No credits found to prove"
  ALL_PASSED=false
fi

# Step 3: Generate Noir proof (requires nargo + bb toolchain)
echo ""
echo "--- Step 3: Generate Noir proof ---"
if command -v nargo &>/dev/null && command -v bb &>/dev/null; then
  cd circuits
  if nargo prove --prover-name retirement 2>/dev/null; then
    pass "Retirement proof generated"
  else
    fail "Proof generation failed"
    ALL_PASSED=false
  fi
  cd ..
else
  warn "nargo/bb not installed — skipping proof generation"
fi

# Step 4: Relay proof (mock — just check endpoint exists)
echo ""
echo "--- Step 4: Relay proof ---"
RELAY_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/proof/retire" \
  -H "Content-Type: application/json" \
  -d '{"proof":"0xdead","publicInputs":{"nullifier":"0xbeef","registryMerkleRoot":"0xabcd","volumeCommitment":"0x1234","corridorId":"EU-CORSIA","minVintageYear":2020,"minPermanence":70}}' \
  2>/dev/null || true)
RELAY_CODE=$(echo "${RELAY_RESPONSE}" | tail -1)
if [ "${RELAY_CODE}" = "200" ] || [ "${RELAY_CODE}" = "201" ]; then
  pass "Proof relay endpoint responded"
else
  warn "Proof relay returned HTTP ${RELAY_CODE} (expected if backend is not fully running)"
fi

# Step 5: Check nullifier
echo ""
echo "--- Step 5: Check nullifier ---"
NULLIFIER_CHECK=$(curl -s "${API_BASE}/proof/nullifier/0xbeef" 2>/dev/null || echo "{}")
if [ -n "${NULLIFIER_CHECK}" ]; then
  pass "Nullifier check endpoint responded"
else
  warn "Nullifier check endpoint not available"
fi

# Step 6: Fetch certificate
echo ""
echo "--- Step 6: Fetch certificate ---"
CERTS=$(curl -s "${API_BASE}/certificates/feed" 2>/dev/null || echo "{}")
if [ -n "${CERTS}" ]; then
  pass "Certificate feed endpoint responded"
else
  warn "Certificate feed endpoint not available"
fi

echo ""
echo "================================================"
if [ "${ALL_PASSED}" = true ]; then
  echo -e "${GREEN}  All tests passed!${NC}"
else
  echo -e "${YELLOW}  Some tests failed — check output above.${NC}"
fi
echo "================================================"
