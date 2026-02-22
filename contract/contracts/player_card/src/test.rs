#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, testutils::Ledger, Address, BytesN, Env, String, Vec};

// ============================================
// Initialization Tests
// ============================================

#[test]
fn initialize_contract_success() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register(PlayerCardContract, ());
    let client = PlayerCardContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    
    // Verify contract is initialized by checking admin
    let (total_supply, stored_admin) = client.get_nft_contract_stats();
    assert_eq!(total_supply, 0);
    assert_eq!(stored_admin, admin);
}

#[test]
#[should_panic(expected = "already initialized")]
fn initialize_already_initialized_panics() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register(PlayerCardContract, ());
    let client = PlayerCardContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    client.initialize(&admin); // Should panic
}

// ============================================
// Authorization Tests - Unauthorized Calls
// ============================================

#[test]
#[should_panic]
fn mint_without_admin_auth_fails() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let recipient = Address::generate(&env);
    let contract_id = env.register(PlayerCardContract, ());
    let client = PlayerCardContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    
    // Don't mock auths - this should fail
    let operation_hash = BytesN::from_array(&env, &[1u8; 32]);
    let token_uri = String::from_str(&env, "https://example.com/token/1");
    
    client.mint(&operation_hash, &recipient, &token_uri, &None);
}

#[test]
#[should_panic]
fn transfer_without_owner_auth_fails() {
    let env = Env::default();
    env.mock_all_auths();
    
    let admin = Address::generate(&env);
    let recipient = Address::generate(&env);
    let unauthorized = Address::generate(&env);
    let contract_id = env.register(PlayerCardContract, ());
    let client = PlayerCardContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    
    // Mint a token
    let operation_hash = BytesN::from_array(&env, &[1u8; 32]);
    let token_uri = String::from_str(&env, "https://example.com/token/1");
    let token_id = client.mint(&operation_hash, &recipient, &token_uri, &None);
    
    // Try to transfer without authorization
    env.set_auths(&[]);
    client.transfer(&unauthorized, &admin, &token_id);
}

#[test]
#[should_panic(expected = "not token owner")]
fn transfer_by_non_owner_fails() {
    let env = Env::default();
    env.mock_all_auths();
    
    let admin = Address::generate(&env);
    let owner = Address::generate(&env);
    let non_owner = Address::generate(&env);
    let recipient = Address::generate(&env);
    let contract_id = env.register(PlayerCardContract, ());
    let client = PlayerCardContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    
    // Mint a token to owner
    let operation_hash = BytesN::from_array(&env, &[1u8; 32]);
    let token_uri = String::from_str(&env, "https://example.com/token/1");
    let token_id = client.mint(&operation_hash, &owner, &token_uri, &None);
    
    // Try to transfer from non-owner
    client.transfer(&non_owner, &recipient, &token_id);
}

// ============================================
// Minting Tests
// ============================================

#[test]
fn mint_single_token_success() {
    let env = Env::default();
    env.mock_all_auths();
    
    let admin = Address::generate(&env);
    let recipient = Address::generate(&env);
    let contract_id = env.register(PlayerCardContract, ());
    let client = PlayerCardContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    
    let operation_hash = BytesN::from_array(&env, &[1u8; 32]);
    let token_uri = String::from_str(&env, "https://example.com/token/1");
    let token_id = client.mint(&operation_hash, &recipient, &token_uri, &None);
    
    assert_eq!(token_id, 1);
    assert_eq!(client.owner_of(&token_id), recipient);
    assert_eq!(client.token_uri(&token_id), token_uri);
    assert_eq!(client.total_supply(), 1);
}

