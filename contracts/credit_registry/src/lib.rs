#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, BytesN, Env};

#[contracttype]
#[derive(Clone)]
pub struct CreditMetadata {
    pub credit_hash: BytesN<32>,
    pub registry_id: u32,
    pub vintage_year: u32,
    pub methodology_code: u32,
    pub permanence_rating: u32,
    pub tonne_volume: u64,
    pub owner: Address,
    pub is_retired: bool,
    pub issued_at: u64,
    pub retired_at: u64,
    pub nullifier: BytesN<32>,
}

#[contract]
pub struct CreditRegistry;

#[contractimpl]
impl CreditRegistry {
    pub fn initialize(env: Env, admin: Address) {
        assert!(
            env.storage()
                .instance()
                .get::<_, Address>(&symbol_short!("admin"))
                .is_none(),
            "Already initialized"
        );
        env.storage()
            .instance()
            .set(&symbol_short!("admin"), &admin);
        env.storage()
            .instance()
            .set(&symbol_short!("cnt"), &0u64);
    }

    pub fn issue_credit(
        env: Env,
        to: Address,
        credit_hash: BytesN<32>,
        registry_id: u32,
        vintage_year: u32,
        methodology_code: u32,
        permanence_rating: u32,
        tonne_volume: u64,
    ) -> u64 {
        let admin: Address = env
            .storage()
            .instance()
            .get(&symbol_short!("admin"))
            .expect("Not initialized");
        admin.require_auth();

        let count: u64 = env
            .storage()
            .instance()
            .get(&symbol_short!("cnt"))
            .unwrap_or(0);
        let token_id = count + 1;

        let metadata = CreditMetadata {
            credit_hash,
            registry_id,
            vintage_year,
            methodology_code,
            permanence_rating,
            tonne_volume,
            owner: to.clone(),
            is_retired: false,
            issued_at: env.ledger().timestamp(),
            retired_at: 0,
            nullifier: BytesN::from_array(&env, &[0u8; 32]),
        };

        env.storage().persistent().set(&token_id, &metadata);
        env.storage()
            .instance()
            .set(&symbol_short!("cnt"), &token_id);

        env.events()
            .publish((symbol_short!("issued"),), (token_id, to));

        token_id
    }

    pub fn transfer_credit(env: Env, token_id: u64, from: Address, to: Address) {
        from.require_auth();

        let mut metadata: CreditMetadata = env
            .storage()
            .persistent()
            .get(&token_id)
            .expect("Credit not found");

        assert!(metadata.owner == from, "Not the token owner");
        assert!(!metadata.is_retired, "Credit is already retired");

        metadata.owner = to.clone();
        env.storage().persistent().set(&token_id, &metadata);

        env.events()
            .publish((symbol_short!("xfer"),), (token_id, from, to));
    }

    pub fn burn_on_retirement(
        env: Env,
        token_id: u64,
        owner: Address,
        nullifier: BytesN<32>,
    ) {
        let verifier: Address = env
            .storage()
            .instance()
            .get(&symbol_short!("verifier"))
            .expect("Verifier not set");
        verifier.require_auth();

        let mut metadata: CreditMetadata = env
            .storage()
            .persistent()
            .get(&token_id)
            .expect("Credit not found");

        assert!(!metadata.is_retired, "Credit is already retired");
        assert!(metadata.owner == owner, "Owner mismatch");

        metadata.is_retired = true;
        metadata.retired_at = env.ledger().timestamp();
        metadata.nullifier = nullifier.clone();
        env.storage().persistent().set(&token_id, &metadata);

        env.events()
            .publish((symbol_short!("burned"),), (token_id, nullifier));
    }

    pub fn get_credit(env: Env, token_id: u64) -> CreditMetadata {
        env.storage()
            .persistent()
            .get(&token_id)
            .expect("Credit not found")
    }

    pub fn is_retired(env: Env, token_id: u64) -> bool {
        let metadata: CreditMetadata = env
            .storage()
            .persistent()
            .get(&token_id)
            .expect("Credit not found");
        metadata.is_retired
    }

    pub fn set_verifier(env: Env, verifier: Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&symbol_short!("admin"))
            .expect("Not initialized");
        admin.require_auth();
        env.storage()
            .instance()
            .set(&symbol_short!("verifier"), &verifier);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, BytesN, Env};

    fn setup() -> (Env, Address, Address) {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, CreditRegistry);
        let admin = Address::generate(&env);
        let client = CreditRegistryClient::new(&env, &contract_id);
        client.initialize(&admin);
        (env, contract_id, admin)
    }

    fn issue_test_credit(
        env: &Env,
        client: &CreditRegistryClient,
        owner: &Address,
    ) -> u64 {
        client.issue_credit(
            owner,
            &BytesN::from_array(env, &[1u8; 32]),
            &1u32,
            &2022u32,
            &1u32,
            &91u32,
            &3000u64,
        )
    }

    #[test]
    fn test_issue_credit() {
        let (env, contract_id, _admin) = setup();
        let client = CreditRegistryClient::new(&env, &contract_id);
        let owner = Address::generate(&env);
        let token_id = issue_test_credit(&env, &client, &owner);
        assert_eq!(token_id, 1);
        let credit = client.get_credit(&token_id);
        assert_eq!(credit.owner, owner);
        assert!(!credit.is_retired);
    }

    #[test]
    fn test_transfer_happy_path() {
        let (env, contract_id, _admin) = setup();
        let client = CreditRegistryClient::new(&env, &contract_id);
        let owner = Address::generate(&env);
        let buyer = Address::generate(&env);
        let token_id = issue_test_credit(&env, &client, &owner);
        client.transfer_credit(&token_id, &owner, &buyer);
        let credit = client.get_credit(&token_id);
        assert_eq!(credit.owner, buyer);
    }

    #[test]
    fn test_burn_happy_path() {
        let (env, contract_id, _admin) = setup();
        let client = CreditRegistryClient::new(&env, &contract_id);
        let verifier = Address::generate(&env);
        client.set_verifier(&verifier);
        let owner = Address::generate(&env);
        let token_id = issue_test_credit(&env, &client, &owner);
        let nullifier = BytesN::from_array(&env, &[9u8; 32]);
        client.burn_on_retirement(&token_id, &owner, &nullifier);
        assert!(client.is_retired(&token_id));
    }

    #[test]
    #[should_panic(expected = "Credit is already retired")]
    fn test_burn_already_retired() {
        let (env, contract_id, _admin) = setup();
        let client = CreditRegistryClient::new(&env, &contract_id);
        let verifier = Address::generate(&env);
        client.set_verifier(&verifier);
        let owner = Address::generate(&env);
        let token_id = issue_test_credit(&env, &client, &owner);
        let nullifier = BytesN::from_array(&env, &[9u8; 32]);
        client.burn_on_retirement(&token_id, &owner, &nullifier);
        client.burn_on_retirement(&token_id, &owner, &nullifier);
    }

    #[test]
    fn test_get_credit() {
        let (env, contract_id, _admin) = setup();
        let client = CreditRegistryClient::new(&env, &contract_id);
        let owner = Address::generate(&env);
        let token_id = issue_test_credit(&env, &client, &owner);
        let credit = client.get_credit(&token_id);
        assert_eq!(credit.tonne_volume, 3000);
        assert_eq!(credit.vintage_year, 2022);
    }
}
