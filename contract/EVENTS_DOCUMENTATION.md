# Backend Events Documentation

## Overview
This document describes the standardized event system designed for backend indexing and analytics. All events follow a consistent naming scheme and payload structure to ensure easy parsing and data extraction.

## Event Naming Convention
- Event names use short symbols (max 9 characters) for blockchain efficiency
- Event names follow pattern: `[ACTION]_[OBJECT]` or `[ACTION]`
- All events are prefixed with descriptive constants

## Core Events

### 1. Stake Event (`STAKE`)
Emitted when users stake tokens in staking contracts.

**Event Type**: `StakeEvent`

**Payload Structure**:
```rust
pub struct StakeEvent {
    pub user: Address,           // User who staked tokens
    pub amount: i128,            // Amount staked
    pub token_address: Address,  // Token contract address
    pub staking_contract: Address, // Staking contract address
    pub timestamp: u64,          // Block timestamp
    pub stake_id: U256,          // Unique stake identifier
}
```

**Backend Indexing Fields**:
- `user_address` - For user portfolio tracking
- `amount` - For total staked calculations
- `token_address` - For token-specific analytics
- `timestamp` - For time-based analytics
- `stake_id` - For unique transaction identification

### 2. Unstake Event (`UNSTAKE`)
Emitted when users unstake tokens from staking contracts.

**Event Type**: `UnstakeEvent`

**Payload Structure**:
```rust
pub struct UnstakeEvent {
    pub user: Address,           // User who unstaked tokens
    pub amount: i128,            // Amount unstaked
    pub token_address: Address,  // Token contract address
    pub staking_contract: Address, // Staking contract address
    pub timestamp: u64,          // Block timestamp
    pub stake_id: U256,          // Original stake identifier
    pub rewards: i128,           // Rewards earned
}
```

**Backend Indexing Fields**:
- `user_address` - For user portfolio tracking
- `amount` - For total unstaked calculations
- `rewards` - For reward analytics
- `token_address` - For token-specific analytics
- `timestamp` - For time-based analytics
- `stake_id` - For linking to original stake

### 3. Bet Event (`BET`)
Emitted when users place bets in betting contracts.

**Event Type**: `BetEvent`

**Payload Structure**:
```rust
pub struct BetEvent {
    pub bettor: Address,         // User who placed the bet
    pub amount: i128,             // Bet amount
    pub bet_id: U256,             // Unique bet identifier
    pub betting_contract: Address, // Betting contract address
    pub timestamp: u64,           // Block timestamp
    pub bet_type: Symbol,         // Type of bet (e.g., "WIN", "PLACE")
    pub odds: u32,                // Betting odds (multiplied by 100)
    pub metadata: Map<Symbol, String>, // Additional bet data
}
```

**Backend Indexing Fields**:
- `bettor_address` - For user betting history
- `amount` - For total betting volume
- `bet_type` - For bet type analytics
- `odds` - For odds analysis
- `timestamp` - For time-based analytics
- `bet_id` - For unique transaction identification

### 4. Settlement Event (`SETTLE`)
Emitted when bets are settled (won, lost, or cancelled).

**Event Type**: `SettlementEvent`

**Payload Structure**:
```rust
pub struct SettlementEvent {
    pub bet_id: U256,             // Original bet identifier
    pub winner: Address,          // Winner address (if applicable)
    pub payout: i128,             // Payout amount (0 for losses)
    pub betting_contract: Address, // Betting contract address
    pub timestamp: u64,            // Block timestamp
    pub settlement_type: Symbol,  // Type of settlement ("WIN", "LOSE", "CANCEL")
    pub final_odds: u32,          // Final odds applied
    pub metadata: Map<Symbol, String>, // Additional settlement data
}
```

**Backend Indexing Fields**:
- `bet_id` - For linking to original bet
- `winner_address` - For winner tracking
- `payout` - For profit/loss calculations
- `settlement_type` - For outcome analytics
- `timestamp` - For time-based analytics
- `final_odds` - For odds accuracy analysis

### 5. Spin Reward Event (`SPIN_RWD`)
Emitted when users receive rewards from spin games.

**Event Type**: `SpinRewardEvent`

