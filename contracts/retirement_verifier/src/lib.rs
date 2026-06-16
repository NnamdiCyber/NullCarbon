#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Bytes, BytesN, Env, String};

#[contracttype]
pub struct RetirementRecord {
    pub nullifier: BytesN<32>,
    pub registry_root: BytesN<32>,
    pub volume_commitment: BytesN<32>,
    pub corridor_id: BytesN<32>,
    pub min_vintage_year: u32,
    pub min_permanence: u32,
    pub timestamp: u64,
}

#[contract]
pub struct RetirementVerifier;

#[contractimpl]
impl RetirementVerifier {
    pub fn initialize(
        env: Env,
        vk: Bytes,
        nullifier_registry: Address,
        credit_registry: Address,
    ) {
        env.storage().instance().set(&symbol_short!("vk"), &vk);
        env.storage()
            .instance()
            .set(&symbol_short!("nr_addr"), &nullifier_registry);
        env.storage()
            .instance()
            .set(&symbol_short!("cr_addr"), &credit_registry);
    }

    pub fn verify_retirement(
        env: Env,
        proof: Bytes,
        public_inputs: Bytes,
        token_id: u64,
        owner: Address,
    ) -> bool {
        let vk: Bytes = env.storage().instance().get(&symbol_short!("vk")).unwrap();

        let nullifier: BytesN<32> = public_inputs.slice(0..32).try_into().unwrap();
        let registry_root: BytesN<32> = public_inputs.slice(32..64).try_into().unwrap();
        let volume_commitment: BytesN<32> = public_inputs.slice(64..96).try_into().unwrap();
        let corridor_id: BytesN<32> = public_inputs.slice(96..128).try_into().unwrap();

        let is_valid = env.crypto().verify_groth16_bn254(&vk, &public_inputs, &proof);

        if is_valid {
            let record = RetirementRecord {
                nullifier: nullifier.clone(),
                registry_root,
                volume_commitment,
                corridor_id,
                min_vintage_year: 0,
                min_permanence: 0,
                timestamp: env.ledger().timestamp(),
            };

            env.storage()
                .persistent()
                .set(&nullifier, &record);

            env.events().publish(
                (symbol_short!("retired"),),
                (nullifier, volume_commitment, corridor_id),
            );
        }

        is_valid
    }

    pub fn get_retirement(env: Env, nullifier: BytesN<32>) -> Option<RetirementRecord> {
        env.storage().persistent().get(&nullifier)
    }

    pub fn get_vk(env: Env) -> Bytes {
        env.storage().instance().get(&symbol_short!("vk")).unwrap()
    }
}
