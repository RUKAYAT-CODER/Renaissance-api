#![no_std]

use common::errors::ContractError;
use common::events::{create_stake_event, create_unstake_event, STAKE_EVENT, UNSTAKE_EVENT};
use soroban_sdk::{contract, contractimpl, token, Address, Env, U256};

pub mod storage;
use storage::{DataKey, StakeData};

#[contract]
pub struct StakingContract;

#[contractimpl]
impl StakingContract {
    pub fn initialize(
        env: Env,
        admin: Address,
        staking_token: Address,
        min_stake: i128,
        cooldown_period: u64,
    ) -> Result<(), ContractError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(ContractError::AlreadyInitialized);
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::StakingToken, &staking_token);
        env.storage().instance().set(&DataKey::MinStake, &min_stake);
        env.storage()
            .instance()
            .set(&DataKey::CooldownPeriod, &cooldown_period);

        Ok(())
    }

    pub fn update_config(
        env: Env,
        admin: Address,
        min_stake: Option<i128>,
        cooldown_period: Option<u64>,
    ) -> Result<(), ContractError> {
        admin.require_auth();
        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(ContractError::NotInitialized)?;
        if admin != stored_admin {
            return Err(ContractError::Unauthorized);
        }

        if let Some(min) = min_stake {
            env.storage().instance().set(&DataKey::MinStake, &min);
        }
        if let Some(cooldown) = cooldown_period {
            env.storage()
                .instance()
                .set(&DataKey::CooldownPeriod, &cooldown);
        }

        Ok(())
    }

    pub fn stake(env: Env, user: Address, amount: i128) -> Result<U256, ContractError> {
        user.require_auth();

        let staking_token: Address = env
            .storage()
            .instance()
            .get(&DataKey::StakingToken)
            .ok_or(ContractError::NotInitialized)?;
        let min_stake: i128 = env.storage().instance().get(&DataKey::MinStake).unwrap();

        if amount < min_stake {
            return Err(ContractError::BelowMinStake);
        }

        // Transfer tokens to contract
        let token_client = token::Client::new(&env, &staking_token);
        token_client.transfer(&user, &env.current_contract_address(), &amount);

        // Generate stake ID based on user nonce
        let nonce_key = DataKey::StakeNonce(user.clone());
        let nonce: u32 = env.storage().persistent().get(&nonce_key).unwrap_or(0);
        env.storage().persistent().set(&nonce_key, &(nonce + 1));
        let stake_id = U256::from_u32(&env, nonce);

        let timestamp = env.ledger().timestamp();

        // Record the stake
        let stake_data = StakeData { amount, timestamp };
        env.storage().persistent().set(
            &DataKey::UserStake(user.clone(), stake_id.clone()),
            &stake_data,
        );

        // Update total stake
        let total_key = DataKey::TotalStake(user.clone());
        let current_total: i128 = env.storage().persistent().get(&total_key).unwrap_or(0);
        env.storage()
            .persistent()
            .set(&total_key, &(current_total + amount));

        // Emit Event
        let mut event = create_stake_event(
            user.clone(),
            amount,
            staking_token,
            env.current_contract_address(),
            stake_id.clone(),
        );
        event.timestamp = timestamp;
        env.events().publish((STAKE_EVENT, user.clone()), event);

        Ok(stake_id)
    }

    pub fn unstake(env: Env, user: Address, stake_id: U256) -> Result<(), ContractError> {
        user.require_auth();

        let staking_token: Address = env
            .storage()
            .instance()
            .get(&DataKey::StakingToken)
            .ok_or(ContractError::NotInitialized)?;
        let cooldown_period: u64 = env
            .storage()
            .instance()
            .get(&DataKey::CooldownPeriod)
            .unwrap();

        let stake_key = DataKey::UserStake(user.clone(), stake_id.clone());
        let stake_data: StakeData = env
            .storage()
            .persistent()
            .get(&stake_key)
            .ok_or(ContractError::StakeNotFound)?;

        let current_time = env.ledger().timestamp();
        if current_time < stake_data.timestamp + cooldown_period {
            return Err(ContractError::CooldownNotMet);
        }

        // Remove the stake
        env.storage().persistent().remove(&stake_key);

        // Update total stake
        let total_key = DataKey::TotalStake(user.clone());
        let current_total: i128 = env.storage().persistent().get(&total_key).unwrap_or(0);
        let new_total = current_total - stake_data.amount;
        if new_total > 0 {
            env.storage().persistent().set(&total_key, &new_total);
        } else {
            env.storage().persistent().remove(&total_key);
        }

        // Transfer tokens back to user
        let token_client = token::Client::new(&env, &staking_token);
        token_client.transfer(&env.current_contract_address(), &user, &stake_data.amount);

        // Emit Event
        let mut event = create_unstake_event(
            user.clone(),
            stake_data.amount,
            staking_token,
            env.current_contract_address(),
            stake_id,
            0, // Rewards are not implemented in this version, hardcode 0
        );
        event.timestamp = current_time;
        env.events().publish((UNSTAKE_EVENT, user.clone()), event);

        Ok(())
    }

    pub fn get_total_stake(env: Env, user: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::TotalStake(user))
            .unwrap_or(0)
    }

    pub fn get_stake(env: Env, user: Address, stake_id: U256) -> Result<StakeData, ContractError> {
        env.storage()
            .persistent()
            .get(&DataKey::UserStake(user, stake_id))
            .ok_or(ContractError::StakeNotFound)
    }
}

#[cfg(test)]
mod test;
