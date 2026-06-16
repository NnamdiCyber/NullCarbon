// NullCarbon — Retirement Proof Circuit
// Proves: "I hold a legitimate carbon credit from a verified registry,
//          it has never been retired before, and I am now retiring it."

mod utils;

use crate::utils::merkle;
use crate::utils::poseidon;
use crate::utils::range;

fn main(
    // Private inputs
    credit_id: Field,
    credit_secret: Field,
    credit_hash: Field,
    registry_id: u32,
    vintage_year: u32,
    methodology_code: u32,
    permanence_rating: u32,
    tonne_volume: u64,
    merkle_path: [Field; 20],
    merkle_indices: [u1; 20],

    // Public inputs
    pub nullifier: Field,
    pub registry_merkle_root: Field,
    pub min_vintage_year: u32,
    pub min_permanence: u32,
    pub volume_commitment: Field,
    pub corridor_id: Field,
) {
    // 1. Verify credit exists in the registry Merkle tree
    let computed_root = merkle::verify_merkle_inclusion(credit_hash, merkle_path, merkle_indices, registry_merkle_root);
    assert(computed_root == registry_merkle_root, "Credit not found in verified registry");

    // 2. Verify vintage year meets minimum requirement
    range::assert_gte_u32(vintage_year, min_vintage_year, "Credit vintage too old");

    // 3. Verify permanence rating meets threshold
    range::assert_gte_u32(permanence_rating, min_permanence, "Credit permanence rating insufficient");

    // 4. Compute and verify nullifier
    let computed_nullifier = poseidon::compute_retirement_nullifier(credit_secret, credit_id, corridor_id);
    assert(computed_nullifier == nullifier, "Invalid nullifier");

    // 5. Verify volume commitment
    let computed_commitment = poseidon::compute_volume_commitment(tonne_volume, credit_secret);
    assert(computed_commitment == volume_commitment, "Volume commitment mismatch");

    // 6. Enforce non-zero retirement volume
    assert(tonne_volume > 0, "Cannot retire zero tonnes");
}
