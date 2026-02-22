# Backend Verification Getters Documentation

## Overview
This document describes the read-only getter functions implemented for backend verification of on-chain state. All getters are designed to be gas-efficient and provide comprehensive access to user balances, active stakes, and locked bets without any mutation capabilities.

## Design Principles

### Read-Only Access
- All getters only read from storage, never write
- No authentication required for read operations
- Safe for backend services to call without side effects

### Gas Efficiency
- Batch operations for multiple data retrieval
- Minimal storage reads per call
- Optimized data structures to reduce gas costs

### Comprehensive Coverage
- User balances (available and locked)
- Active stakes with rewards
- Locked bets with settlements
- Aggregated portfolio data

## Core Data Structures

### User Balance
```rust
pub struct UserBalance {
    pub user: Address,
    pub token_address: Address,
    pub balance: i128,           // Total balance
    pub locked_balance: i128,     // Locked in contracts
    pub last_updated: u64,
}
```

### Active Stake
```rust
pub struct ActiveStake {
    pub stake_id: U256,
    pub user: Address,
    pub token_address: Address,
    pub amount: i128,
    pub start_time: u64,
    pub end_time: Option<u64>,
    pub rewards_earned: i128,
    pub apy: u32,
    pub staking_contract: Address,
    pub is_active: bool,
}
```

### Locked Bet
```rust
pub struct LockedBet {
    pub bet_id: U256,
    pub bettor: Address,
    pub amount: i128,
    pub token_address: Address,
    pub betting_contract: Address,
    pub bet_type: String,
    pub odds: u32,
    pub placed_at: u64,
    pub settles_at: u64,
    pub is_settled: bool,
    pub potential_payout: i128,
}
```

## User Balance Getters

### Individual Balance
```rust
pub fn get_user_balance(env: &Env, user: Address, token_address: Address) -> UserBalance
```
- Returns complete balance information for a specific token
- Includes both available and locked amounts
- Gas-efficient single storage read

### All User Balances
```rust
pub fn get_user_all_balances(env: &Env, user: Address) -> Map<Address, UserBalance>
```
- Returns all token balances for a user
- Map keyed by token address
- Useful for portfolio calculations

### Available Balance
```rust
pub fn get_user_available_balance(env: &Env, user: Address, token_address: Address) -> i128
```
- Returns balance minus locked amounts
- Available for new transactions
- Single calculation: `balance - locked_balance`

### Locked Balance
```rust
pub fn get_user_locked_balance(env: &Env, user: Address, token_address: Address) -> i128
```
- Returns amount locked in contracts
- Includes staking, betting, and other locks
- Important for liquidity calculations

## Active Stakes Getters

### Specific Stake
```rust
pub fn get_active_stake(env: &Env, stake_id: U256) -> ActiveStake
```
- Returns complete stake information
- Includes rewards and timing data
- Panics if stake not found

### User's Active Stakes
```rust
pub fn get_user_active_stakes(env: &Env, user: Address) -> Vec<ActiveStake>
```
- Returns all active stakes for a user
- Ordered by creation time
- Includes reward calculations

### User Stake Summary
```rust
pub fn get_user_stake_info(env: &Env, user: Address) -> UserStakeInfo
```
- Aggregated stake information
- Total staked amount
- Pending rewards
- Active stake count

### Total Staked Amount
```rust
pub fn get_user_total_staked(env: &Env, user: Address) -> i128
```
- Returns total amount currently staked
- Single value for quick calculations
- Gas-efficient

### Pending Rewards
```rust
pub fn get_user_pending_rewards(env: &Env, user: Address) -> i128
```
- Returns unclaimed rewards
- Important for user incentives
- Updates with each block

## Locked Bets Getters

### Specific Bet
```rust
pub fn get_locked_bet(env: &Env, bet_id: U256) -> LockedBet
```
- Returns complete bet information
- Includes odds and settlement data
- Panics if bet not found

### User's Locked Bets
```rust
pub fn get_user_locked_bets(env: &Env, user: Address) -> Vec<LockedBet>
```
- Returns all unsettled bets
- Ordered by placement time
- Includes potential payouts

### User Bet Summary
```rust
pub fn get_user_bet_info(env: &Env, user: Address) -> UserBetInfo
```
- Aggregated betting information
- Total wagered and won amounts
- Active bet count

