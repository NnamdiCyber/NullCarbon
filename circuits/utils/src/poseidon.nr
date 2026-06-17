use dep::std::hash::poseidon2::Poseidon2;

pub fn compute_retirement_nullifier(credit_secret: Field, credit_id: Field, corridor_id: Field) -> Field {
    Poseidon2::hash([credit_secret, credit_id, corridor_id], 3)
}

pub fn compute_compliance_nullifier(company_secret: Field, period_id: Field) -> Field {
    Poseidon2::hash([company_secret, period_id], 2)
}

pub fn compute_volume_commitment(tonne_volume: u64, credit_secret: Field) -> Field {
    Poseidon2::hash([tonne_volume as Field, credit_secret], 2)
}

#[test]
fn test_retirement_nullifier_consistency() {
    let n1 = compute_retirement_nullifier(1, 2, 3);
    let n2 = compute_retirement_nullifier(1, 2, 3);
    assert(n1 == n2);
}

#[test]
fn test_compliance_nullifier_consistency() {
    let n1 = compute_compliance_nullifier(42, 2025);
    let n2 = compute_compliance_nullifier(42, 2025);
    assert(n1 == n2);
}

#[test]
fn test_volume_commitment_consistency() {
    let c1 = compute_volume_commitment(3000, 99);
    let c2 = compute_volume_commitment(3000, 99);
    assert(c1 == c2);
}
