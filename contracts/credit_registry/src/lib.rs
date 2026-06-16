#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, BytesN, Env};

#[contracttype]
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
        env.storage().instance().set(&symbol_short!("admin"), &admin);
        env.storage().instance().set(&symbol_short!("cnt"), &0u64);
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
        let admin: Address = env.storage().instance().get(&symbol_short!("admin")).unwrap();
        assert_eq!(env.current_contract_address(), admin, "Only admin can issue credits");

        let count: u64 = env.storage().instance().get(&symbol_short!("cnt")).unwrap();
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
        env.storage().instance().set(&symbol_short!("cnt"), &token_id);

        env.events().publish(
            (symbol_short!("issued"),),
            (token_id, to),
        );

        token_id
    }

    pub fn transfer_credit(env: Env, token_id: u64, from: Address, to: Address) {
        from.require_auth();

        let mut metadata: CreditMetadata = env
            .storage()
            .persistent()
            .get(&token_id)
            .unwrap();

        assert_eq!(metadata.owner, from, "Not the token owner");
        assert!(!metadata.is_retired, "Credit is already retired");

        metadata.owner = to.clone();
        env.storage().persistent().set(&token_id, &metadata);

        env.events().publish(
            (symbol_short!("xfer"),),
            (token_id, from, to),
        );
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
            .unwrap();
        assert_eq!(
            env.current_contract_address(),
            verifier,
            "Only the RetirementVerifier can burn credits"
        );

        let mut metadata: CreditMetadata = env
            .storage()
            .persistent()
            .get(&token_id)
            .unwrap();

        assert!(!metadata.is_retired, "Credit is already retired");
        assert_eq!(metadata.owner, owner, "Owner mismatch");

        metadata.is_retired = true;
        metadata.retired_at = env.ledger().timestamp();
        metadata.nullifier = nullifier.clone();
        env.storage().persistent().set(&token_id, &metadata);

        env.events().publish(
            (symbol_short!("burned"),),
            (token_id, nullifier),
        );
    }

    pub fn get_credit(env: Env, token_id: u64) -> CreditMetadata {
        env.storage().persistent().get(&token_id).unwrap()
    }

    pub fn is_retired(env: Env, token_id: u64) -> bool {
        let metadata: CreditMetadata = env.storage().persistent().get(&token_id).unwrap();
        metadata.is_retired
    }

    pub fn set_verifier(env: Env, verifier: Address) {
        let admin: Address = env.storage().instance().get(&symbol_short!("admin")).unwrap();
        assert_eq!(env.current_contract_address(), admin, "Only admin can set verifier");
        env.storage()
            .instance()
            .set(&symbol_short!("verifier"), &verifier);
    }
}