**Payload Structure**:
```rust
pub struct SpinRewardEvent {
    pub user: Address,            // User who received reward
    pub reward_amount: i128,       // Reward amount
    pub token_address: Address,   // Reward token contract address
    pub game_contract: Address,   // Game contract address
    pub timestamp: u64,            // Block timestamp
    pub spin_id: U256,             // Unique spin identifier
    pub reward_type: Symbol,      // Type of reward ("BONUS", "JACKPOT", etc.)
    pub multiplier: u32,           // Reward multiplier (multiplied by 100)
    pub metadata: Map<Symbol, String>, // Additional reward data
}
```

**Backend Indexing Fields**:
- `user_address` - For user reward tracking
- `reward_amount` - For total reward calculations
- `reward_type` - For reward type analytics
- `multiplier` - For multiplier effectiveness
- `token_address` - For token-specific analytics
- `timestamp` - For time-based analytics
- `spin_id` - For unique transaction identification

### 6. NFT Mint Event (`NFT_MINT`)
Emitted when NFTs are minted (including player cards).

**Event Type**: `NFTMintEvent`

**Payload Structure**:
```rust
pub struct NFTMintEvent {
    pub token_id: U256,            // Unique NFT identifier
    pub to: Address,               // Recipient address
    pub token_uri: String,         // Metadata URI
    pub nft_contract: Address,     // NFT contract address
    pub timestamp: u64,            // Block timestamp
    pub mint_type: Symbol,         // Type of mint ("PLAYER_CARD", "REWARD", etc.)
    pub metadata: Map<Symbol, String>, // Additional mint data
    pub price: Option<i128>,       // Mint price (None for free mints)
}
```

**Backend Indexing Fields**:
- `recipient_address` - For user NFT portfolio
- `token_id` - For unique NFT identification
- `mint_type` - For NFT type analytics
- `price` - For revenue tracking
- `token_uri` - For metadata indexing
- `timestamp` - For time-based analytics
- `nft_contract` - For contract-specific analytics

### 7. User Metrics Event (`metrics_updated`)
Emitted by the balance ledger when cumulative leaderboard metrics are updated.

**Event Topic**: `(metrics_updated, user_address)`

**Payload Structure**:
```rust
(
    staked_delta: i128,
    won_delta: i128,
    lost_delta: i128,
    total_staked: i128,
    total_won: i128,
    total_lost: i128,
)
```

**Backend Indexing Fields**:
- `user_address` - User leaderboard identity key
- `staked_delta` - Per-update staked increment
- `won_delta` - Per-update winnings increment
- `lost_delta` - Per-update losses increment
- `total_staked` - Canonical cumulative staked amount
- `total_won` - Canonical cumulative winnings amount
- `total_lost` - Canonical cumulative loss amount

**Reconstruction Rule**:
- Backend can replay `metrics_updated` events in ledger order and trust the latest cumulative tuple as canonical.

## Consistent Fields Across Events

All events include these standardized fields:
- `timestamp` - Block timestamp for chronological ordering
- Contract addresses for service identification
- User addresses for user-centric analytics
- Unique identifiers for transaction tracking

## Metadata Maps

Most events include a `metadata` field of type `Map<Symbol, String>` for flexible additional data:
- Use for contract-specific information
- Extensible for future requirements
- String values for easy parsing

## Backend Integration Guidelines

### Event Parsing
1. Parse events by topic (event constant)
2. Deserialize payload based on event type
3. Extract indexed fields for database storage
4. Store raw event for audit trail

### Indexing Strategy
1. **User-centric**: Index by user addresses for portfolio tracking
2. **Time-based**: Index by timestamp for analytics
3. **Contract-specific**: Index by contract addresses for service analytics
4. **Transaction linking**: Use unique IDs to relate events (bet→settlement, stake→unstake)

### Data Relationships
- Link `BET` events to `SETTLE` events via `bet_id`
- Link `STAKE` events to `UNSTAKE` events via `stake_id`
- Link all events to user addresses for comprehensive user profiles

## Legacy Events

For backward compatibility, legacy events are maintained:
- `BetPlacedEvent` - Superseded by `BetEvent`
- `BetSettledEvent` - Superseded by `SettlementEvent`
- `BetCancelledEvent` - Handled within `SettlementEvent`

New implementations should use the standardized event system.
