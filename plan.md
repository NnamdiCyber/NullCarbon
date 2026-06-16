# NullCarbon — 5-Day Intensive Development Plan

> **Target:** 65% completion — a robust, running foundation that contributors can build on directly.
> **Stack:** Noir (Barretenberg) · Soroban (Rust) · NestJS · Angular · PostgreSQL · Stellar Testnet

---

## Completion Map

| Layer | Day Completed | Target % |
|---|---|---|
| Repo scaffold & toolchain | Day 1 | 100% |
| Noir circuits (all 3) | Day 2 | 100% |
| Soroban contracts (all 3) | Day 3 | 100% |
| NestJS backend | Day 4 | 70% |
| Angular frontend | Day 5 | 50% |
| Indexer | Day 4 | 40% |
| End-to-end testnet flow | Day 5 | 60% |
| **Overall** | **Day 5** | **~65%** |

---

## What 65% Looks Like

By end of Day 5, NullCarbon will have:

- A fully compiled and tested Noir circuit suite (`retirement_proof`, `compliance_proof`, `vintage_proof`)
- Three deployed Soroban contracts on Stellar testnet (`RetirementVerifier`, `NullifierRegistry`, `CreditRegistry`)
- A running NestJS backend with registry sync, Merkle tree builder, proof relay, nullifier tracking, and certificate indexing
- An Angular frontend with wallet connection, credit portfolio view, and the retirement proof generation flow wired up
- A working end-to-end path: credit import → proof generation → on-chain verification → certificate emission — all on testnet
- A public audit endpoint that anyone can query

What is NOT done at 65%:
- The compliance proof frontend screen (net-zero claim generation UI)
- The full audit portal UI
- Live Verra/Gold Standard API keys (mock data only)
- Mobile proof optimization
- Contract audit

These are the clear contribution targets left for open-source contributors.

---

## Day 1 — Repo Scaffold, Toolchain & Project Foundation

**Goal:** Every contributor can clone, install, and run the repo with zero friction. All tooling works. All environment configs are documented. The project structure from the README is fully in place.

**Deliverables:**
- Monorepo initialized with all directories from the README structure
- `nargo`, `bb`, `stellar-cli`, `rustup wasm32` all verified working
- `docker-compose.yml` running PostgreSQL locally
- `.env.example` files for root, backend, and frontend
- `scripts/setup.sh` that installs all dependencies in one command
- `scripts/fund-testnet.sh` that funds a Stellar testnet account via Friendbot
- `Nargo.toml` for the circuits workspace
- `Cargo.toml` workspaces for all three Soroban contracts
- Backend: NestJS project bootstrapped with all modules stubbed (registry, merkle, proof, certificate, nullifier, compliance)
- Frontend: Angular 17 project scaffolded with standalone components, routing configured, Tailwind set up
- Indexer: NestJS project bootstrapped
- `README.md` and `PLAN.md` committed at root
- CI: GitHub Actions workflow that runs `nargo compile`, `cargo build`, `npm test` on push

**End-of-day check:** `./scripts/setup.sh` runs cleanly on a fresh clone. `docker compose up` starts Postgres. All three Cargo workspaces build without errors. `nargo compile` succeeds on empty circuit stubs.

---

### Day 1 Prompts

---

**Prompt 1.1 — Monorepo & Directory Scaffold**

```
You are building NullCarbon — a zero-knowledge carbon credit retirement platform on Stellar.

Create the full monorepo directory scaffold exactly as specified in the README Project Structure section. The root should be `nullcarbon/` containing: `circuits/`, `contracts/` (with subdirs `retirement_verifier/`, `nullifier_registry/`, `credit_registry/`, `scripts/`), `backend/`, `frontend/`, `indexer/`, and `scripts/`.

Inside each directory, create the exact files listed in the README Project Structure — stub files are fine (empty functions, placeholder modules). Do not add any directories or files not listed in the README.

For `circuits/`, create `Nargo.toml` configured as a Noir workspace with members: `retirement_proof`, `compliance_proof`, `vintage_proof`. Create `circuits/src/main.nr` as an empty stub, `circuits/src/utils/merkle.nr`, `circuits/src/utils/poseidon.nr`, `circuits/src/utils/range.nr` — all empty stubs.

For `contracts/`, create a Cargo workspace `Cargo.toml` with members: `retirement_verifier`, `nullifier_registry`, `credit_registry`. Each contract directory should have its own `Cargo.toml` configured for Soroban (soroban-sdk dependency, wasm32 target) and a stub `src/lib.rs` with an empty `#[contract]` struct.

Output the complete file tree and all file contents.
```

---

**Prompt 1.2 — Environment Configuration Files**

```
For the NullCarbon project (a Noir + Soroban + NestJS + Angular carbon credit retirement platform on Stellar), create all environment configuration files:

