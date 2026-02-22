use soroban_sdk::{contracttype, Address, U256};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Admin,                    // Address: Contract admin
    StakingToken,             // Address: Token allowed for staking (XLM)
    MinStake,                 // i128: Minimum amount required to stake
    CooldownPeriod,           // u64: Time in seconds before a stake can be withdrawn
    TotalStake(Address),      // i128: Total amount staked by a user
    UserStake(Address, U256), // StakeData: Details of a specific stake
    StakeNonce(Address),      // u32: Nonce used for generating unique stake IDs
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StakeData {
    pub amount: i128,
    pub timestamp: u64,
}