### Total Locked in Bets
```rust
pub fn get_user_locked_bets_amount(env: &Env, user: Address) -> i128
```
- Returns total amount locked in bets
- Single value for quick calculations
- Important for risk management

## Gas-Efficient Batch Getters

### User Key Metrics
```rust
pub fn get_user_key_metrics(env: &Env, user: Address, token_address: Address) -> (i128, i128, i128, i128)
```
- Returns: (available_balance, total_staked, locked_bets, pending_rewards)
- Single call for multiple metrics
- Optimized for dashboard displays

### Contract Statistics
```rust
pub fn get_contract_stats(env: &Env, token_address: Address) -> (u32, i128, i128, i128)
```
- Returns: (total_users, total_staked, total_locked_bets, total_supply)
- System-wide statistics
- Useful for monitoring

## Aggregated Portfolio Getters

### Complete Portfolio
```rust
pub fn get_user_portfolio(env: &Env, user: Address) -> UserPortfolio
```
- Returns complete user portfolio
- Includes balances, stakes, and bets
- Single snapshot of user state

### Total Value Locked
```rust
pub fn get_user_total_locked(env: &Env, user: Address) -> i128
```
- Returns total value locked across all contracts
- Important for DeFi calculations
- Single aggregated value

## NFT Contract Specific Getters

### NFT Balance
```rust
pub fn get_user_nft_balance(env: Env, user: Address) -> u64
```
- Returns number of NFTs owned
- Simple count for portfolio display
- Gas-efficient

### NFT Portfolio
```rust
pub fn get_user_nft_portfolio(env: Env, user: Address) -> Vec<u64>
```
- Returns all token IDs owned by user
- Complete NFT portfolio
- Useful for detailed displays

### Contract Statistics
```rust
pub fn get_nft_contract_stats(env: Env) -> (u64, Address)
```
- Returns: (total_supply, admin_address)
- Basic contract information
- Useful for monitoring

### Token Existence
```rust
pub fn token_exists(env: Env, token_id: u64) -> bool
```
- Checks if token ID exists
- Prevents errors in subsequent calls
- Gas-efficient existence check

### Batch Token Owners
```rust
pub fn get_multiple_token_owners(env: Env, token_ids: Vec<u64>) -> Vec<Address>
```
- Returns owners for multiple tokens
- Batch operation for efficiency
- Reduces individual calls

### NFT Balance with Metadata
```rust
pub fn get_user_nft_balance_with_metadata(env: Env, user: Address) -> (u64, Vec<(u64, String)>)
```
- Returns: (balance, list of (token_id, token_uri))
- Complete NFT information
- Optimized for portfolio displays

## Backend Integration Guidelines

### Error Handling
- All getters panic on invalid input (consistent with Soroban patterns)
- Backend should handle panics gracefully
- Use existence checks before accessing specific data

### Gas Optimization
- Prefer batch getters for multiple data points
- Cache frequently accessed data
- Use specific getters when only partial data needed

### Data Consistency
- All data reflects current on-chain state
- Timestamps indicate last update time
- Use events for real-time updates

### Performance Considerations
- `get_all_*` functions may be gas-intensive
- Use pagination for large datasets
- Consider off-chain indexing for historical data

## Usage Examples

### Basic User Balance Check
```rust
let balance = get_user_balance(&env, user_address, token_address);
let available = balance.balance - balance.locked_balance;
```

### Complete User Portfolio
```rust
let portfolio = get_user_portfolio(&env, user_address);
let total_value = portfolio.total_value_locked;
```

### Gas-Efficient Metrics
```rust
let (available, staked, locked, rewards) = get_user_key_metrics(&env, user_address, token_address);
```

## Security Considerations

### Read-Only Nature
- No state mutations possible through getters
- Safe for public access
- Cannot be used for exploits

### Data Privacy
- All data is on-chain and public
- No sensitive information exposed
- Compliant with blockchain transparency

### Rate Limiting
- Consider rate limiting for public endpoints
- Implement caching for frequently accessed data
- Monitor gas costs for batch operations

This comprehensive getter system enables efficient backend verification of all on-chain states while maintaining gas efficiency and security.