1. Root `.env.example` with these variables:
   STELLAR_NETWORK, STELLAR_RPC_URL (https://soroban-testnet.stellar.org), STELLAR_HORIZON_URL (https://horizon-testnet.stellar.org), STELLAR_PASSPHRASE, DEPLOYER_SECRET_KEY, DEPLOYER_PUBLIC_KEY, RETIREMENT_VERIFIER_ID, NULLIFIER_REGISTRY_ID, CREDIT_REGISTRY_ID
   — all with descriptive comments explaining each variable.

2. `backend/.env.example` with: PORT, STELLAR_RPC_URL, STELLAR_PASSPHRASE, RETIREMENT_VERIFIER_ID, NULLIFIER_REGISTRY_ID, CREDIT_REGISTRY_ID, VERRA_API_KEY, GOLD_STANDARD_API_KEY, DATABASE_URL, MERKLE_TREE_DEPTH (default 20), JWT_SECRET
   — with descriptive comments.

3. `frontend/src/environments/environment.example.ts` with: apiUrl, stellarNetwork, stellarRpcUrl, stellarHorizonUrl, retirementVerifierId, nullifierRegistryId, creditRegistryId, production (false)

4. `docker-compose.yml` that runs PostgreSQL 16 on port 5432 with database name `nullcarbon`, user `nullcarbon`, password from env, and a volume for persistence.

Output all four files with full content.
```

---

**Prompt 1.3 — Setup & Utility Scripts**

```
Create the following shell scripts for NullCarbon (Noir + Soroban + NestJS + Angular on Stellar):

1. `scripts/setup.sh`
   Checks for and installs (or warns about) all prerequisites from the README: Node.js 20+, Rust + wasm32 target, stellar-cli, nargo (via noirup), bb (via bbup). Then runs `npm install` in backend/, frontend/, and indexer/. Then runs `cargo build` in contracts/. Then runs `nargo compile` in circuits/. Ends with a success message listing what was set up.

2. `scripts/fund-testnet.sh`
   Reads DEPLOYER_PUBLIC_KEY from .env. Calls the Stellar Friendbot endpoint (https://friendbot.stellar.org?addr=ADDRESS) to fund the account. Prints the resulting XLM balance by calling the Horizon testnet API. Handles errors (account already funded, network errors).

3. `scripts/build-merkle.sh`
   Calls the backend API endpoint POST /registry/sync to trigger a registry data pull, then POST /merkle/rebuild to rebuild the Merkle trees for Verra and Gold Standard. Prints the resulting Merkle roots. Reads API base URL from .env or defaults to http://localhost:3000.

4. `scripts/test-e2e.sh`
   Runs a full end-to-end test: (1) calls backend to issue a test credit, (2) fetches its Merkle proof, (3) runs `nargo prove` with test inputs from Prover.toml, (4) calls the proof relay endpoint, (5) checks the nullifier is recorded on-chain, (6) fetches the retirement certificate. Exits 0 on success, 1 on any failure. Prints clear pass/fail for each step.

All scripts should: set -euo pipefail, have clear section headers, print colored output (green for success, red for failure), and be fully commented.
```

---

**Prompt 1.4 — GitHub Actions CI Pipeline**

```
Create a GitHub Actions CI workflow file at `.github/workflows/ci.yml` for NullCarbon.

The workflow should trigger on push and pull_request to main and develop branches.

It should have four parallel jobs:

Job 1 — circuits:
  Runs on ubuntu-latest. Installs noirup and bbup. Runs `nargo compile` and `nargo test` in the circuits/ directory.

Job 2 — contracts:
  Runs on ubuntu-latest. Installs Rust stable with wasm32-unknown-unknown target and stellar-cli. Runs `cargo build --target wasm32-unknown-unknown --release` and `cargo test` in each contract directory (retirement_verifier, nullifier_registry, credit_registry).

Job 3 — backend:
  Runs on ubuntu-latest with Node.js 20. Runs `npm ci`, `npm run lint`, `npm run test` in backend/. Uses a PostgreSQL 16 service container for tests.

Job 4 — frontend:
  Runs on ubuntu-latest with Node.js 20. Runs `npm ci`, `npm run lint`, `ng build --configuration production` in frontend/.

Add appropriate caching for: Rust target directory, npm node_modules, nargo build artifacts.

Output the complete workflow YAML file.
```

---

## Day 2 — Noir ZK Circuits (All Three)

**Goal:** All three Noir circuits are fully implemented, tested, and proven. Verification keys are exported. `nargo test` passes on all circuits. A `Prover.toml` with realistic test data exists for each circuit.

**Deliverables:**
- `circuits/src/retirement_proof.nr` — fully implemented with all 6 constraints from the README (registry Merkle inclusion, vintage check, permanence check, nullifier computation + verification, volume commitment, non-zero volume)
- `circuits/src/compliance_proof.nr` — implemented with volume aggregation over 50 slots, threshold check, compliance nullifier
- `circuits/src/vintage_proof.nr` — implemented with vintage year, co-benefits, leakage factor, additionality, methodology Merkle proof
- `circuits/src/utils/merkle.nr` — Merkle inclusion proof utility used by both retirement and vintage circuits
- `circuits/src/utils/poseidon.nr` — nullifier and commitment computation wrappers
- `circuits/src/utils/range.nr` — range check helpers
- `Prover.toml` files for all three circuits with realistic test data
- All circuits pass `nargo test`
- Verification keys exported to `circuits/target/` via `bb write_vk`
- `circuits/README.md` documenting each circuit's inputs, outputs, and constraint logic

**End-of-day check:** `nargo compile && nargo test && nargo prove` all succeed. `circuits/target/` contains `retirement_vk`, `compliance_vk`, `vintage_vk`.

---

### Day 2 Prompts

---

**Prompt 2.1 — Merkle & Utility Libraries**

```
Implement the Noir utility libraries for NullCarbon's ZK circuits. NullCarbon is a carbon credit retirement platform that uses Noir circuits verified on Stellar Soroban via BN254 host functions.

1. `circuits/src/utils/merkle.nr`
   Implement a binary Merkle tree inclusion proof verifier with depth 20. The function signature:
   `fn verify_merkle_inclusion(leaf: Field, path: [Field; 20], indices: [u1; 20], root: Field) -> bool`
   Use Poseidon2 for internal node hashing. Traverse from leaf to root, choosing left/right child based on indices. Return true if computed root matches expected root.
   Also implement: `fn compute_leaf_hash(credit_id: Field, vintage: u32, volume: u64, methodology: u32) -> Field` using Poseidon2.

2. `circuits/src/utils/poseidon.nr`
   Implement nullifier and commitment computation wrappers:
   - `fn compute_retirement_nullifier(credit_secret: Field, credit_id: Field, corridor_id: Field) -> Field` — Poseidon2 of three inputs
   - `fn compute_compliance_nullifier(company_secret: Field, period_id: Field) -> Field` — Poseidon2 of two inputs
   - `fn compute_volume_commitment(tonne_volume: u64, credit_secret: Field) -> Field` — Poseidon2 commitment

3. `circuits/src/utils/range.nr`
   Implement range check helpers:
   - `fn assert_gte_u32(value: u32, minimum: u32, error_msg: str<N>)` — asserts value >= minimum
   - `fn assert_lte_u32(value: u32, maximum: u32, error_msg: str<N>)` — asserts value <= maximum
   - `fn assert_gt_u64(value: u64, threshold: u64, error_msg: str<N>)` — asserts value > threshold
   - `fn assert_gte_u64(value: u64, threshold: u64, error_msg: str<N>)` — asserts value >= threshold

Include `#[test]` functions for every utility. All tests must pass with `nargo test`.
```

---

**Prompt 2.2 — retirement_proof.nr Circuit**

```
Implement the full `retirement_proof` Noir circuit for NullCarbon — a ZK carbon credit retirement platform on Stellar.

The circuit proves in zero knowledge: "I hold a legitimate carbon credit from a verified registry, it has never been retired before, and I am now retiring it — without revealing which credit or who I am."

File: `circuits/src/retirement_proof.nr`

Private inputs:
- credit_id: Field
- credit_secret: Field
- credit_hash: Field
- registry_id: u32
- vintage_year: u32
- methodology_code: u32
- permanence_rating: u32
- tonne_volume: u64
- merkle_path: [Field; 20]
- merkle_indices: [u1; 20]

Public inputs (marked pub):
- nullifier: Field
- registry_merkle_root: Field
- min_vintage_year: u32
- min_permanence: u32
- volume_commitment: Field
- corridor_id: Field

Implement these 6 constraints in order:
1. Verify credit_hash exists in the registry Merkle tree (use merkle::verify_merkle_inclusion). The leaf must be recomputed from credit_id, vintage_year, tonne_volume, methodology_code using merkle::compute_leaf_hash.
2. Assert vintage_year >= min_vintage_year.
3. Assert permanence_rating >= min_permanence.
4. Compute nullifier = poseidon::compute_retirement_nullifier(credit_secret, credit_id, corridor_id) and assert it equals the public nullifier input.
5. Compute volume_commitment = poseidon::compute_volume_commitment(tonne_volume, credit_secret) and assert it equals the public volume_commitment input.
6. Assert tonne_volume > 0.

Import the utility modules. Use `use dep::std::hash::poseidon2` where needed.

Then write a `Prover.toml` with realistic test inputs that will generate a valid proof:
- Use a real-looking credit_id (e.g. a field element representing "VCS-111")
- vintage_year: 2022, permanence_rating: 91, tonne_volume: 3000
- A valid 20-element merkle_path (use zero-valued fields for unused levels)
- All other fields consistent so all 6 assertions pass

Write at least 3 `#[test]` functions: a happy-path test, a test that fails on expired vintage, and a test that fails on invalid nullifier.
```

---

**Prompt 2.3 — compliance_proof.nr Circuit**

```
Implement the `compliance_proof` Noir circuit for NullCarbon.

The circuit proves: "My total retired volume across all credits this compliance period meets or exceeds my declared offset commitment — without revealing the exact amount or which credits I retired."

File: `circuits/src/compliance_proof.nr`

Private inputs:
- retirement_nullifiers: [Field; 50]  — nullifiers of retirements in this period (pad unused with 0)
- retirement_volumes: [u64; 50]       — corresponding volumes (private)
- active_count: u32                   — number of active entries (rest are padding)
- company_secret: Field               — company's binding secret

Public inputs (marked pub):
- commitment_threshold: u64           — declared offset commitment in tonnes
- period_id: Field                    — compliance period identifier (e.g. hash of "2025-FY")
- compliance_nullifier: Field         — prevents double-submission of same retirements
- nullifier_set_root: Field           — Merkle root of all previously submitted retirement nullifiers

Implement these constraints:
1. Sum total retired volume across active_count entries only (entries beyond active_count must be zero-valued; enforce this).
2. Assert total_volume >= commitment_threshold.
3. Compute compliance_nullifier = poseidon::compute_compliance_nullifier(company_secret, period_id) and assert it equals the public compliance_nullifier input.
4. For each active retirement nullifier, verify it is included in the nullifier_set_root using merkle::verify_merkle_inclusion with a depth-20 Merkle path. Include the merkle paths and indices as additional private inputs: nullifier_paths: [[Field; 20]; 50] and nullifier_indices: [[u1; 20]; 50].
5. Assert active_count <= 50.

Write a `Prover.toml` with:
- 3 active retirements with volumes 3000, 5000, 2000 (total 10000)
- commitment_threshold: 10000
- All Merkle paths for the nullifiers (zero-padded)

Write 3 `#[test]` functions: happy path (exactly meets threshold), failure (below threshold), failure (invalid compliance nullifier).
```

---

**Prompt 2.4 — vintage_proof.nr Circuit**

```
Implement the `vintage_proof` Noir circuit for NullCarbon.

The circuit proves: "This credit meets the quality requirements for a specific retirement corridor (e.g. EU taxonomy, CORSIA, Article 6) without revealing the credit details."

File: `circuits/src/vintage_proof.nr`

Private inputs:
- vintage_year: u32
- methodology_code: u32
- co_benefits_score: u32       — social/biodiversity co-benefits rating (0–100)
- additionality_rating: u32    — was emission reduction additional? (0 = no, 1–5 = rating)
- leakage_factor: u32          — risk of emissions leaking elsewhere (0–100, lower is better)

Public inputs (marked pub):
- standard_id: u32                        — which quality standard to check (1=CORSIA, 2=Article6, 3=EUTaxonomy)
- min_vintage: u32                        — minimum vintage year
- min_co_benefits: u32                    — minimum co-benefits score
- max_leakage: u32                        — maximum allowed leakage factor
- approved_methodologies_root: Field      — Merkle root of approved methodology codes for this standard

Constraints:
1. Assert vintage_year >= min_vintage (use range::assert_gte_u32).
2. Assert co_benefits_score >= min_co_benefits.
3. Assert leakage_factor <= max_leakage.
4. Assert additionality_rating > 0 (credit must have some additionality).
5. Verify methodology_code is included in the approved_methodologies_root Merkle tree. The leaf is computed as: Poseidon2(methodology_code as Field, standard_id as Field). Include merkle_path: [Field; 20] and merkle_indices: [u1; 20] as private inputs.

Write a `Prover.toml` for CORSIA standard:
- vintage_year: 2022, methodology_code: 1 (REDD+)
- co_benefits_score: 85, additionality_rating: 4, leakage_factor: 12
- standard_id: 1, min_vintage: 2016, min_co_benefits: 60, max_leakage: 30

Write 3 `#[test]` functions: happy path, failure on low co-benefits, failure on methodology not in approved set.
```

---

## Day 3 — Soroban Smart Contracts (All Three)

**Goal:** All three Soroban contracts are fully implemented, tested, and deployed to Stellar testnet. Contract IDs are captured in `.env`. Inter-contract calls work. All `cargo test` pass.

**Deliverables:**
- `nullifier_registry/src/lib.rs` — full implementation: `initialize`, `record`, `is_used`, `count`, `set_authorized_verifier`
- `retirement_verifier/src/lib.rs` — full implementation: `initialize`, `verify_retirement`, `get_retirement`, using BN254 host functions
- `credit_registry/src/lib.rs` — full implementation: `issue_credit`, `transfer_credit`, `burn_on_retirement`, `get_credit`, `is_retired`
- All three contracts pass `cargo test`
- All three compiled to optimized WASM
- `scripts/deploy.sh` deploys all three in order (NullifierRegistry first, then CreditRegistry, then RetirementVerifier with both IDs)
- Contracts deployed and verified on Stellar testnet
- `contracts/README.md` documenting each contract's interface

**End-of-day check:** `stellar contract invoke` on each contract returns expected results. Nullifier can be written once and rejected on second write. Proof verification returns true for a valid test proof.

---

### Day 3 Prompts

---

**Prompt 3.1 — NullifierRegistry Contract**

```
Implement the full NullifierRegistry Soroban smart contract for NullCarbon.

NullCarbon is a ZK carbon credit retirement platform. The NullifierRegistry is the tamper-proof double-retirement prevention layer. Once a nullifier is written, it can NEVER be removed. It only accepts writes from the authorized RetirementVerifier contract.

File: `contracts/nullifier_registry/src/lib.rs`

Use soroban-sdk with these imports: contract, contractimpl, contracttype, symbol_short, Address, BytesN, Env.

Implement the following functions:

1. `initialize(env: Env, authorized_verifier: Address)`
   Stores the authorized verifier address. Can only be called once (check if already initialized, panic if so).

2. `record(env: Env, nullifier: BytesN<32>) -> bool`
   Requires the caller to be the authorized verifier (use env.current_contract_address() pattern or a passed caller address checked against storage). If nullifier already exists in persistent storage → return false. If fresh → store it in persistent storage and emit a "nullified" event. Increment a count in instance storage. Return true.

3. `is_used(env: Env, nullifier: BytesN<32>) -> bool`
   Returns true if the nullifier exists in persistent storage.

4. `count(env: Env) -> u64`
   Returns the total number of recorded nullifiers from instance storage.

5. `get_authorized_verifier(env: Env) -> Address`
   Returns the stored authorized verifier address.

Use symbol_short! for all storage keys. Use persistent storage for nullifiers (they must survive ledger rent expiry). Use instance storage for count and config.

Write thorough `#[cfg(test)]` tests covering: successful record, duplicate rejection, unauthorized caller rejection, count incrementing, is_used before and after recording.
```

---

**Prompt 3.2 — CreditRegistry Contract**

```
Implement the full CreditRegistry Soroban smart contract for NullCarbon.

NullCarbon tokenizes carbon credits as Stellar assets managed by this contract. The CreditRegistry handles credit issuance, transfers, and burn-on-retirement.

File: `contracts/credit_registry/src/lib.rs`

Define a CreditMetadata contracttype struct with fields:
- credit_hash: BytesN<32>
- registry_id: u32          (1=Verra, 2=GoldStandard, 3=ACX)
- vintage_year: u32
- methodology_code: u32
- permanence_rating: u32
- tonne_volume: u64
- owner: Address
- is_retired: bool
- issued_at: u64            (ledger timestamp)
- retired_at: u64           (0 if not retired)
- nullifier: BytesN<32>     (zero if not retired)

Implement:

1. `initialize(env: Env, admin: Address)`
   Store admin address. Set credit_count to 0.

2. `issue_credit(env: Env, to: Address, credit_hash: BytesN<32>, registry_id: u32, vintage_year: u32, methodology_code: u32, permanence_rating: u32, tonne_volume: u64) -> u64`
   Only callable by admin. Generate token_id = current credit_count + 1. Store CreditMetadata in persistent storage keyed by token_id. Increment count. Emit "issued" event with token_id and to address. Return token_id.

3. `transfer_credit(env: Env, token_id: u64, from: Address, to: Address)`
   Require from.require_auth(). Load credit by token_id. Assert owner == from and is_retired == false. Update owner to to. Emit "transferred" event.

4. `burn_on_retirement(env: Env, token_id: u64, owner: Address, nullifier: BytesN<32>)`
   Only callable by the authorized RetirementVerifier contract (store and check verifier address set during initialize or via set_verifier). Load credit. Assert is_retired == false. Set is_retired = true, retired_at = current timestamp, nullifier = nullifier. Emit "burned" event with token_id and nullifier.

5. `get_credit(env: Env, token_id: u64) -> CreditMetadata`
   Returns the credit metadata.

6. `is_retired(env: Env, token_id: u64) -> bool`
   Returns the is_retired field.

7. `set_verifier(env: Env, verifier: Address)`
   Only callable by admin. Sets the authorized verifier address.

Write `#[cfg(test)]` tests for: issue, transfer (happy path and unauthorized), burn (happy path, already retired, unauthorized), get_credit.
```

---

**Prompt 3.3 — RetirementVerifier Contract**

```
Implement the full RetirementVerifier Soroban smart contract for NullCarbon.

This is the core on-chain proof checker. It verifies Noir UltraHonk proofs using Stellar Protocol 25/26 BN254 host functions, records nullifiers via the NullifierRegistry, and burns the token via CreditRegistry.

File: `contracts/retirement_verifier/src/lib.rs`

Define a RetirementRecord contracttype struct:
- nullifier: BytesN<32>
- registry_root: BytesN<32>
- volume_commitment: BytesN<32>
- corridor_id: BytesN<32>
- min_vintage_year: u32
- min_permanence: u32
- timestamp: u64

Define a PublicInputs struct (not contracttype, just internal) with the same fields for decoding.

Implement:

1. `initialize(env: Env, vk: Bytes, nullifier_registry: Address, credit_registry: Address)`
   Store verification key, NullifierRegistry contract address, CreditRegistry contract address. Can only be called once.

2. `verify_retirement(env: Env, proof: Bytes, public_inputs: Bytes, token_id: u64, owner: Address) -> bool`
   Steps:
   a. Decode public_inputs bytes into: nullifier (bytes 0–32), registry_root (32–64), volume_commitment (64–96), corridor_id (96–128), min_vintage_year as u32 (128–132), min_permanence as u32 (132–136).
   b. Load verification key from storage.
   c. Call env.crypto().verify_groth16_bn254(&vk, &public_inputs, &proof) — this invokes the BN254 host functions from Stellar Protocol 25/26.
   d. If not valid → return false.
   e. Cross-contract call NullifierRegistry::record(nullifier) — if returns false, the nullifier was already used, return false.
   f. Cross-contract call CreditRegistry::burn_on_retirement(token_id, owner, nullifier).
   g. Store the RetirementRecord in persistent storage keyed by nullifier.
   h. Emit a "retirement_verified" event with (nullifier, volume_commitment, corridor_id, timestamp).
   i. Return true.

3. `get_retirement(env: Env, nullifier: BytesN<32>) -> Option<RetirementRecord>`
   Returns the stored retirement record if it exists.

4. `get_vk(env: Env) -> Bytes`
   Returns the stored verification key (for transparency/audit).

In tests, mock the BN254 verification call (use a feature flag or a test-mode bypass that accepts any proof when a test_mode: bool is set in storage).

Write tests for: valid proof accepted, duplicate nullifier rejected, invalid proof rejected (test mode), correct event emission.
```

---

**Prompt 3.4 — Deployment Script**

```
Create `contracts/scripts/deploy.sh` — a complete deployment script for all three NullCarbon Soroban contracts to Stellar testnet.

The script must:

1. Load DEPLOYER_SECRET_KEY, DEPLOYER_PUBLIC_KEY, and STELLAR_NETWORK from the root .env file.

2. Check that stellar-cli is installed and the deployer account is funded (call Horizon to check XLM balance, exit if < 100 XLM).

3. Build and optimize all three contracts in order:
   - Run `cargo build --target wasm32-unknown-unknown --release` in each contract directory
   - Run `stellar contract optimize` on each resulting WASM

4. Deploy NullifierRegistry first:
   - `stellar contract deploy` with the deployer source and testnet network
   - Capture the contract ID as NULLIFIER_REGISTRY_ID
   - Call `initialize` with DEPLOYER_PUBLIC_KEY as admin

5. Deploy CreditRegistry second:
   - Capture as CREDIT_REGISTRY_ID
   - Call `initialize` with DEPLOYER_PUBLIC_KEY as admin

6. Deploy RetirementVerifier third:
   - Read the retirement verification key from circuits/target/retirement_vk (base64 encode it)
   - Call `initialize` with vk, NULLIFIER_REGISTRY_ID, CREDIT_REGISTRY_ID
   - Call CreditRegistry `set_verifier` with the RetirementVerifier contract ID

7. Write all three contract IDs back to the root .env file (replacing placeholder values).

8. Print a deployment summary table:
   NullifierRegistry: C...
   CreditRegistry: C...
   RetirementVerifier: C...
   Network: testnet

Use set -euo pipefail. Print colored section headers. Exit cleanly on any failure with a descriptive error message.
```

---

## Day 4 — NestJS Backend & Indexer

**Goal:** The backend API is fully functional. All endpoints from the README API Reference section work. The Merkle bridge generates real trees from mock registry data. The indexer listens to Soroban events and indexes certificates. PostgreSQL schema is migrated.

**Deliverables:**
- Database schema migrated (nullifiers table, certificates table, credits table, merkle_snapshots table)
- `RegistryService` — mock Verra + Gold Standard credit data, sync endpoint
- `MerkleService` — builds Poseidon2 Merkle trees from credit hashes, stores roots, generates inclusion proofs per credit
- `ProofService` — relays proofs to Soroban RetirementVerifier via Stellar SDK, polls for tx confirmation
- `NullifierService` — checks nullifier status both locally and on-chain
- `CertificateService` — indexes retirement certificates from Soroban events
- `ComplianceService` — generates compliance claims from a set of nullifiers
- All API endpoints from the README working and returning the documented response shapes
- Basic request validation and error handling on all endpoints
- Indexer running and persisting Soroban `retirement_verified` events to PostgreSQL

**End-of-day check:** `curl POST /proof/retire` with a valid proof and public inputs returns `{ verified: true, txHash: "..." }`. `curl GET /certificate/:id` returns a valid certificate. `curl GET /registry/credits` returns 10+ mock credits with Merkle proofs.

---

### Day 4 Prompts

---

**Prompt 4.1 — Database Schema & Registry Service**

```
Implement the PostgreSQL database schema and RegistryService for NullCarbon's NestJS backend.

NullCarbon is a ZK carbon credit retirement platform. The backend bridges carbon registries (Verra, Gold Standard) with the Noir circuit and Soroban contracts.

1. Create the database migration file `backend/src/db/migrations/001_initial_schema.sql`:

Table: credits
  id SERIAL PRIMARY KEY
  credit_id VARCHAR(64) UNIQUE NOT NULL        -- e.g. "VCS-111"
  registry VARCHAR(32) NOT NULL                -- "Verra", "GoldStandard"
  registry_id INTEGER NOT NULL                 -- 1=Verra, 2=GoldStandard
  credit_hash VARCHAR(66) NOT NULL             -- Poseidon2 hash as hex
  vintage_year INTEGER NOT NULL
  methodology_code INTEGER NOT NULL
  methodology_name VARCHAR(64)                 -- e.g. "REDD+"
  permanence_rating INTEGER NOT NULL
  tonne_volume BIGINT NOT NULL
  is_retired BOOLEAN DEFAULT false
  stellar_token_id BIGINT                      -- token ID in CreditRegistry contract
  created_at TIMESTAMPTZ DEFAULT NOW()

Table: merkle_snapshots
  id SERIAL PRIMARY KEY
  registry VARCHAR(32) NOT NULL
  merkle_root VARCHAR(66) NOT NULL
  depth INTEGER DEFAULT 20
  credit_count INTEGER NOT NULL
  snapshot_at TIMESTAMPTZ DEFAULT NOW()

Table: nullifiers
  id SERIAL PRIMARY KEY
  nullifier VARCHAR(66) UNIQUE NOT NULL
  corridor_id VARCHAR(66)
  recorded_at TIMESTAMPTZ DEFAULT NOW()
  stellar_tx_hash VARCHAR(64)

Table: retirement_certificates
  id SERIAL PRIMARY KEY
  certificate_id VARCHAR(64) UNIQUE NOT NULL   -- e.g. "CERT-20260601-00042"
  nullifier VARCHAR(66) NOT NULL
  registry_root VARCHAR(66)
  volume_commitment VARCHAR(66)
  corridor_id VARCHAR(66)
  stellar_tx_hash VARCHAR(64)
  ledger INTEGER
  issued_at TIMESTAMPTZ DEFAULT NOW()

2. Create `backend/src/registry/registry.service.ts`:

Implement a RegistryService with:
- A hardcoded array of 15 mock Verra credits (VCS-001 through VCS-010) and 5 mock Gold Standard credits (GS-001 through GS-005). Each has realistic data: vintage 2020–2024, methodologies from [REDD+=1, IFM=2, ARR=3, DAC=4, GS4GG=5, ICS=6], permanence 70–99, volumes 1000–10000 tonnes.
- `syncRegistry(): Promise<Credit[]>` — upserts all mock credits into the credits table, computes credit_hash for each as Poseidon2(credit_id_field, vintage, volume, methodology), returns all credits.
- `getCredits(filters): Promise<Credit[]>` — queries credits table with optional filters for registry, vintage_min, vintage_max, methodology, volume_min.
- `getCreditByHash(hash: string): Promise<Credit | null>`
- `markRetired(creditId: string): Promise<void>` — sets is_retired = true

Also create `backend/src/registry/registry.controller.ts` with GET /registry/credits and POST /registry/sync endpoints matching the README API Reference exactly.
```

---

**Prompt 4.2 — MerkleService & Proof Relay**

```
Implement the MerkleService and ProofService for NullCarbon's NestJS backend.

NullCarbon uses Poseidon2 Merkle trees to prove carbon credit existence in registries without the registries going on-chain. The ProofService relays verified proofs to the Soroban RetirementVerifier contract.

1. `backend/src/merkle/merkle.service.ts`

Implement MerkleService:
- Use the `poseidon-lite` npm package (or implement Poseidon2 manually using the BN254 field) for hashing.
- `buildTree(credits: Credit[]): MerkleTree` — takes an array of credits, computes leaf hashes as Poseidon2(credit_id_field, vintage, volume, methodology), builds a complete binary Merkle tree of depth 20 (pad with zero leaves), returns the tree object with root and all nodes.
- `getRoot(registry: string): Promise<string>` — retrieves the latest merkle root for a registry from merkle_snapshots table.
- `rebuildTrees(): Promise<Record<string, string>>` — syncs credits from RegistryService, builds trees for Verra and GoldStandard, saves roots to merkle_snapshots table, returns a map of registry → root.
- `getMerkleProof(creditHash: string): Promise<MerkleProof>` — finds the credit in the tree, returns merkle_path (20 elements) and merkle_indices (20 elements) for the Noir circuit.
- `verifyProof(leaf: string, path: string[], indices: number[], root: string): boolean` — local verification of a Merkle proof.

Create `GET /registry/merkle-proof/:creditHash` controller endpoint that calls getMerkleProof and returns the documented response shape from the README.

2. `backend/src/proof/proof.service.ts`

Implement ProofService:
- Inject ConfigService (for Soroban RPC URL, contract ID) and NullifierService.
- `relayRetirementProof(proof: string, publicInputs: RetirementPublicInputs): Promise<ProofRelayResult>`
  a. Check nullifier is not already used (call NullifierService.isUsed).
  b. Build a Stellar transaction calling RetirementVerifier::verify_retirement on Soroban using @stellar/stellar-sdk.
  c. Submit the transaction and wait for confirmation (poll Horizon for tx status).
  d. On success: extract the retirement_verified event, generate a certificate ID (CERT-YYYYMMDD-NNNNN), store in retirement_certificates table, return { verified: true, txHash, nullifier, certificateId }.
  e. On failure: return { verified: false, error }.
- `relayComplianceProof(proof: string, publicInputs: CompliancePublicInputs): Promise<ComplianceRelayResult>` — similar flow for the compliance circuit.

Create POST /proof/retire and POST /proof/compliance controller endpoints matching the README API Reference exactly.
```

---

**Prompt 4.3 — Nullifier, Certificate & Compliance Services**

```
Implement NullifierService, CertificateService, and ComplianceService for NullCarbon's NestJS backend.

1. `backend/src/nullifier/nullifier.service.ts`
   - `isUsed(nullifier: string): Promise<boolean>` — checks both local DB (nullifiers table) and on-chain via Soroban RPC call to NullifierRegistry::is_used. Local DB is checked first as a fast path; on-chain is the source of truth.
   - `record(nullifier: string, corridorId: string, txHash: string): Promise<void>` — inserts into nullifiers table.
   - `getCount(): Promise<number>` — returns total nullifier count from DB.

   Create GET /proof/nullifier/:nullifier controller endpoint.

2. `backend/src/certificate/certificate.service.ts`
   - `getByCertificateId(id: string): Promise<Certificate | null>` — queries retirement_certificates by certificate_id.
   - `getByNullifier(nullifier: string): Promise<Certificate | null>`
   - `verifyOnChain(nullifier: string): Promise<boolean>` — calls RetirementVerifier::get_retirement on Soroban and checks existence.
   - `getPublicFeed(limit: number, offset: number): Promise<Certificate[]>` — returns paginated public feed of all certificates ordered by issued_at DESC.
   - `generateCertificateId(): string` — generates "CERT-YYYYMMDD-{5-digit-sequence}" format.

   Create GET /certificate/:id, GET /certificate/verify/:nullifier, GET /certificates/feed controller endpoints.

3. `backend/src/compliance/compliance.service.ts`
   - `generateComplianceClaim(nullifiers: string[], periodId: string, companySecret: string): Promise<ComplianceClaim>` — takes a list of retirement nullifiers, verifies each is in the nullifiers table, computes the nullifier_set_root (Merkle root of submitted nullifiers), returns the input object needed for the compliance Noir circuit.
   - `getComplianceStatus(companyId: string): Promise<ComplianceStatus>` — returns { compliant: boolean, periodId, verifiedAt, certificateId } based on stored compliance certificates.

   Create GET /compliance/status/:companyId and POST /compliance/generate-claim controller endpoints.

For all services, use TypeORM or raw `pg` queries (your choice). All database queries must use parameterized queries. Include basic input validation using class-validator DTOs on all controller endpoints.
```

---

**Prompt 4.4 — Event Indexer**

```
Implement the NullCarbon event indexer — a NestJS application that listens to Soroban contract events on Stellar testnet and persists them to PostgreSQL.

File structure:
- `indexer/src/index.ts` — bootstrap
- `indexer/src/handlers/retirement.handler.ts`
- `indexer/src/handlers/certificate.handler.ts`
- `indexer/src/db/schema.ts`

The indexer should:

1. On startup, read RETIREMENT_VERIFIER_ID, NULLIFIER_REGISTRY_ID, STELLAR_RPC_URL from environment.

2. Track the last processed ledger in the DB so restarts resume from where they left off.

3. Poll the Stellar RPC `getEvents` endpoint every 5 seconds for new events from the RetirementVerifier contract. Filter for topic: "retirement_verified".

4. For each retirement_verified event:
   - Extract: nullifier (topic[1]), volume_commitment (topic[2]), corridor_id (topic[3]) from the event topics
   - Extract: stellar_tx_hash and ledger from the event metadata
   - Call RetirementHandler.handle(event) which:
     a. Inserts into nullifiers table if not already present
     b. Generates a certificate_id
     c. Upserts into retirement_certificates table
     d. Logs: "Indexed retirement: CERT-... | nullifier: 0x... | ledger: N"

5. Also poll NullifierRegistry for "nullified" events as a cross-check.

6. Handle network errors gracefully — retry with exponential backoff, log errors, never crash.

Use @stellar/stellar-sdk's Server or RPC client for event fetching. Use `pg` for database writes. The indexer should run as a standalone Node.js process (`node dist/index.js`), separate from the NestJS backend.
```

---

## Day 5 — Angular Frontend & End-to-End Integration

**Goal:** The Angular frontend has a working wallet connection, credit portfolio view, and full retirement flow (all 4 steps including in-browser proof generation). The end-to-end path from credit import → proof generation → on-chain verification → certificate display works on testnet. The public audit portal renders certificates.

**Deliverables:**
- `NoirService` — wraps `@noir-lang/noir_js` and `@aztec/bb.js` WASM, exposes `generateRetirementProof()`, `generateComplianceProof()`
- `StellarService` — Freighter wallet connect, `getAddress()`, `sendTransaction()`
- `RegistryService` — HTTP client to backend `/registry/credits` and `/registry/merkle-proof/:hash`
- `CertificateService` — HTTP client to `/certificate/:id` and `/certificates/feed`
- `WalletConnectComponent` — Freighter connect button, address display, XLM balance
- `CreditPortfolioComponent` — lists imported credits with vintage, methodology, volume, permanence
- `RetirementFlowComponent` — 4-step stepper: select credits → configure corridor → generate proof → submit & certify
- `ProofGenerateComponent` — shows live proof generation progress, constraint count, proof time
- `AuditPortalComponent` — public feed of retirement certificates, search by certificate ID or nullifier, on-chain verify button
- `test-e2e.sh` passes end-to-end on testnet

**End-of-day check:** A user can open the app, connect Freighter, see mock credits, select one, generate a proof in the browser, submit it, and see a retirement certificate. The audit portal shows the certificate publicly.

---

### Day 5 Prompts

---

**Prompt 5.1 — Core Angular Services**

```
Implement the three core Angular services for NullCarbon's frontend. NullCarbon is a ZK carbon credit retirement platform on Stellar using Noir proofs verified on Soroban.

1. `frontend/src/app/shared/services/noir.service.ts`

An injectable Angular service wrapping Noir proof generation. Use dynamic import() for `@noir-lang/noir_js` and `@aztec/bb.js` (they are WASM — load lazily on first use).

Implement:
- `isReady(): boolean` — returns true once WASM is initialized
- `initialize(): Promise<void>` — lazily loads Noir and Barretenberg WASM modules, initializes the UltraHonk backend with the retirement circuit (import the compiled circuit JSON from assets/circuits/retirement_proof.json)
- `generateRetirementProof(inputs: RetirementProofInputs): Promise<RetirementProof>`
  Uses Noir.execute() to generate witness, then BarretenbergBackend.generateProof() to generate the proof.
  Emits progress via a Subject<ProofProgress>: { stage: 'witness' | 'proof', percent: number }
  Returns { proof: string, publicInputs: RetirementPublicInputs, generationTimeMs: number }
- `generateComplianceProof(inputs: ComplianceProofInputs): Promise<ComplianceProof>` — same pattern for compliance circuit
- `proofProgress$: Observable<ProofProgress>` — exposes the progress subject as observable

Define all input/output TypeScript interfaces (RetirementProofInputs, RetirementProof, etc.) aligned exactly with the Noir circuit's private and public inputs from the README ZK Circuit Design section.

2. `frontend/src/app/shared/services/stellar.service.ts`

An injectable service wrapping Freighter and @stellar/stellar-sdk:
- `connect(): Promise<string>` — calls getPublicKey() from @stellar/freighter-api, stores address, returns it
- `getAddress(): string | null`
- `isConnected(): boolean`
- `getXlmBalance(): Promise<string>` — calls Horizon testnet to get XLM balance for connected address
- `submitTransaction(xdr: string): Promise<string>` — calls signTransaction() then submits via Horizon, returns tx hash

3. `frontend/src/app/shared/services/registry.service.ts`

HttpClient-based service:
- `getCredits(filters?: CreditFilters): Observable<Credit[]>` — GET /registry/credits
- `getMerkleProof(creditHash: string): Observable<MerkleProof>` — GET /registry/merkle-proof/:creditHash
- `syncRegistry(): Observable<Credit[]>` — POST /registry/sync

Define the Credit, CreditFilters, MerkleProof interfaces matching the backend API response shapes exactly.
```

---

**Prompt 5.2 — Wallet Connect & Credit Portfolio Components**

```
Implement the WalletConnectComponent and CreditPortfolioComponent for NullCarbon's Angular frontend.

NullCarbon is a ZK carbon credit retirement platform. These are standalone Angular 17 components using signals and the inject() function.

1. `frontend/src/app/features/wallet/wallet-connect.component.ts`

A standalone component with selector `app-wallet-connect`.
Template should show:
- When not connected: a "Connect Freighter Wallet" button with the Freighter logo (use an SVG inline or an img tag)
- When connected: the wallet address (truncated: first 4 + ... + last 4 chars), XLM balance, and a "Disconnect" button
- A loading state while connecting

Use StellarService. Use Angular signals for connected state, address, balance. On connect click, call stellarService.connect() then fetch XLM balance. Handle errors (Freighter not installed → show "Install Freighter" link to https://freighter.app).

Include a `@Output() walletConnected = new EventEmitter<string>()` that emits the address on successful connection.

Styling: clean card with dark background, monospace font for the address, green dot indicator when connected. Use Tailwind classes.

2. `frontend/src/app/features/credits/credit-portfolio.component.ts`

A standalone component with selector `app-credit-portfolio`.
Inputs: `@Input() walletAddress: string`

On init, call registryService.getCredits() to load credits. Display them in a responsive grid of cards.

Each credit card shows:
- Registry badge (color-coded: Verra=green, GoldStandard=gold)
- Credit ID (e.g. VCS-111)
- Vintage year with a calendar icon
- Methodology name (e.g. REDD+)
- Volume in tonnes (formatted with commas)
- Permanence rating as a colored badge (≥90=green, ≥70=yellow, <70=red)
- A "Select for Retirement" button (disabled if is_retired=true, shows "Retired" badge instead)
- A checkbox for multi-select

State: selectedCredits: Signal<Credit[]> — tracks selected credits for the retirement flow.
Emit: `@Output() creditsSelected = new EventEmitter<Credit[]>()` when selection changes.

Include a filter bar at the top with: registry filter (All/Verra/Gold Standard), minimum vintage year input, methodology dropdown.

Use Angular signals for all state. Use RegistryService.
```

---

**Prompt 5.3 — Retirement Flow & Proof Generation Components**

```
Implement the RetirementFlowComponent and ProofGenerateComponent for NullCarbon's Angular frontend.

These are the most critical user-facing components — they take a user from credit selection to on-chain retirement certificate.

1. `frontend/src/app/features/retirement/retirement-flow.component.ts`

A standalone Angular 17 component with selector `app-retirement-flow`.
Input: `@Input() selectedCredits: Credit[]`

Implements a 4-step stepper using Angular signals for step tracking:

Step 1 — Configure Retirement:
- Show selected credits summary (count, total volume in tonnes)
- Corridor selector dropdown: EU-CORSIA, Article 6, Voluntary, EUTaxonomy — each mapped to a corridor_id field element
- Min vintage year display (auto-set based on corridor: CORSIA=2016, Article6=2018, Voluntary=2010)
- Min permanence display (auto-set: CORSIA=70, Article6=60, Voluntary=50)
- "Proceed to Proof Generation" button

Step 2 — Generate ZK Proof:
- Shows ProofGenerateComponent (see below)
- Passes all required inputs derived from selected credits + corridor config
- Waits for proof completion before enabling Next

Step 3 — Review & Submit:
- Shows proof summary: nullifier (truncated), public inputs, estimated gas
- "Submit to Stellar Testnet" button that calls ProofService.relayRetirementProof()
- Shows transaction submission spinner

Step 4 — Certificate:
- Shows success state with the certificate ID, Stellar tx hash (with link to Stellar Explorer), and a shareable certificate card
- "Retire More Credits" button resets to Step 1

Use Angular signals for: currentStep, proofResult, txResult, isLoading, error.

2. `frontend/src/app/features/retirement/proof-generate.component.ts`

A standalone component with selector `app-proof-generate`.
Inputs: RetirementProofInputs (all circuit inputs from the README ZK Circuit Design section)
Output: `@Output() proofGenerated = new EventEmitter<RetirementProof>()`

On init (or on a "Generate Proof" button click):
- Call noirService.initialize() if not ready
- Subscribe to noirService.proofProgress$ and show a live progress bar
- Call noirService.generateRetirementProof(inputs)
- Display:
  - Stage indicator: "Generating witness..." → "Generating proof..."
  - Animated progress bar (0–100%)
  - Circuit constraint count (from the circuit metadata: 6,841 constraints)
  - Elapsed time counter (updates every 100ms)
  - On completion: "Proof generated in X.Xs ✓" in green
  - On error: error message in red with a "Retry" button

Nullifier display: once proof is complete, show the nullifier value (truncated) with a copy button.
```

---

**Prompt 5.4 — Audit Portal & App Routing**

```
Implement the AuditPortalComponent and complete the Angular app routing for NullCarbon.

1. `frontend/src/app/features/audit/audit-portal.component.ts`

A standalone Angular 17 component with selector `app-audit-portal`.
This is a PUBLIC page — no wallet connection required.

Features:
- Search bar at the top: accepts either a Certificate ID (CERT-...) or a nullifier (0x...)
- On search: calls CertificateService.getByCertificateId() or getByNullifier() accordingly
- Result card shows:
  - Certificate ID with a verified shield icon
  - Status: "Verified On-Chain ✓" in green (or "Not Found" in red)
  - Nullifier hash (full, monospace, copyable)
  - Registry Merkle root (truncated, copyable)
  - Volume commitment (truncated)
  - Corridor ID decoded to human label (EU-CORSIA, Article 6, etc.)
  - Timestamp (formatted as "June 1, 2026 at 14:23 UTC")
  - Stellar transaction hash with external link to https://stellar.expert/explorer/testnet/tx/{hash}
  - Ledger number
  - An "Verify On-Chain" button that calls CertificateService.verifyOnChain(nullifier) — shows a spinner then "Independently verified ✓"

Below the search: a public feed of the 20 most recent retirement certificates (GET /certificates/feed). Each shows certificate ID, corridor, volume commitment, and timestamp. Clicking one populates the search and shows the detail card.

Loading states for all async operations. Empty state when no certificates exist yet.

2. `frontend/src/app/app.routes.ts`

Configure Angular routing:
- `/` → redirect to `/retire`
- `/retire` → lazy-load RetirementFlowComponent (full page with WalletConnectComponent + CreditPortfolioComponent + RetirementFlowComponent composed together)
- `/audit` → lazy-load AuditPortalComponent
- `/audit/:id` → AuditPortalComponent with the id pre-populated in the search bar
- `**` → redirect to `/`

3. `frontend/src/app/app.component.ts`

Top-level shell with:
- Navigation bar: NullCarbon logo (text), "Retire Credits" link → /retire, "Audit Portal" link → /audit
- `<router-outlet>`
- Footer: "Built on Stellar · Proofs by Noir · Verified on Soroban"

Tailwind styling throughout. Dark theme (#0f172a background, white text, green (#22c55e) for success states).
```

---

## Completion Checklist at End of Day 5

### Circuits ✅
- [ ] `retirement_proof.nr` — compiled, tested, proven
- [ ] `compliance_proof.nr` — compiled, tested, proven
- [ ] `vintage_proof.nr` — compiled, tested, proven
- [ ] All utility libraries (`merkle.nr`, `poseidon.nr`, `range.nr`)
- [ ] `Prover.toml` files for all three circuits
- [ ] Verification keys exported to `circuits/target/`

### Soroban Contracts ✅
- [ ] `NullifierRegistry` — deployed to testnet, `C...` captured in `.env`
- [ ] `CreditRegistry` — deployed to testnet, `C...` captured in `.env`
- [ ] `RetirementVerifier` — deployed to testnet, initialized with VK + contract addresses
- [ ] All three pass `cargo test`

### Backend (~70%) ✅
- [ ] PostgreSQL schema migrated
- [ ] `RegistryService` with 20 mock credits
- [ ] `MerkleService` building Poseidon2 trees
- [ ] `ProofService` relaying to Soroban
- [ ] `NullifierService` with on-chain check
- [ ] `CertificateService` with public feed
- [ ] All API endpoints from README returning correct shapes
- [ ] Indexer running and persisting events

### Frontend (~50%) ✅
- [ ] `NoirService` with WASM proof generation
- [ ] `StellarService` with Freighter connect
- [ ] `RegistryService` HTTP client
- [ ] `WalletConnectComponent`
- [ ] `CreditPortfolioComponent` with filtering
- [ ] `RetirementFlowComponent` (4-step stepper)
- [ ] `ProofGenerateComponent` with live progress
- [ ] `AuditPortalComponent` with public feed
- [ ] Routing configured

### Integration ✅
- [ ] `test-e2e.sh` passes all steps on testnet
- [ ] End-to-end: credit → proof → on-chain verification → certificate

---

## Open Contribution Targets (35% Remaining)

These are the well-defined tasks left for contributors, each isolated and clearly scoped:

| Task | Component | Effort |
|---|---|---|
| Net-zero compliance claim UI | Frontend | Medium |
| Live Verra API integration | Backend | Medium |
| Live Gold Standard API integration | Backend | Medium |
| ACX registry bridge | Backend | Medium |
| Multi-credit batch retirement proof | Circuits + Backend | Large |
| Mobile proof generation optimization | Frontend | Medium |
| CORSIA and Article 6 corridor rules | Circuits | Small |
| Regulator compliance dashboard | Frontend | Large |
| Contract security audit | Contracts | Large |
| Mainnet deployment pipeline | Scripts | Small |
| SDK extraction | All | Large |
| ISO 14064 / GHG Protocol alignment | Backend | Medium |

Each of these maps directly to a task in the README v0.2 and v1.0 roadmap sections.

---

## Daily Git Discipline

Each day ends with a tagged commit:

```bash
# End of each day
git add .
git commit -m " <summary of what was built>"
git tag v0.0.N
git push origin main --tags
```

| Tag | Contents |
|---|---|
| `v0.0.1` | Repo scaffold, toolchain, CI |
| `v0.0.2` | All three Noir circuits passing |
| `v0.0.3` | All three Soroban contracts deployed to testnet |
| `v0.0.4` | Backend API fully functional, indexer running |
| `v0.0.5` | Frontend retirement flow working, e2e passing — **65% complete** |
ENDOFFILE
echo "Done"