#[test]
fn mint_multiple_tokens_increments_ids() {
    let env = Env::default();
    env.mock_all_auths();
    
    let admin = Address::generate(&env);
    let recipient1 = Address::generate(&env);
    let recipient2 = Address::generate(&env);
    let contract_id = env.register(PlayerCardContract, ());
    let client = PlayerCardContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    
    let token_uri = String::from_str(&env, "https://example.com/token/");
    
    let token_id1 = client.mint(&BytesN::from_array(&env, &[1u8; 32]), &recipient1, &token_uri, &None);
    let token_id2 = client.mint(&BytesN::from_array(&env, &[2u8; 32]), &recipient2, &token_uri, &None);
    let token_id3 = client.mint(&BytesN::from_array(&env, &[3u8; 32]), &recipient1, &token_uri, &None);
    
    assert_eq!(token_id1, 1);
    assert_eq!(token_id2, 2);
    assert_eq!(token_id3, 3);
    assert_eq!(client.total_supply(), 3);
}

#[test]
fn mint_rejects_duplicate_operation_hash() {
    let env = Env::default();
    env.mock_all_auths();
    
    let admin = Address::generate(&env);
    let recipient1 = Address::generate(&env);
    let recipient2 = Address::generate(&env);
    let contract_id = env.register(PlayerCardContract, ());
    let client = PlayerCardContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    
    let operation_hash = BytesN::from_array(&env, &[1u8; 32]);
    let token_uri = String::from_str(&env, "https://example.com/token/");
    
    client.mint(&operation_hash, &recipient1, &token_uri, &None);
    
    // Try to mint with same operation hash - should fail
    let result = client.try_mint(&operation_hash, &recipient2, &token_uri, &None);
    assert!(result.is_err());
}

// ============================================
// Replay Protection Tests
// ============================================

#[test]
fn mint_operation_replay_protection() {
    let env = Env::default();
    env.mock_all_auths();
    
    let admin = Address::generate(&env);
    let recipient = Address::generate(&env);
    let contract_id = env.register(PlayerCardContract, ());
    let client = PlayerCardContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    
    let operation_hash = BytesN::from_array(&env, &[1u8; 32]);
    let token_uri = String::from_str(&env, "https://example.com/token/1");
    
    // First mint should succeed
    client.mint(&operation_hash, &recipient, &token_uri, &None);
    assert!(client.is_mint_operation_executed(&operation_hash));
    
    // Second mint with same hash should fail
    let result = client.try_mint(&operation_hash, &recipient, &token_uri, &None);
    assert!(result.is_err());
}

#[test]
fn mint_operation_cleanup_after_ttl() {
    let env = Env::default();
    env.mock_all_auths();
    
    let admin = Address::generate(&env);
    let recipient = Address::generate(&env);
    let contract_id = env.register(PlayerCardContract, ());
    let client = PlayerCardContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    
    let operation_hash = BytesN::from_array(&env, &[1u8; 32]);
    let token_uri = String::from_str(&env, "https://example.com/token/1");
    
    // Mint with TTL
    client.mint(&operation_hash, &recipient, &token_uri, &Some(10));
    assert!(client.is_mint_operation_executed(&operation_hash));
    
    // Advance time past TTL
    env.ledger().with_mut(|li| {
        li.timestamp += 11;
    });
    
    // Cleanup should succeed
    assert!(client.cleanup_mint_operation(&operation_hash));
    assert!(!client.is_mint_operation_executed(&operation_hash));
}

#[test]
fn mint_operation_no_cleanup_before_ttl() {
    let env = Env::default();
    env.mock_all_auths();
    
    let admin = Address::generate(&env);
    let recipient = Address::generate(&env);
    let contract_id = env.register(PlayerCardContract, ());
    let client = PlayerCardContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    
    let operation_hash = BytesN::from_array(&env, &[1u8; 32]);
    let token_uri = String::from_str(&env, "https://example.com/token/1");
    
    // Mint with TTL
    client.mint(&operation_hash, &recipient, &token_uri, &Some(10));
    
    // Advance time but not past TTL
    env.ledger().with_mut(|li| {
        li.timestamp += 5;
    });
    
    // Cleanup should fail
    assert!(!client.cleanup_mint_operation(&operation_hash));
    assert!(client.is_mint_operation_executed(&operation_hash));
}

