pub fn assert_gte_u32(value: u32, minimum: u32) {
    assert(value >= minimum);
}

pub fn assert_lte_u32(value: u32, maximum: u32) {
    assert(value <= maximum);
}

pub fn assert_gt_u64(value: u64, threshold: u64) {
    assert(value > threshold);
}

pub fn assert_gte_u64(value: u64, threshold: u64) {
    assert(value >= threshold);
}

#[test]
fn test_gte_u32_passes() {
    assert_gte_u32(10, 5);
}

#[test]
fn test_lte_u32_passes() {
    assert_lte_u32(3, 10);
}

#[test]
fn test_gt_u64_passes() {
    assert_gt_u64(100, 0);
}

#[test]
fn test_gte_u64_passes() {
    assert_gte_u64(50, 50);
}
