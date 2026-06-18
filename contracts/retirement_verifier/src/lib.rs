#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, contractclient, symbol_short,
    Address, Bytes, BytesN, Env,
};

/// External client for NullifierRegistry cross-contract calls.
#[contractclient(name = "NullifierClient")]
pub trait NullifierRegistryInterface {
    fn record(env: Env, nullifier: BytesN<32>, caller: Address) -> bool;
}

/// External client for CreditRegistry cross-contract calls.
#[contractclient(name = "CreditClient")]
pub trait CreditRegistryInterface {
    fn burn_on_retirement(env: Env, token_id: u64, owner: Address, nullifier: BytesN<32>);
}

#[contracttype]
#[derive(Clone)]
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
    /// Initialize with verification key and cross-contract addresses. One-time only.
    pub fn initialize(
        env: Env,
        vk: Bytes,
        nullifier_registry: Address,
        credit_registry: Address,
    ) {
        assert!(
            env.storage()
                .instance()
                .get::<_, Bytes>(&symbol_short!("vk"))
                .is_none(),
            "Already initialized"
        );
        env.storage().instance().set(&symbol_short!("vk"), &vk);
        env.storage()
            .instance()
            .set(&symbol_short!("nr_addr"), &nullifier_registry);
        env.storage()
            .instance()
            .set(&symbol_short!("cr_addr"), &credit_registry);
    }

    /// Verify a Noir UltraHonk retirement proof.
    ///
    /// public_inputs layout (136 bytes total):
    ///   [0..32]    nullifier         (BytesN<32>)
    ///   [32..64]   registry_root     (BytesN<32>)
    ///   [64..96]   volume_commitment (BytesN<32>)
    ///   [96..128]  corridor_id       (BytesN<32>)
    ///   [128..132] min_vintage_year  (u32 big-endian)
    ///   [132..136] min_permanence    (u32 big-endian)
    pub fn verify_retirement(
        env: Env,
        proof: Bytes,
        public_inputs: Bytes,
        token_id: u64,
        owner: Address,
    ) -> bool {
        // --- Decode public inputs ---
        let nullifier: BytesN<32> = public_inputs.slice(0..32).try_into().unwrap();
        let registry_root: BytesN<32> = public_inputs.slice(32..64).try_into().unwrap();
        let volume_commitment: BytesN<32> = public_inputs.slice(64..96).try_into().unwrap();
        let corridor_id: BytesN<32> = public_inputs.slice(96..128).try_into().unwrap();
        let min_vintage_year = Self::read_u32(&public_inputs, 128);
        let min_permanence = Self::read_u32(&public_inputs, 132);

        // --- Verify proof ---
        // test_mode: bypass BN254 verification (no real circuit artifacts in dev)
        // Production: replace with env.crypto().verify_groth16_bn254(...)
        //             once Protocol 26 BN254 host functions ship in soroban-sdk.
        let test_mode: bool = env
            .storage()
            .instance()
            .get(&symbol_short!("test"))
            .unwrap_or(false);

        let is_valid = if test_mode {
            !proof.is_empty()
        } else {
            // TODO: swap to env.crypto().verify_groth16_bn254(&vk, &public_inputs, &proof)
            //       when soroban-sdk exposes BN254 host functions.
            let _vk: Bytes = env
                .storage()
                .instance()
                .get(&symbol_short!("vk"))
                .expect("Not initialized");
            false
        };

        if !is_valid {
            return false;
        }

        // --- Record nullifier (cross-contract) ---
        let nr_addr: Address = env
            .storage()
            .instance()
            .get(&symbol_short!("nr_addr"))
            .expect("NullifierRegistry not set");

        let nr_client = NullifierClient::new(&env, &nr_addr);
        if !nr_client.record(&nullifier, &env.current_contract_address()) {
            return false; // nullifier already used
        }

        // --- Burn credit token (cross-contract) ---
        let cr_addr: Address = env
            .storage()
            .instance()
            .get(&symbol_short!("cr_addr"))
            .expect("CreditRegistry not set");

        let cr_client = CreditClient::new(&env, &cr_addr);
        cr_client.burn_on_retirement(&token_id, &owner, &nullifier);

        // --- Persist record ---
        let record = RetirementRecord {
            nullifier: nullifier.clone(),
            registry_root,
            volume_commitment: volume_commitment.clone(),
            corridor_id: corridor_id.clone(),
            min_vintage_year,
            min_permanence,
            timestamp: env.ledger().timestamp(),
        };
        env.storage().persistent().set(&nullifier, &record);

        env.events().publish(
            (symbol_short!("retired"),),
            (nullifier, volume_commitment, corridor_id),
        );

        true
    }

    pub fn get_retirement(env: Env, nullifier: BytesN<32>) -> Option<RetirementRecord> {
        env.storage().persistent().get(&nullifier)
    }

    pub fn get_vk(env: Env) -> Bytes {
        env.storage()
            .instance()
            .get(&symbol_short!("vk"))
            .expect("Not initialized")
    }

    /// Enable test mode — accepts any non-empty proof, skipping BN254.
    pub fn set_test_mode(env: Env, enabled: bool) {
        env.storage()
            .instance()
            .set(&symbol_short!("test"), &enabled);
    }

    fn read_u32(bytes: &Bytes, offset: u32) -> u32 {
        let b0 = bytes.get(offset).unwrap_or(0) as u32;
        let b1 = bytes.get(offset + 1).unwrap_or(0) as u32;
        let b2 = bytes.get(offset + 2).unwrap_or(0) as u32;
        let b3 = bytes.get(offset + 3).unwrap_or(0) as u32;
        (b0 << 24) | (b1 << 16) | (b2 << 8) | b3
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Bytes, BytesN, Env};
    use nullifier_registry::NullifierRegistry;
    use credit_registry::CreditRegistry;

    fn make_public_inputs(env: &Env) -> Bytes {
        let mut raw = [0u8; 136];
        raw[0..32].fill(1);   // nullifier
        raw[32..64].fill(2);  // registry_root
        raw[64..96].fill(3);  // volume_commitment
        raw[96..128].fill(4); // corridor_id
        raw[128..132].copy_from_slice(&2020u32.to_be_bytes());
        raw[132..136].copy_from_slice(&70u32.to_be_bytes());
        Bytes::from_slice(env, &raw)
    }

    /// Returns (rv_id, owner)
    fn setup_all(env: &Env) -> (Address, Address) {
        env.mock_all_auths();

        let nr_id = env.register_contract(None, NullifierRegistry);
        let nr_client = nullifier_registry::NullifierRegistryClient::new(env, &nr_id);

        let cr_id = env.register_contract(None, CreditRegistry);
        let cr_client = credit_registry::CreditRegistryClient::new(env, &cr_id);

        let rv_id = env.register_contract(None, RetirementVerifier);
        let rv_client = RetirementVerifierClient::new(env, &rv_id);

        let admin = Address::generate(env);
        cr_client.initialize(&admin);
        nr_client.initialize(&rv_id);

        let vk = Bytes::from_slice(env, &[0u8; 64]);
        rv_client.initialize(&vk, &nr_id, &cr_id);
        rv_client.set_test_mode(&true);

        cr_client.set_verifier(&rv_id);

        let owner = Address::generate(env);
        cr_client.issue_credit(
            &owner,
            &BytesN::from_array(env, &[1u8; 32]),
            &1u32,
            &2022u32,
            &1u32,
            &91u32,
            &3000u64,
        );

        (rv_id, owner)
    }

    #[test]
    fn test_valid_proof_accepted() {
        let env = Env::default();
        let (rv_id, owner) = setup_all(&env);
        let rv_client = RetirementVerifierClient::new(&env, &rv_id);

        let proof = Bytes::from_slice(&env, &[0xaa; 32]);
        let public_inputs = make_public_inputs(&env);

        assert!(rv_client.verify_retirement(&proof, &public_inputs, &1u64, &owner));
        let nullifier = BytesN::from_array(&env, &[1u8; 32]);
        assert!(rv_client.get_retirement(&nullifier).is_some());
    }

    #[test]
    fn test_duplicate_nullifier_rejected() {
        let env = Env::default();
        let (rv_id, owner) = setup_all(&env);
        let rv_client = RetirementVerifierClient::new(&env, &rv_id);

        let proof = Bytes::from_slice(&env, &[0xaa; 32]);
        let public_inputs = make_public_inputs(&env);

        assert!(rv_client.verify_retirement(&proof, &public_inputs, &1u64, &owner));
        // Same nullifier → false
        assert!(!rv_client.verify_retirement(&proof, &public_inputs, &1u64, &owner));
    }

    #[test]
    fn test_empty_proof_rejected_in_test_mode() {
        let env = Env::default();
        let (rv_id, owner) = setup_all(&env);
        let rv_client = RetirementVerifierClient::new(&env, &rv_id);

        let empty_proof = Bytes::from_slice(&env, &[]);
        let public_inputs = make_public_inputs(&env);

        assert!(!rv_client.verify_retirement(&empty_proof, &public_inputs, &1u64, &owner));
    }
}