// ============================================
// Transfer Tests
// ============================================

#[test]
fn transfer_token_success() {
    let env = Env::default();
    env.mock_all_auths();
    
    let admin = Address::generate(&env);
    let owner = Address::generate(&env);
    let recipient = Address::generate(&env);
    let contract_id = env.register(PlayerCardContract, ());
    let client = PlayerCardContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    
    // Mint token to owner
    let operation_hash = BytesN::from_array(&env, &[1u8; 32]);
    let token_uri = String::from_str(&env, "https://example.com/token/1");
    let token_id = client.mint(&operation_hash, &owner, &token_uri, &None);
    
    // Transfer to recipient
    client.transfer(&owner, &recipient, &token_id);
    
    assert_eq!(client.owner_of(&token_id), recipient);
}

#[test]
fn transfer_updates_token_ownership_list() {
    let env = Env::default();
    env.mock_all_auths();
    
    let admin = Address::generate(&env);
    let owner = Address::generate(&env);
    let recipient = Address::generate(&env);
    let contract_id = env.register(PlayerCardContract, ());
    let client = PlayerCardContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    
    // Mint token to owner
    let operation_hash = BytesN::from_array(&env, &[1u8; 32]);
    let token_uri = String::from_str(&env, "https://example.com/token/1");
    let token_id = client.mint(&operation_hash, &owner, &token_uri, &None);
    
    // Verify owner has token
    let owner_tokens_before = client.tokens_of_owner(&owner);
    assert_eq!(owner_tokens_before.len(), 1);
    assert_eq!(owner_tokens_before.get(0), Some(token_id));
    
    // Transfer to recipient
    client.transfer(&owner, &recipient, &token_id);
    
    // Verify ownership updated
    let owner_tokens_after = client.tokens_of_owner(&owner);
    let recipient_tokens = client.tokens_of_owner(&recipient);
    assert_eq!(owner_tokens_after.len(), 0);
    assert_eq!(recipient_tokens.len(), 1);
    assert_eq!(recipient_tokens.get(0), Some(token_id));
}

#[test]
#[should_panic(expected = "token not found")]
fn transfer_nonexistent_token_fails() {
    let env = Env::default();
    env.mock_all_auths();
    
    let admin = Address::generate(&env);
    let from = Address::generate(&env);
    let to = Address::generate(&env);
    let contract_id = env.register(PlayerCardContract, ());
    let client = PlayerCardContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    
    // Try to transfer token that doesn't exist
    client.transfer(&from, &to, &999);
}

// ============================================
// Query Tests
// ============================================

#[test]
fn query_nonexistent_token_panics() {
    let env = Env::default();
    env.mock_all_auths();
    
    let admin = Address::generate(&env);
    let contract_id = env.register(PlayerCardContract, ());
    let client = PlayerCardContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    
    // owner_of should panic for non-existent token
    let result = std::panic::catch_unwind(|| {
        client.owner_of(&999);
    });
    assert!(result.is_err());
}

#[test]
fn query_token_uri_for_nonexistent_token_panics() {
    let env = Env::default();
    env.mock_all_auths();
    
    let admin = Address::generate(&env);
    let contract_id = env.register(PlayerCardContract, ());
    let client = PlayerCardContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    
    // token_uri should panic for non-existent token
    let result = std::panic::catch_unwind(|| {
        client.token_uri(&999);
    });
    assert!(result.is_err());
}

#[test]
fn tokens_of_owner_returns_empty_for_new_address() {
    let env = Env::default();
    env.mock_all_auths();
    
    let admin = Address::generate(&env);
    let new_address = Address::generate(&env);
    let contract_id = env.register(PlayerCardContract, ());
    let client = PlayerCardContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    
    let tokens = client.tokens_of_owner(&new_address);
    assert_eq!(tokens.len(), 0);
}

