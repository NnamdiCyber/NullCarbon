#!/usr/bin/env bash
set -euo pipefail

# ─── NullCarbon — Environment Setup Script ───────────────────────────────
# Installs all prerequisites and dependencies for the NullCarbon monorepo.
# Usage: ./scripts/setup.sh

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()   { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; }

echo "================================================"
echo "  NullCarbon — Environment Setup"
echo "================================================"
echo ""

# ─── 1. Check Node.js ─────────────────────────────────────────────────
echo "--- Checking Node.js ---"
if command -v node &>/dev/null; then
  NODE_VER=$(node --version)
  log "Node.js ${NODE_VER} found"
else
  error "Node.js not found. Install Node.js 20+ from https://nodejs.org"
  exit 1
fi

# ─── 2. Check Rust + wasm32 target ────────────────────────────────────
echo "--- Checking Rust ---"
if command -v rustup &>/dev/null; then
  log "rustup found"
  rustup target add wasm32-unknown-unknown 2>/dev/null
  log "wasm32-unknown-unknown target added"
else
  error "rustup not found. Install from https://rustup.rs"
  exit 1
fi

# ─── 3. Check Stellar CLI ─────────────────────────────────────────────
echo "--- Checking Stellar CLI ---"
if command -v stellar &>/dev/null; then
  STELLAR_VER=$(stellar --version 2>/dev/null | head -1)
  log "Stellar CLI: ${STELLAR_VER}"
else
  warn "stellar-cli not found. Install with: cargo install --locked stellar-cli --features opt"
fi

# ─── 4. Check Noir toolchain ──────────────────────────────────────────
echo "--- Checking Noir toolchain ---"
if command -v nargo &>/dev/null; then
  NARGO_VER=$(nargo --version 2>/dev/null | head -1)
  log "nargo: ${NARGO_VER}"
else
  warn "nargo not found. Install with: curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash && noirup"
fi

# ─── 5. Check Barretenberg CLI ────────────────────────────────────────
echo "--- Checking Barretenberg CLI ---"
if command -v bb &>/dev/null; then
  BB_VER=$(bb --version 2>/dev/null | head -1)
  log "bb: ${BB_VER}"
else
  warn "bb not found. Install with: curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/master/barretenberg/bbup/install | bash && bbup"
fi

# ─── 6. Install npm dependencies ──────────────────────────────────────
echo "--- Installing npm dependencies ---"

if [ -f backend/package.json ]; then
  cd backend && npm install && cd ..
  log "backend dependencies installed"
fi

if [ -f frontend/package.json ]; then
  cd frontend && npm install && cd ..
  log "frontend dependencies installed"
fi

if [ -f indexer/package.json ]; then
  cd indexer && npm install && cd ..
  log "indexer dependencies installed"
fi

# ─── 7. Build contracts ───────────────────────────────────────────────
echo "--- Building Soroban contracts ---"
if [ -f contracts/Cargo.toml ]; then
  cd contracts && cargo build --target wasm32-unknown-unknown --release 2>/dev/null && cd ..
  log "contracts built"
fi

# ─── 8. Compile circuits ──────────────────────────────────────────────
echo "--- Compiling Noir circuits ---"
if [ -f circuits/Nargo.toml ]; then
  cd circuits && nargo compile 2>/dev/null && cd ..
  log "circuits compiled"
fi

echo ""
echo "================================================"
echo -e "${GREEN}  NullCarbon setup complete!${NC}"
echo "================================================"
echo ""
echo "Next steps:"
echo "  1. Copy .env.example to .env and fill in values"
echo "  2. Start PostgreSQL: docker compose up -d"
echo "  3. Fund deployer:    ./scripts/fund-testnet.sh"
echo "  4. Build Merkle tree: ./scripts/build-merkle.sh"
echo "  5. Run e2e tests:    ./scripts/test-e2e.sh"
echo ""
