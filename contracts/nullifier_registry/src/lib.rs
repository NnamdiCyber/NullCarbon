#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Address, BytesN, Env};

#[contract]
pub struct NullifierRegistry;

#[contractimpl]
impl NullifierRegistry {
    pub fn initialize(env: Env, authorized_verifier: Address) {
        let prev: Option<Address> = env
            .storage()
            .instance()
            .get(&symbol_short!("verifier"));
        assert!(prev.is_none(), "Already initialized");
        env.storage()
            .instance()
            .set(&symbol_short!("verifier"), &authorized_verifier);
    }

    pub fn record(env: Env, nullifier: BytesN<32>, caller: Address) -> bool {
        let authorized_verifier: Address = env
            .storage()
            .instance()
            .get(&symbol_short!("verifier"))
            .unwrap();
        assert_eq!(caller, authorized_verifier, "Unauthorized caller");

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

        env.events().publish((symbol_short!("nullified"),), nullifier);

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
            .unwrap()
    }
}
