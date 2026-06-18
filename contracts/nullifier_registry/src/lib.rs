#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Address, BytesN, Env};

#[contract]
pub struct NullifierRegistry;

#[contractimpl]
impl NullifierRegistry {
    /// Initialize with the authorized verifier. Can only be called once.
    pub fn initialize(env: Env, authorized_verifier: Address) {
        assert!(
            env.storage()
                .instance()
                .get::<_, Address>(&symbol_short!("verifier"))
                .is_none(),
            "Already initialized"
        );
        env.storage()
            .instance()
            .set(&symbol_short!("verifier"), &authorized_verifier);
        env.storage()
            .instance()
            .set(&symbol_short!("count"), &0u64);
    }

    /// Record a nullifier. Returns false if already recorded.
    /// Caller must be the authorized verifier.
    pub fn record(env: Env, nullifier: BytesN<32>, caller: Address) -> bool {
        let authorized: Address = env
            .storage()
            .instance()
            .get(&symbol_short!("verifier"))
            .expect("Not initialized");
        assert!(caller == authorized, "Unauthorized caller");

        if env.storage().persistent().has(&nullifier) {
            return false;
        }

        env.storage().persistent().set(&nullifier, &true);

        let count: u64 = env
            .storage()
            .instance()
            .get(&symbol_short!("count"))
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&symbol_short!("count"), &(count + 1));

        env.events()
            .publish((symbol_short!("nullified"),), nullifier);

        true
    }

    pub fn is_used(env: Env, nullifier: BytesN<32>) -> bool {
        env.storage().persistent().has(&nullifier)
    }

    pub fn count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&symbol_short!("count"))
            .unwrap_or(0)
    }

    pub fn get_authorized_verifier(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&symbol_short!("verifier"))
            .expect("Not initialized")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env};

    fn setup() -> (Env, Address, Address) {
        let env = Env::default();
        let contract_id = env.register_contract(None, NullifierRegistry);
        let verifier = Address::generate(&env);
        let client = NullifierRegistryClient::new(&env, &contract_id);
        client.initialize(&verifier);
        (env, contract_id, verifier)
    }

    #[test]
    fn test_record_success() {
        let (env, contract_id, verifier) = setup();
        let client = NullifierRegistryClient::new(&env, &contract_id);
        let nullifier = BytesN::from_array(&env, &[1u8; 32]);
        assert!(client.record(&nullifier, &verifier));
        assert!(client.is_used(&nullifier));
        assert_eq!(client.count(), 1);
    }

    #[test]
    fn test_duplicate_rejected() {
        let (env, contract_id, verifier) = setup();
        let client = NullifierRegistryClient::new(&env, &contract_id);
        let nullifier = BytesN::from_array(&env, &[2u8; 32]);
        assert!(client.record(&nullifier, &verifier));
        assert!(!client.record(&nullifier, &verifier));
        assert_eq!(client.count(), 1);
    }

    #[test]
    #[should_panic(expected = "Unauthorized caller")]
    fn test_unauthorized_rejected() {
        let (env, contract_id, _verifier) = setup();
        let client = NullifierRegistryClient::new(&env, &contract_id);
        let nullifier = BytesN::from_array(&env, &[3u8; 32]);
        let bad_caller = Address::generate(&env);
        client.record(&nullifier, &bad_caller);
    }

    #[test]
    fn test_is_used_before_after() {
        let (env, contract_id, verifier) = setup();
        let client = NullifierRegistryClient::new(&env, &contract_id);
        let nullifier = BytesN::from_array(&env, &[4u8; 32]);
        assert!(!client.is_used(&nullifier));
        client.record(&nullifier, &verifier);
        assert!(client.is_used(&nullifier));
    }

    #[test]
    fn test_count_increments() {
        let (env, contract_id, verifier) = setup();
        let client = NullifierRegistryClient::new(&env, &contract_id);
        assert_eq!(client.count(), 0);
        client.record(&BytesN::from_array(&env, &[10u8; 32]), &verifier);
        assert_eq!(client.count(), 1);
        client.record(&BytesN::from_array(&env, &[11u8; 32]), &verifier);
        assert_eq!(client.count(), 2);
    }

    #[test]
    #[should_panic(expected = "Already initialized")]
    fn test_double_initialize() {
        let env = Env::default();
        let contract_id = env.register_contract(None, NullifierRegistry);
        let client = NullifierRegistryClient::new(&env, &contract_id);
        let v = Address::generate(&env);
        client.initialize(&v);
        client.initialize(&v);
    }
}
