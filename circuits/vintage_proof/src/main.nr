use utils::merkle;
use utils::range;

fn main(
    vintage_year: u32,
    methodology_code: u32,
    co_benefits_score: u32,
    additionality_rating: u32,
    leakage_factor: u32,
    merkle_path: [Field; 20],
    merkle_indices: [bool; 20],
    standard_id: u32,
    min_vintage: u32,
    min_co_benefits: u32,
    max_leakage: u32,
    approved_methodologies_root: Field,
) {
    range::assert_gte_u32(vintage_year, min_vintage);
    range::assert_gte_u32(co_benefits_score, min_co_benefits);
    range::assert_lte_u32(leakage_factor, max_leakage);

    assert(additionality_rating > 0);

    let methodology_leaf = merkle::compute_methodology_leaf(methodology_code as Field, standard_id as Field);
    let computed_root = merkle::verify_merkle_inclusion(methodology_leaf, merkle_path, merkle_indices);
    assert(computed_root == approved_methodologies_root);
}

#[test]
fn test_happy_path_corsia() {
    let methodology_code: u32 = 1;
    let standard_id: u32 = 1;

    let methodology_leaf = merkle::compute_methodology_leaf(methodology_code as Field, standard_id as Field);
    let path: [Field; 20] = [0; 20];
    let indices: [bool; 20] = [false; 20];
    let root = merkle::verify_merkle_inclusion(methodology_leaf, path, indices);

    main(
        2022,
        methodology_code,
        85,
        4,
        12,
        path,
        indices,
        standard_id,
        2016,
        60,
        30,
        root,
    );
}

#[test(should_fail)]
fn test_fails_low_co_benefits() {
    let methodology_code: u32 = 1;
    let standard_id: u32 = 1;

    let methodology_leaf = merkle::compute_methodology_leaf(methodology_code as Field, standard_id as Field);
    let path: [Field; 20] = [0; 20];
    let indices: [bool; 20] = [false; 20];
    let root = merkle::verify_merkle_inclusion(methodology_leaf, path, indices);

    main(
        2022,
        methodology_code,
        30,
        4,
        12,
        path,
        indices,
        standard_id,
        2016,
        60,
        30,
        root,
    );
}

#[test(should_fail)]
fn test_fails_excessive_leakage() {
    let methodology_code: u32 = 1;
    let standard_id: u32 = 1;

    let methodology_leaf = merkle::compute_methodology_leaf(methodology_code as Field, standard_id as Field);
    let path: [Field; 20] = [0; 20];
    let indices: [bool; 20] = [false; 20];
    let root = merkle::verify_merkle_inclusion(methodology_leaf, path, indices);

    main(
        2022,
        methodology_code,
        85,
        4,
        50,
        path,
        indices,
        standard_id,
        2016,
        60,
        30,
        root,
    );
}
