#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol, U256};

use common::ContractError;

#[contracttype]
#[derive(Clone)]
pub struct SettlementRecord {
    pub bet_id: U256,
    pub outcome: Symbol,
    pub bettor: Address,
    pub winner: Option<Address>,
    pub payout: i128,
    pub timestamp: u64,
}
use common::{
    cleanup_operation, ensure_not_replayed, is_operation_executed, ContractError,
    SettlementExecutedEvent,
};
use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Env, Symbol, U256};

#[contracttype]
#[derive(Clone)]
enum DataKey {
    BackendSigner,
    BalanceLedgerContract,
    Settled(U256),
}

#[contract]
pub struct SettlementContract;

#[contractimpl]
impl SettlementContract {
    pub fn initialize(env: Env, backend_signer: Address, balance_ledger: Address) {
        let storage = env.storage().persistent();
        storage.set(&DataKey::BackendSigner, &backend_signer);
        storage.set(&DataKey::BalanceLedgerContract, &balance_ledger);
    }

    fn require_backend_auth(env: &Env) -> Result<(), ContractError> {
        let storage = env.storage().persistent();
        let backend: Address = storage
            .get(&DataKey::BackendSigner)
            .ok_or(ContractError::Unauthorized)?;
        backend.require_auth();
        Ok(())
    }

    pub fn is_settled(env: Env, bet_id: U256) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::Settled(bet_id))
    }

    /// Settle a bet. Caller must be backend signer (oracle/admin).
    /// Supports WIN, LOSS, DRAW (refund).
    pub fn settle_bet(
        env: Env,
        bet_id: U256,
        bettor: Address,
        winner: Option<Address>,
        bet_amount: i128,
        payout: i128,
        settlement_type: Symbol,
    ) -> Result<(), ContractError> {
        Self::require_backend_auth(&env)?;

        let storage = env.storage().persistent();
        if storage.has(&DataKey::Settled(bet_id.clone())) {
            return Err(ContractError::BetAlreadySettled);
        }

        // Get balance ledger contract address
        let bal_contract: Address = storage
            .get(&DataKey::BalanceLedgerContract)
            .ok_or(ContractError::Unauthorized)?;

        let win_sym = Symbol::short("WIN");
        let loss_sym = Symbol::short("LOSS");
        let draw_sym = Symbol::short("DRAW");

        // Perform atomic fund updates by invoking balance ledger contract methods.
        if settlement_type == win_sym {
            // Winner must be provided
            let winner_addr = winner.ok_or(ContractError::InvalidBet)?;

            // Deduct locked funds from bettor
            env.invoke_contract(&bal_contract, &Symbol::new(&env, "apply_delta"), (
                bettor.clone(),
                0i128,
                -bet_amount,
            ));

            // Credit payout to winner withdrawable
            env.invoke_contract(&bal_contract, &Symbol::new(&env, "apply_delta"), (
                winner_addr.clone(),
                payout,
                0i128,
            ));
        } else if settlement_type == loss_sym {
            // Remove locked funds from bettor (platform keeps funds)
            env.invoke_contract(&bal_contract, &Symbol::new(&env, "apply_delta"), (
                bettor.clone(),
                0i128,
                -bet_amount,
            ));
        } else if settlement_type == draw_sym {
            // Refund: move locked funds back to withdrawable
            env.invoke_contract(&bal_contract, &Symbol::new(&env, "apply_delta"), (
                bettor.clone(),
                bet_amount,
                -bet_amount,
            ));
        } else {
            return Err(ContractError::InvalidStatus);
        }

        // Mark settled and store record
        let record = SettlementRecord {
            bet_id: bet_id.clone(),
            outcome: settlement_type.clone(),
            bettor: bettor.clone(),
            winner: winner.clone(),
    pub fn initialize(env: Env, backend_signer: Address) {
        env.storage()
            .persistent()
            .set(&DataKey::BackendSigner, &backend_signer);
    }

    pub fn settle_bet(
        env: Env,
        operation_hash: BytesN<32>,
        bet_id: U256,
        winner: Address,
        payout: i128,
        ttl_seconds: Option<u64>,
    ) -> Result<(), ContractError> {
        Self::require_backend_auth(&env)?;
        ensure_not_replayed(
            &env,
            Symbol::new(&env, "settlement"),
            operation_hash.clone(),
            ttl_seconds,
        )?;

        let event = SettlementExecutedEvent {
            operation_hash,
            bet_id,
            winner,
            payout,
            timestamp: env.ledger().timestamp(),
        };

        storage.set(&DataKey::Settled(bet_id.clone()), &true);
     

     

        env.events()
            .publish((Symbol::new(&env, "settlement_executed"),), event);

        Ok(())
    }

    pub fn is_operation_executed(env: Env, operation_hash: BytesN<32>) -> bool {
        is_operation_executed(&env, Symbol::new(&env, "settlement"), operation_hash)
    }

    pub fn cleanup_operation(env: Env, operation_hash: BytesN<32>) -> bool {
        cleanup_operation(&env, Symbol::new(&env, "settlement"), operation_hash)
    }

    fn require_backend_auth(env: &Env) -> Result<(), ContractError> {
        let backend_signer: Address = env
            .storage()
            .persistent()
            .get(&DataKey::BackendSigner)
            .ok_or(ContractError::Unauthorized)?;
        backend_signer.require_auth();
        Ok(())
    }
}

#[cfg(test)]
mod test;
