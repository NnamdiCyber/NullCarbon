# NullCarbon — Soroban Smart Contracts

Three composable contracts forming the on-chain retirement integrity layer.

## Contracts

### NullifierRegistry
Tamper-proof double-retirement prevention. Nullifiers written here can never be removed.

| Function | Description |
|---|---|
| `initialize(verifier)` | Set authorized verifier. One-time. |
| `record(nullifier, caller)` | Record nullifier. Returns false if already used. Caller must be verifier. |
| `is_used(nullifier)` | Check if nullifier has been used. |
| `count()` | Total recorded nullifiers. |
| `get_authorized_verifier()` | Returns the verifier address. |

### CreditRegistry
Lifecycle management for tokenized carbon credits.

| Function | Description |
|---|---|
| `initialize(admin)` | Set admin. One-time. |
| `issue_credit(to, hash, registry_id, vintage, methodology, permanence, volume)` | Mint credit token. Admin only. |
| `transfer_credit(token_id, from, to)` | Transfer ownership. Requires `from` auth. |
| `burn_on_retirement(token_id, owner, nullifier)` | Burn on verified retirement. Verifier only. |
| `get_credit(token_id)` | Read credit metadata. |
| `is_retired(token_id)` | Check retirement status. |
| `set_verifier(verifier)` | Set authorized verifier. Admin only. |

### RetirementVerifier
Core proof checker. Uses BN254 host functions (Protocol 25/26) to verify Noir UltraHonk proofs.

| Function | Description |
|---|---|
| `initialize(vk, nullifier_registry, credit_registry)` | Store VK and contract addresses. One-time. |
| `verify_retirement(proof, public_inputs, token_id, owner)` | Verify proof, record nullifier, burn token. |
| `get_retirement(nullifier)` | Retrieve retirement record. |
| `get_vk()` | Return stored verification key. |
| `set_test_mode(enabled)` | Bypass BN254 for integration tests. |

## Public Inputs Layout

```
[0..32]    nullifier         (BytesN<32>)
[32..64]   registry_root     (BytesN<32>)
[64..96]   volume_commitment (BytesN<32>)
[96..128]  corridor_id       (BytesN<32>)
[128..132] min_vintage_year  (u32 big-endian)
[132..136] min_permanence    (u32 big-endian)
```

## Build & Test

```bash
cd contracts

# Run all tests
cargo test

# Build for deployment
cargo build --target wasm32-unknown-unknown --release
```

## Deploy Order

1. NullifierRegistry → capture ID
2. CreditRegistry → capture ID
3. RetirementVerifier with both IDs + VK → capture ID
4. `CreditRegistry.set_verifier(RetirementVerifier ID)`
5. `NullifierRegistry.initialize(RetirementVerifier ID)`
