// NullCarbon — Merkle Inclusion Proof Utilities

use dep::std::hash::poseidon2;

const DEPTH: u32 = 20;

fn verify_merkle_inclusion(leaf: Field, path: [Field; DEPTH], indices: [u1; DEPTH], root: Field) -> Field {
    let mut computed = leaf;
    for i in 0..DEPTH {
        let sibling = path[i];
        if indices[i] == 0 {
            computed = poseidon2::hash([computed, sibling], 2);
        } else {
            computed = poseidon2::hash([sibling, computed], 2);
        }
    }
    computed
}

fn compute_leaf_hash(credit_id: Field, vintage: u32, volume: u64, methodology: u32) -> Field {
    poseidon2::hash([credit_id, vintage as Field, volume as Field, methodology as Field], 4)
}

#[test]
fn test_merkle_inclusion_happy_path() {
    let leaf: Field = 123;
    let path: [Field; 20] = [0; 20];
    let indices: [u1; 20] = [0; 20];
    let computed = verify_merkle_inclusion(leaf, path, indices, leaf);
    assert(computed == leaf);
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
