use utils::merkle;
use utils::poseidon;
use utils::range;

fn main(
    retirement_nullifiers: [Field; 50],
    retirement_volumes: [u64; 50],
    active_count: u32,
    company_secret: Field,
    nullifier_paths: [[Field; 20]; 50],
    nullifier_indices: [[bool; 20]; 50],
    commitment_threshold: u64,
    period_id: Field,
    compliance_nullifier: Field,
    nullifier_set_root: Field,
) {
    let mut total_volume: u64 = 0;
    for i in 0..50 {
        if i < active_count {
            total_volume = total_volume + retirement_volumes[i];
        } else {
            assert(retirement_volumes[i] == 0);
        }
    }

    range::assert_gte_u64(total_volume, commitment_threshold);

    let computed_compliance_nullifier = poseidon::compute_compliance_nullifier(company_secret, period_id);
    assert(computed_compliance_nullifier == compliance_nullifier);

    for i in 0..50 {
        if i < active_count {
            let computed_root = merkle::verify_merkle_inclusion(
                retirement_nullifiers[i],
                nullifier_paths[i],
                nullifier_indices[i],
            );
            assert(computed_root == nullifier_set_root);
        }
    }

    range::assert_lte_u32(active_count, 50);
}

#[test]
fn test_happy_path_exactly_meets_threshold() {
    let mut retirement_nullifiers: [Field; 50] = [0; 50];
    let mut retirement_volumes: [u64; 50] = [0; 50];
    let mut nullifier_paths: [[Field; 20]; 50] = [[0; 20]; 50];
    let mut nullifier_indices: [[bool; 20]; 50] = [[false; 20]; 50];

    let company_secret: Field = 123;
    let period_id: Field = 2025;

    retirement_nullifiers[0] = 0;
    retirement_volumes[0] = 10000;
    let root = merkle::verify_merkle_inclusion(retirement_nullifiers[0], nullifier_paths[0], nullifier_indices[0]);

    let active_count: u32 = 1;

    main(
        retirement_nullifiers,
        retirement_volumes,
        active_count,
        company_secret,
        nullifier_paths,
        nullifier_indices,
        10000,
        period_id,
        poseidon::compute_compliance_nullifier(company_secret, period_id),
        root,
    );
}

#[test(should_fail)]
fn test_fails_below_threshold() {
    let mut retirement_nullifiers: [Field; 50] = [0; 50];
    let mut retirement_volumes: [u64; 50] = [0; 50];
    let mut nullifier_paths: [[Field; 20]; 50] = [[0; 20]; 50];
    let mut nullifier_indices: [[bool; 20]; 50] = [[false; 20]; 50];

    let company_secret: Field = 123;
    let period_id: Field = 2025;

    retirement_nullifiers[0] = 0;
    retirement_volumes[0] = 5000;
    let root = merkle::verify_merkle_inclusion(retirement_nullifiers[0], nullifier_paths[0], nullifier_indices[0]);

    let active_count: u32 = 1;

    main(
        retirement_nullifiers,
        retirement_volumes,
        active_count,
        company_secret,
        nullifier_paths,
        nullifier_indices,
        10000,
        period_id,
        poseidon::compute_compliance_nullifier(company_secret, period_id),
        root,
    );
}

#[test(should_fail)]
fn test_fails_invalid_compliance_nullifier() {
    let mut retirement_nullifiers: [Field; 50] = [0; 50];
    let mut retirement_volumes: [u64; 50] = [0; 50];
    let mut nullifier_paths: [[Field; 20]; 50] = [[0; 20]; 50];
    let mut nullifier_indices: [[bool; 20]; 50] = [[false; 20]; 50];

    let company_secret: Field = 123;
    let period_id: Field = 2025;

    retirement_nullifiers[0] = 0;
    retirement_volumes[0] = 10000;
    let root = merkle::verify_merkle_inclusion(retirement_nullifiers[0], nullifier_paths[0], nullifier_indices[0]);

    let active_count: u32 = 1;

    main(
        retirement_nullifiers,
        retirement_volumes,
        active_count,
        company_secret,
        nullifier_paths,
        nullifier_indices,
        10000,
        period_id,
        999,
        root,
    );
}
