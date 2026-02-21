use soroban_sdk::{contracttype, Address};

#[contracttype]
#[derive(Clone)]
pub struct RewardConfig {
    pub max_per_spin: i128,
    pub max_per_user: i128,
    pub total_cap: i128,
}

#[contracttype]
pub enum DataKey {
    Admin,
    PoolBalance,
    UserRewards(Address),
    Config,
    TotalDistributed,
}
