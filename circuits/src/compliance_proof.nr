// NullCarbon — Compliance Proof Circuit
// Proves: "My total retired volume meets or exceeds my declared offset commitment."

mod utils;

use crate::utils::merkle;
use crate::utils::poseidon;
use crate::utils::range;

fn main(
    // Private inputs
    retirement_nullifiers: [Field; 50],
    retirement_volumes: [u64; 50],
    active_count: u32,
    company_secret: Field,
    nullifier_paths: [[Field; 20]; 50],
    nullifier_indices: [[u1; 20]; 50],

    // Public inputs
    pub commitment_threshold: u64,
    pub period_id: Field,
    pub compliance_nullifier: Field,
    pub nullifier_set_root: Field,
) {
    // 1. Sum total retired volume across active entries only
    let mut total_volume: u64 = 0;
    for i in 0..50 {
        if i < active_count {
            total_volume = total_volume + retirement_volumes[i];
        } else {
            assert(retirement_volumes[i] == 0, "Inactive entry must be zero");
        }
    }

    // 2. Prove total meets or exceeds commitment threshold
    range::assert_gte_u64(total_volume, commitment_threshold, "Insufficient retirement volume for compliance");

    // 3. Verify compliance nullifier
    let computed_compliance_nullifier = poseidon::compute_compliance_nullifier(company_secret, period_id);
    assert(computed_compliance_nullifier == compliance_nullifier, "Invalid compliance nullifier");

    // 4. Verify each active nullifier is in the nullifier set
    for i in 0..50 {
        if i < active_count {
            let computed_root = merkle::verify_merkle_inclusion(
                retirement_nullifiers[i],
                nullifier_paths[i],
                nullifier_indices[i],
                nullifier_set_root,
            );
            assert(computed_root == nullifier_set_root, "Nullifier not in set");
        }
    }

    // 5. Assert active_count is within bounds
    range::assert_lte_u32(active_count, 50, "Active count exceeds maximum");
}
