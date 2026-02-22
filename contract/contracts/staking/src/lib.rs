use soroban_sdk::{contract, contractimpl, Env, Address};
use common::{types::StakeId, storage_keys::*};

#[contract]
pub struct Staking;

#[contractimpl]
impl Staking {
    pub fn stake(env: Env, user: Address, stake_id: StakeId, amount: i128) {
        let key = format!("{}{}", STAKE_INFO, stake_id.0);
        env.storage().set(&key, &amount);
    }

    pub fn unstake(env: Env, user: Address, stake_id: StakeId) {
        let key = format!("{}{}", STAKE_INFO, stake_id.0);
        env.storage().remove(&key);
    }
}
