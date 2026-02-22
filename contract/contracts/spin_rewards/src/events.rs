use soroban_sdk::{symbol_short, Env, Address};

pub fn reward_distributed(env: &Env, user: Address, amount: i128) {
    env.events().publish(
        (symbol_short!("reward"),),
        (user, amount),
    );
}

pub fn pool_funded(env: &Env, amount: i128) {
    env.events().publish(
        (symbol_short!("funded"),),
        amount,
    );
}
