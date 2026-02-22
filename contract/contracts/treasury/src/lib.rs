use soroban_sdk::{contract, contractimpl, Env, Address};
use common::storage_keys::*;

#[contract]
pub struct Treasury;

#[contractimpl]
impl Treasury {
    pub fn deposit(env: Env, from: Address, amount: i128) {
        let key = format!("{}{}", TREASURY_BALANCE, from);
        env.storage().set(&key, &amount);
    }

    pub fn withdraw(env: Env, to: Address, amount: i128) {
        let key = format!("{}{}", TREASURY_BALANCE, to);
        let balance: i128 = env.storage().get(&key).unwrap_or(0);
        env.storage().set(&key, &(balance - amount));
    }
}
