// NullCarbon — Range Check Assertion Helpers

fn assert_gte_u32(value: u32, minimum: u32, _error_msg: str<N>) {
    assert(value >= minimum, _error_msg);
}

fn assert_lte_u32(value: u32, maximum: u32, _error_msg: str<N>) {
    assert(value <= maximum, _error_msg);
}

fn assert_gt_u64(value: u64, threshold: u64, _error_msg: str<N>) {
    assert(value > threshold, _error_msg);
}

fn assert_gte_u64(value: u64, threshold: u64, _error_msg: str<N>) {
    assert(value >= threshold, _error_msg);
}

#[test]
fn test_gte_u32_passes() {
    assert_gte_u32(10, 5, "should pass");
}

#[test]
fn test_lte_u32_passes() {
    assert_lte_u32(3, 10, "should pass");
}

#[test]
fn test_gt_u64_passes() {
    assert_gt_u64(100, 0, "should pass");
}

#[test]
fn test_gte_u64_passes() {
    assert_gte_u64(50, 50, "should pass");
}
