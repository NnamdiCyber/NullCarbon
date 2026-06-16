// NullCarbon — Vintage Proof Circuit
// Proves: "This credit meets quality requirements for a specific retirement corridor."

mod utils;

use crate::utils::merkle;
use crate::utils::poseidon;
use crate::utils::range;

fn main(
    // Private inputs
    vintage_year: u32,
    methodology_code: u32,
    co_benefits_score: u32,
    additionality_rating: u32,
    leakage_factor: u32,

    // Public inputs
    pub standard_id: u32,
    pub min_vintage: u32,
    pub min_co_benefits: u32,
    pub max_leakage: u32,
    pub approved_methodologies_root: Field,
) {
    // 1. Assert vintage year meets minimum
    range::assert_gte_u32(vintage_year, min_vintage, "Vintage year below standard minimum");

    // 2. Assert co-benefits score meets minimum
    range::assert_gte_u32(co_benefits_score, min_co_benefits, "Co-benefits score insufficient");

    // 3. Assert leakage factor within limit
    range::assert_lte_u32(leakage_factor, max_leakage, "Leakage factor too high");

    // 4. Assert additionality is positive
    assert(additionality_rating > 0, "Credit lacks additionality");
}
