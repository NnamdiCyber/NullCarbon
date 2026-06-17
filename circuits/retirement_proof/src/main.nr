use dep::utils::merkle;
use dep::utils::poseidon;
use dep::utils::range;

fn main(
    credit_id: Field,
    credit_secret: Field,
    credit_hash: Field,
    vintage_year: u32,
    methodology_code: u32,
    permanence_rating: u32,
    tonne_volume: u64,
    merkle_path: [Field; 20],
    merkle_indices: [u1; 20],
    nullifier: Field,
    registry_merkle_root: Field,
    min_vintage_year: u32,
    min_permanence: u32,
    volume_commitment: Field,
    corridor_id: Field,
) {
    let computed_leaf = merkle::compute_leaf_hash(credit_id, vintage_year, tonne_volume, methodology_code);
    assert(computed_leaf == credit_hash);

    let computed_root = merkle::verify_merkle_inclusion(credit_hash, merkle_path, merkle_indices);
    assert(computed_root == registry_merkle_root);

    range::assert_gte_u32(vintage_year, min_vintage_year);
    range::assert_gte_u32(permanence_rating, min_permanence);

    let computed_nullifier = poseidon::compute_retirement_nullifier(credit_secret, credit_id, corridor_id);
    assert(computed_nullifier == nullifier);

    let computed_commitment = poseidon::compute_volume_commitment(tonne_volume, credit_secret);
    assert(computed_commitment == volume_commitment);

    assert(tonne_volume > 0);
}

#[test]
fn test_happy_path() {
    let credit_id: Field = 1;
    let credit_secret: Field = 42;
    let vintage_year: u32 = 2022;
    let methodology_code: u32 = 1;
    let tonne_volume: u64 = 3000;
    let permanence_rating: u32 = 91;

    let credit_hash = merkle::compute_leaf_hash(credit_id, vintage_year, tonne_volume, methodology_code);

    let merkle_path: [Field; 20] = [0; 20];
    let merkle_indices: [u1; 20] = [0; 20];
    let root = merkle::verify_merkle_inclusion(credit_hash, merkle_path, merkle_indices);

    let corridor_id: Field = 1;
    let nullifier = poseidon::compute_retirement_nullifier(credit_secret, credit_id, corridor_id);
    let volume_commitment = poseidon::compute_volume_commitment(tonne_volume, credit_secret);

    main(
        credit_id,
        credit_secret,
        credit_hash,
        vintage_year,
        methodology_code,
        permanence_rating,
        tonne_volume,
        merkle_path,
        merkle_indices,
        nullifier,
        root,
        2020,
        70,
        volume_commitment,
        corridor_id,
    );
}

#[test(should_fail)]
fn test_fails_expired_vintage() {
    let credit_id: Field = 1;
    let credit_secret: Field = 42;
    let vintage_year: u32 = 2015;
    let methodology_code: u32 = 1;
    let tonne_volume: u64 = 3000;
    let permanence_rating: u32 = 91;

    let credit_hash = merkle::compute_leaf_hash(credit_id, vintage_year, tonne_volume, methodology_code);

    let merkle_path: [Field; 20] = [0; 20];
    let merkle_indices: [u1; 20] = [0; 20];
    let root = merkle::verify_merkle_inclusion(credit_hash, merkle_path, merkle_indices);

    let corridor_id: Field = 1;
    let nullifier = poseidon::compute_retirement_nullifier(credit_secret, credit_id, corridor_id);
    let volume_commitment = poseidon::compute_volume_commitment(tonne_volume, credit_secret);

    main(
        credit_id,
        credit_secret,
        credit_hash,
        vintage_year,
        methodology_code,
        permanence_rating,
        tonne_volume,
        merkle_path,
        merkle_indices,
        nullifier,
        root,
        2020,
        70,
        volume_commitment,
        corridor_id,
    );
}

#[test(should_fail)]
fn test_fails_invalid_nullifier() {
    let credit_id: Field = 1;
    let credit_secret: Field = 42;
    let vintage_year: u32 = 2022;
    let methodology_code: u32 = 1;
    let tonne_volume: u64 = 3000;
    let permanence_rating: u32 = 91;

    let credit_hash = merkle::compute_leaf_hash(credit_id, vintage_year, tonne_volume, methodology_code);

    let merkle_path: [Field; 20] = [0; 20];
    let merkle_indices: [u1; 20] = [0; 20];
    let root = merkle::verify_merkle_inclusion(credit_hash, merkle_path, merkle_indices);

    let volume_commitment = poseidon::compute_volume_commitment(tonne_volume, credit_secret);

    main(
        credit_id,
        credit_secret,
        credit_hash,
        vintage_year,
        methodology_code,
        permanence_rating,
        tonne_volume,
        merkle_path,
        merkle_indices,
        999,
        root,
        2020,
        70,
        volume_commitment,
        1,
    );
}
