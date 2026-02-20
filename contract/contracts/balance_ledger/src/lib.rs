#![no_std]

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env, Symbol};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum BalanceLedgerError {
    Unauthorized = 1,
    AlreadyInitialized = 2,
    InvalidAmount = 3,
    InsufficientWithdrawable = 4,
    InsufficientLocked = 5,
    Overflow = 6,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UserBalance {
    pub withdrawable: i128,
    pub locked: i128,
}

#[contracttype]
#[derive(Clone)]
enum DataKey {
    BackendSigner,
    Balance(Address),
}

#[contract]
pub struct BalanceLedgerContract;

#[contractimpl]
impl BalanceLedgerContract {
    pub fn initialize(env: Env, backend_signer: Address) -> Result<(), BalanceLedgerError> {
        let storage = env.storage().persistent();

        if storage.has(&DataKey::BackendSigner) {
            return Err(BalanceLedgerError::AlreadyInitialized);
        }

        storage.set(&DataKey::BackendSigner, &backend_signer);
        Ok(())
    }

    pub fn set_balance(
        env: Env,
        user: Address,
        withdrawable: i128,
        locked: i128,
    ) -> Result<UserBalance, BalanceLedgerError> {
        Self::require_backend_auth(&env)?;
        validate_non_negative(withdrawable)?;
        validate_non_negative(locked)?;

        let previous = get_user_balance(&env, &user);
        let updated = UserBalance {
            withdrawable,
            locked,
        };

        store_user_balance(&env, &user, &updated);
        publish_balance_updated_event(&env, &user, &previous, &updated);

        Ok(updated)
    }

    pub fn apply_delta(
        env: Env,
        user: Address,
        withdrawable_delta: i128,
        locked_delta: i128,
    ) -> Result<UserBalance, BalanceLedgerError> {
        Self::require_backend_auth(&env)?;

        let previous = get_user_balance(&env, &user);
        let updated = apply_balance_delta(&previous, withdrawable_delta, locked_delta)?;

        store_user_balance(&env, &user, &updated);
        publish_balance_updated_event(&env, &user, &previous, &updated);

        Ok(updated)
    }

    pub fn lock_funds(
        env: Env,
        user: Address,
        amount: i128,
    ) -> Result<UserBalance, BalanceLedgerError> {
        Self::require_backend_auth(&env)?;
        validate_positive(amount)?;

        let previous = get_user_balance(&env, &user);
        if previous.withdrawable < amount {
            return Err(BalanceLedgerError::InsufficientWithdrawable);
        }

        let updated = apply_balance_delta(&previous, -amount, amount)?;

        store_user_balance(&env, &user, &updated);
        publish_balance_updated_event(&env, &user, &previous, &updated);

        Ok(updated)
    }

    pub fn unlock_funds(
        env: Env,
        user: Address,
        amount: i128,
    ) -> Result<UserBalance, BalanceLedgerError> {
        Self::require_backend_auth(&env)?;
        validate_positive(amount)?;

        let previous = get_user_balance(&env, &user);
        if previous.locked < amount {
            return Err(BalanceLedgerError::InsufficientLocked);
        }

        let updated = apply_balance_delta(&previous, amount, -amount)?;

        store_user_balance(&env, &user, &updated);
        publish_balance_updated_event(&env, &user, &previous, &updated);

        Ok(updated)
    }

    pub fn get_balance(env: Env, user: Address) -> UserBalance {
        get_user_balance(&env, &user)
    }

    pub fn get_withdrawable(env: Env, user: Address) -> i128 {
        get_user_balance(&env, &user).withdrawable
    }

    pub fn get_locked(env: Env, user: Address) -> i128 {
        get_user_balance(&env, &user).locked
    }

    pub fn get_total(env: Env, user: Address) -> Result<i128, BalanceLedgerError> {
        let balance = get_user_balance(&env, &user);
        checked_add(balance.withdrawable, balance.locked)
    }

    fn require_backend_auth(env: &Env) -> Result<(), BalanceLedgerError> {
        let storage = env.storage().persistent();
        let backend_signer: Address = storage
            .get(&DataKey::BackendSigner)
            .ok_or(BalanceLedgerError::Unauthorized)?;
        backend_signer.require_auth();
        Ok(())
    }
}

fn apply_balance_delta(
    current: &UserBalance,
    withdrawable_delta: i128,
    locked_delta: i128,
) -> Result<UserBalance, BalanceLedgerError> {
    let next_withdrawable = checked_add(current.withdrawable, withdrawable_delta)?;
    let next_locked = checked_add(current.locked, locked_delta)?;

    if next_withdrawable < 0 {
        return Err(BalanceLedgerError::InsufficientWithdrawable);
    }
    if next_locked < 0 {
        return Err(BalanceLedgerError::InsufficientLocked);
    }

    Ok(UserBalance {
        withdrawable: next_withdrawable,
        locked: next_locked,
    })
}

fn checked_add(a: i128, b: i128) -> Result<i128, BalanceLedgerError> {
    a.checked_add(b).ok_or(BalanceLedgerError::Overflow)
}

fn validate_non_negative(amount: i128) -> Result<(), BalanceLedgerError> {
    if amount < 0 {
        return Err(BalanceLedgerError::InvalidAmount);
    }
    Ok(())
}

fn validate_positive(amount: i128) -> Result<(), BalanceLedgerError> {
    if amount <= 0 {
        return Err(BalanceLedgerError::InvalidAmount);
    }
    Ok(())
}

fn get_user_balance(env: &Env, user: &Address) -> UserBalance {
    env.storage()
        .persistent()
        .get(&DataKey::Balance(user.clone()))
        .unwrap_or(UserBalance {
            withdrawable: 0,
            locked: 0,
        })
}

fn store_user_balance(env: &Env, user: &Address, balance: &UserBalance) {
    env.storage()
        .persistent()
        .set(&DataKey::Balance(user.clone()), balance);
}

fn publish_balance_updated_event(
    env: &Env,
    user: &Address,
    previous: &UserBalance,
    updated: &UserBalance,
) {
    env.events().publish(
        (Symbol::new(env, "balance_updated"), user.clone()),
        (
            previous.withdrawable,
            previous.locked,
            updated.withdrawable,
            updated.locked,
        ),
    );
}

#[cfg(test)]
mod test;
