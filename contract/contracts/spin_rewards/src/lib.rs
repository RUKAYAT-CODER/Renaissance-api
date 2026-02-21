#![no_std]

use soroban_sdk::{contract, contractimpl, Env, Address};

mod storage;
mod reward;
mod errors;
mod events;
mod nft;

use storage::{DataKey, RewardConfig};
use errors::RewardError;

#[contract]
pub struct SpinRewards;

#[contractimpl]
impl SpinRewards {

    pub fn init(env: Env, admin: Address, config: RewardConfig) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Config, &config);
        env.storage().instance().set(&DataKey::PoolBalance, &0i128);
        env.storage().instance().set(&DataKey::TotalDistributed, &0i128);
    }

    pub fn fund_pool(env: Env, amount: i128) {
        let pool: i128 = env.storage().instance().get(&DataKey::PoolBalance).unwrap_or(0);
        env.storage().instance().set(&DataKey::PoolBalance, &(pool + amount));
        events::pool_funded(&env, amount);
    }

    pub fn reward_xlm(
        env: Env,
        user: Address,
        amount: i128,
    ) -> Result<(), RewardError> {
        reward::distribute_xlm(&env, user, amount)
    }

    pub fn reward_nft(
        env: Env,
        nft_contract: Address,
        user: Address,
    ) {
        nft::mint_nft(&env, nft_contract, user);
    }
}
