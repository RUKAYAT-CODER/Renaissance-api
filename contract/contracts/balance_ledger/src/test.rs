#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

#[test]
fn initialize_only_once() {
    let env = Env::default();
    let backend = Address::generate(&env);
    let contract_id = env.register(BalanceLedgerContract, ());
    let client = BalanceLedgerContractClient::new(&env, &contract_id);

    client.initialize(&backend);
    assert_eq!(
        client.try_initialize(&backend),
        Err(Ok(BalanceLedgerError::AlreadyInitialized))
    );
}

#[test]
fn set_and_query_split_balances() {
    let env = Env::default();
    env.mock_all_auths();

    let backend = Address::generate(&env);
    let user = Address::generate(&env);
    let contract_id = env.register(BalanceLedgerContract, ());
    let client = BalanceLedgerContractClient::new(&env, &contract_id);

    client.initialize(&backend);
    let updated = client.set_balance(&user, &1_000, &250);

    assert_eq!(
        updated,
        UserBalance {
            withdrawable: 1_000,
            locked: 250,
        }
    );
    assert_eq!(client.get_withdrawable(&user), 1_000);
    assert_eq!(client.get_locked(&user), 250);
    assert_eq!(client.get_total(&user), 1_250);
    assert_eq!(client.get_balance(&user), updated);
}

#[test]
fn lock_and_unlock_funds_atomically() {
    let env = Env::default();
    env.mock_all_auths();

    let backend = Address::generate(&env);
    let user = Address::generate(&env);
    let contract_id = env.register(BalanceLedgerContract, ());
    let client = BalanceLedgerContractClient::new(&env, &contract_id);

    client.initialize(&backend);
    client.set_balance(&user, &500, &100);

    let locked = client.lock_funds(&user, &200);
    assert_eq!(locked.withdrawable, 300);
    assert_eq!(locked.locked, 300);

    let unlocked = client.unlock_funds(&user, &50);
    assert_eq!(unlocked.withdrawable, 350);
    assert_eq!(unlocked.locked, 250);
}

#[test]
fn apply_delta_updates_both_buckets_atomically() {
    let env = Env::default();
    env.mock_all_auths();

    let backend = Address::generate(&env);
    let user = Address::generate(&env);
    let contract_id = env.register(BalanceLedgerContract, ());
    let client = BalanceLedgerContractClient::new(&env, &contract_id);

    client.initialize(&backend);
    client.set_balance(&user, &200, &75);

    let updated = client.apply_delta(&user, &-25, &125);
    assert_eq!(updated.withdrawable, 175);
    assert_eq!(updated.locked, 200);
}

#[test]
fn rejects_invalid_or_insufficient_updates() {
    let env = Env::default();
    env.mock_all_auths();

    let backend = Address::generate(&env);
    let user = Address::generate(&env);
    let contract_id = env.register(BalanceLedgerContract, ());
    let client = BalanceLedgerContractClient::new(&env, &contract_id);

    client.initialize(&backend);
    client.set_balance(&user, &100, &10);

    assert_eq!(
        client.try_set_balance(&user, &-1, &10),
        Err(Ok(BalanceLedgerError::InvalidAmount))
    );
    assert_eq!(
        client.try_lock_funds(&user, &101),
        Err(Ok(BalanceLedgerError::InsufficientWithdrawable))
    );
    assert_eq!(
        client.try_unlock_funds(&user, &11),
        Err(Ok(BalanceLedgerError::InsufficientLocked))
    );
    assert_eq!(
        client.try_apply_delta(&user, &-101, &0),
        Err(Ok(BalanceLedgerError::InsufficientWithdrawable))
    );
}
