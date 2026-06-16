#!/usr/bin/env bash
set -euo pipefail

# ─── NullCarbon — Contract Invocation Helper ────────────────────────────
# Usage: ./contracts/scripts/invoke.sh <contract> <function> [args...]
# Examples:
#   ./contracts/scripts/invoke.sh nullifier_registry count
#   ./contracts/scripts/invoke.sh nullifier_registry is_used --arg <nullifier>

if [ $# -lt 2 ]; then
  echo "Usage: $0 <contract> <function> [args...]"
  echo ""
  echo "Contracts: nullifier_registry, credit_registry, retirement_verifier"
  echo ""
  echo "Examples:"
  echo "  $0 nullifier_registry count"
  echo "  $0 nullifier_registry is_used --arg <nullifier>"
  exit 1
fi

if [ ! -f .env ]; then
  echo "Error: .env file not found in project root"
  exit 1
fi

set -o allexport
source .env
set +o allexport

CONTRACT_NAME="$1"
shift
FUNCTION_NAME="$1"
shift

case "${CONTRACT_NAME}" in
  nullifier_registry)
    CONTRACT_ID="${NULLIFIER_REGISTRY_ID}"
    ;;
  credit_registry)
    CONTRACT_ID="${CREDIT_REGISTRY_ID}"
    ;;
  retirement_verifier)
    CONTRACT_ID="${RETIREMENT_VERIFIER_ID}"
    ;;
  *)
    echo "Error: Unknown contract '${CONTRACT_NAME}'"
    echo "Valid: nullifier_registry, credit_registry, retirement_verifier"
    exit 1
    ;;
esac

if [ -z "${CONTRACT_ID}" ] || [ "${CONTRACT_ID}" = "C..." ]; then
  echo "Error: ${CONTRACT_NAME} ID is not set in .env"
  exit 1
fi

stellar contract invoke \
  --id "${CONTRACT_ID}" \
  --fn "${FUNCTION_NAME}" \
  "$@" \
  --source "${DEPLOYER_SECRET_KEY}" \
  --network testnet