// ============================================
// Backend Verification Getter Tests
// ============================================

#[test]
fn get_user_nft_balance_returns_correct_count() {
    let env = Env::default();
    env.mock_all_auths();
    
    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let contract_id = env.register(PlayerCardContract, ());
    let client = PlayerCardContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    
    // Initially 0
    assert_eq!(client.get_user_nft_balance(&user), 0);
    
    // Mint 3 tokens to user
    let token_uri = String::from_str(&env, "https://example.com/token/");
    client.mint(&BytesN::from_array(&env, &[1u8; 32]), &user, &token_uri, &None);
    client.mint(&BytesN::from_array(&env, &[2u8; 32]), &user, &token_uri, &None);
    client.mint(&BytesN::from_array(&env, &[3u8; 32]), &user, &token_uri, &None);
    
    assert_eq!(client.get_user_nft_balance(&user), 3);
}

#[test]
fn get_user_nft_portfolio_returns_all_tokens() {
    let env = Env::default();
    env.mock_all_auths();
    
    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let contract_id = env.register(PlayerCardContract, ());
    let client = PlayerCardContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    
    // Mint tokens to user
    let token_uri = String::from_str(&env, "https://example.com/token/");
    let token_id1 = client.mint(&BytesN::from_array(&env, &[1u8; 32]), &user, &token_uri, &None);
    let token_id2 = client.mint(&BytesN::from_array(&env, &[2u8; 32]), &user, &token_uri, &None);
    
    let portfolio = client.get_user_nft_portfolio(&user);
    assert_eq!(portfolio.len(), 2);
    assert_eq!(portfolio.get(0), Some(token_id1));
    assert_eq!(portfolio.get(1), Some(token_id2));
}

#[test]
fn get_nft_contract_stats_returns_correct_data() {
    let env = Env::default();
    env.mock_all_auths();
    
    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let contract_id = env.register(PlayerCardContract, ());
    let client = PlayerCardContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    
    let (total_supply, stored_admin) = client.get_nft_contract_stats();
    assert_eq!(total_supply, 0);
    assert_eq!(stored_admin, admin);
    
    // Mint a token
    let token_uri = String::from_str(&env, "https://example.com/token/");
    client.mint(&BytesN::from_array(&env, &[1u8; 32]), &user, &token_uri, &None);
    
    let (total_supply_after, _) = client.get_nft_contract_stats();
    assert_eq!(total_supply_after, 1);
}

#[test]
fn token_exists_returns_correct_value() {
    let env = Env::default();
    env.mock_all_auths();
    
    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let contract_id = env.register(PlayerCardContract, ());
    let client = PlayerCardContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    
    // Non-existent token
    assert!(!client.token_exists(&1));
    
    // Mint token
    let token_uri = String::from_str(&env, "https://example.com/token/");
    let token_id = client.mint(&BytesN::from_array(&env, &[1u8; 32]), &user, &token_uri, &None);
    
    // Now it exists
    assert!(client.token_exists(&token_id));
}

#[test]
fn get_token_metadata_returns_owner_and_uri() {
    let env = Env::default();
    env.mock_all_auths();
    
    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let contract_id = env.register(PlayerCardContract, ());
    let client = PlayerCardContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    
    let token_uri = String::from_str(&env, "https://example.com/token/1");
    let token_id = client.mint(&BytesN::from_array(&env, &[1u8; 32]), &user, &token_uri, &None);
    
    let (owner, uri) = client.get_token_metadata(&token_id);
    assert_eq!(owner, user);
    assert_eq!(uri, token_uri);
}

