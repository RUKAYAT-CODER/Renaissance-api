use soroban_sdk::{Env, Address};
use crate::storage::{DataKey, RewardConfig};
use crate::errors::RewardError;
use crate::events;

pub fn distribute_xlm(
    env: &Env,
    user: Address,
    amount: i128,
) -> Result<(), RewardError> {

    let config: RewardConfig = env.storage().instance().get(&DataKey::Config).unwrap();
    let pool: i128 = env.storage().instance().get(&DataKey::PoolBalance).unwrap_or(0);
    let total_distributed: i128 =
        env.storage().instance().get(&DataKey::TotalDistributed).unwrap_or(0);

    if amount > config.max_per_spin {
        return Err(RewardError::ExceedsPerSpinCap);
    }

    let user_total: i128 =
        env.storage().instance().get(&DataKey::UserRewards(user.clone())).unwrap_or(0);

    if user_total + amount > config.max_per_user {
        return Err(RewardError::ExceedsUserCap);
    }

    if total_distributed + amount > config.total_cap {
        return Err(RewardError::ExceedsTotalCap);
    }

    if pool < amount {
        return Err(RewardError::InsufficientPool);
    }

    // Transfer native XLM
    env.invoke_contract(
        &env.current_contract_address(),
        &symbol_short!("transfer"),
        (user.clone(), amount)
    );

    env.storage().instance().set(&DataKey::PoolBalance, &(pool - amount));
    env.storage().instance().set(&DataKey::UserRewards(user.clone()), &(user_total + amount));
    env.storage().instance().set(&DataKey::TotalDistributed, &(total_distributed + amount));

    events::reward_distributed(env, user, amount);

    Ok(())
}
