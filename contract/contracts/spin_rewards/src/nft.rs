use soroban_sdk::{Env, Address, Symbol};

pub fn mint_nft(
    env: &Env,
    nft_contract: Address,
    to: Address,
) {
    env.invoke_contract(
        &nft_contract,
        &Symbol::new(env, "mint"),
        (to,)
    );
}
