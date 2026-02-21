use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum RewardError {
    NotAuthorized = 1,
    InsufficientPool = 2,
    ExceedsPerSpinCap = 3,
    ExceedsUserCap = 4,
    ExceedsTotalCap = 5,
}