#[test]
fn get_multiple_token_owners_returns_correct_owners() {
    let env = Env::default();
    env.mock_all_auths();
    
    let admin = Address::generate(&env);
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);
    let contract_id = env.register(PlayerCardContract, ());
    let client = PlayerCardContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    
    let token_uri = String::from_str(&env, "https://example.com/token/");
    let token_id1 = client.mint(&BytesN::from_array(&env, &[1u8; 32]), &user1, &token_uri, &None);
    let token_id2 = client.mint(&BytesN::from_array(&env, &[2u8; 32]), &user2, &token_uri, &None);
    
    let mut token_ids = Vec::new(&env);
    token_ids.push_back(token_id1);
    token_ids.push_back(token_id2);
    
    let owners = client.get_multiple_token_owners(&token_ids);
    assert_eq!(owners.len(), 2);
    assert_eq!(owners.get(0), Some(user1));
    assert_eq!(owners.get(1), Some(user2));
}

#[test]
fn get_user_nft_balance_md_returns_balance_and_metadata() {
    let env = Env::default();
    env.mock_all_auths();
    
    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let contract_id = env.register(PlayerCardContract, ());
    let client = PlayerCardContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    
    let token_uri = String::from_str(&env, "https://example.com/token/1");
    let token_id = client.mint(&BytesN::from_array(&env, &[1u8; 32]), &user, &token_uri, &None);
    
    let (balance, metadata) = client.get_user_nft_balance_md(&user);
    assert_eq!(balance, 1);
    assert_eq!(metadata.len(), 1);
    assert_eq!(metadata.get(0), Some((token_id, token_uri)));
}

// ============================================
// Edge Cases
// ============================================

#[test]
fn mint_with_empty_token_uri() {
    let env = Env::default();
    env.mock_all_auths();
    
    let admin = Address::generate(&env);
    let recipient = Address::generate(&env);
    let contract_id = env.register(PlayerCardContract, ());
    let client = PlayerCardContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    
    let operation_hash = BytesN::from_array(&env, &[1u8; 32]);
    let empty_uri = String::from_str(&env, "");
    
    let token_id = client.mint(&operation_hash, &recipient, &empty_uri, &None);
    assert_eq!(client.token_uri(&token_id), empty_uri);
}

#[test]
fn transfer_to_self() {
    let env = Env::default();
    env.mock_all_auths();
    
    let admin = Address::generate(&env);
    let owner = Address::generate(&env);
    let contract_id = env.register(PlayerCardContract, ());
    let client = PlayerCardContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    
    let operation_hash = BytesN::from_array(&env, &[1u8; 32]);
    let token_uri = String::from_str(&env, "https://example.com/token/1");
    let token_id = client.mint(&operation_hash, &owner, &token_uri, &None);
    
    // Transfer to self
    client.transfer(&owner, &owner, &token_id);
    
    assert_eq!(client.owner_of(&token_id), owner);
    let tokens = client.tokens_of_owner(&owner);
    assert_eq!(tokens.len(), 1);
}

#[test]
fn multiple_transfers_between_users() {
    let env = Env::default();
    env.mock_all_auths();
    
    let admin = Address::generate(&env);
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);
    let user3 = Address::generate(&env);
    let contract_id = env.register(PlayerCardContract, ());
    let client = PlayerCardContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    
    let operation_hash = BytesN::from_array(&env, &[1u8; 32]);
    let token_uri = String::from_str(&env, "https://example.com/token/1");
    let token_id = client.mint(&operation_hash, &user1, &token_uri, &None);
    
    // user1 -> user2
    client.transfer(&user1, &user2, &token_id);
    assert_eq!(client.owner_of(&token_id), user2);
    
    // user2 -> user3
    client.transfer(&user2, &user3, &token_id);
    assert_eq!(client.owner_of(&token_id), user3);
    
    // user3 -> user1
    client.transfer(&user3, &user1, &token_id);
    assert_eq!(client.owner_of(&token_id), user1);
}

#[test]
fn total_supply_with_zero_tokens() {
    let env = Env::default();
    env.mock_all_auths();
    
    let admin = Address::generate(&env);
    let contract_id = env.register(PlayerCardContract, ());
    let client = PlayerCardContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    
    assert_eq!(client.total_supply(), 0);
}
