use dep::std::hash::poseidon2::Poseidon2;

pub fn verify_merkle_inclusion(leaf: Field, path: [Field; 20], indices: [u1; 20]) -> Field {
    let mut computed = leaf;
    for i in 0..20 {
        let sibling = path[i];
        if indices[i] == 0 {
            computed = Poseidon2::hash([computed, sibling], 2);
        } else {
            computed = Poseidon2::hash([sibling, computed], 2);
        }
    }
    computed
}

pub fn compute_leaf_hash(credit_id: Field, vintage: u32, volume: u64, methodology: u32) -> Field {
    Poseidon2::hash([credit_id, vintage as Field, volume as Field, methodology as Field], 4)
}

pub fn compute_methodology_leaf(methodology_code: Field, standard_id: Field) -> Field {
    Poseidon2::hash([methodology_code, standard_id], 2)
}

#[test]
fn test_methodology_leaf_consistency() {
    let l1 = compute_methodology_leaf(1, 1);
    let l2 = compute_methodology_leaf(1, 1);
    assert(l1 == l2);
}

#[test]
fn test_methodology_leaf_different() {
    let l1 = compute_methodology_leaf(1, 1);
    let l2 = compute_methodology_leaf(2, 1);
    assert(l1 != l2);
}

#[test]
fn test_merkle_inclusion_identity_path() {
    let leaf: Field = 0;
    let path: [Field; 20] = [0; 20];
    let indices: [u1; 20] = [0; 20];
    let computed_root = verify_merkle_inclusion(leaf, path, indices);
    assert(computed_root != leaf);
}

#[test]
fn test_leaf_hash_consistency() {
    let h1 = compute_leaf_hash(1, 2022, 3000, 1);
    let h2 = compute_leaf_hash(1, 2022, 3000, 1);
    assert(h1 == h2);
}

#[test]
fn test_leaf_hash_different() {
    let h1 = compute_leaf_hash(1, 2022, 3000, 1);
    let h2 = compute_leaf_hash(2, 2023, 5000, 2);
    assert(h1 != h2);
}
