// ANCHOR: rs_import
use fuels::{
    prelude::*, 
    client::FuelClient,
    types::{
        Bytes32,
        Identity, 
        SizedAsciiString
    }
};
use fuel_core_client::client::types::TransactionStatus;
// ANCHOR_END: rs_import

// ANCHOR: rs_abi
// Load abi from json
abigen!(Contract(name="SwayStore", abi="out/debug/test-contract-abi.json"));
// ANCHOR_END: rs_abi

// ANCHOR: rs_contract_instance_parent
async fn get_contract_instance() -> (SwayStore<WalletUnlocked>, ContractId, Vec<WalletUnlocked>) {
    // Launch a local network and deploy the contract
    let wallets = launch_custom_provider_and_get_wallets(
        WalletsConfig::new(
            Some(3),             /* Three wallets */
            Some(1),             /* Single coin (UTXO) */
            Some(1_000_000_000), /* Amount per coin */
        ),
        None,
        None,
    )
    .await
    .unwrap();

    let wallet = wallets.get(0).unwrap().clone();
    
    // ANCHOR: rs_contract_instance_config
    let id = Contract::load_from(
        "./out/debug/test-contract.bin",
        LoadConfiguration::default(),
    )
    .unwrap()
    .deploy(&wallet, TxPolicies::default())
    .await
    .unwrap();
    // ANCHOR_END: rs_contract_instance_config

    let instance = SwayStore::new(id.clone(), wallet);

    (instance, id.into(), wallets)
}

// ANCHOR: rs_get_tx_fee_helper
async fn get_tx_fee(client: &FuelClient, tx_id: &Bytes32) -> u64 {
    match client.transaction_status(tx_id).await.unwrap() {
        TransactionStatus::Success { total_fee, .. }
        | TransactionStatus::Failure { total_fee, .. } => total_fee,
        _ => 0,
    }
}
// ANCHOR_END: rs_get_tx_fee_helper
// ANCHOR_END: rs_contract_instance_parent

// ANCHOR: rs_test_set_owner
#[tokio::test]
async fn can_set_owner() {
    let (instance, _id, wallets) = get_contract_instance().await;

    // get access to a test wallet
    let wallet_1 = wallets.get(0).unwrap();

    // initialize wallet_1 as the owner
    let owner_result = instance
        .with_account(wallet_1.clone())
        .methods()
        .initialize_owner()
        .call()
        .await
        .unwrap();

    // make sure the returned identity matches wallet_1
    assert!(Identity::Address(wallet_1.address().into()) == owner_result.value);
}
// ANCHOR_END: rs_test_set_owner

// ANCHOR: rs_test_set_owner_once
#[tokio::test]
#[should_panic]
async fn can_set_owner_only_once() {
    let (instance, _id, wallets) = get_contract_instance().await;

    // get access to some test wallets
    let wallet_1 = wallets.get(0).unwrap();
    let wallet_2 = wallets.get(1).unwrap();

    // initialize wallet_1 as the owner
    let _owner_result = instance.clone()
        .with_account(wallet_1.clone())
        .methods()
        .initialize_owner()
        .call()
        .await
        .unwrap();

    // this should fail
    // try to set the owner from wallet_2
    let _fail_owner_result = instance.clone()
        .with_account(wallet_2.clone())
        .methods()
        .initialize_owner()
        .call()
        .await
        .unwrap();
}
// ANCHOR_END: rs_test_set_owner_once

// ANCHOR: rs_test_list_and_buy_item
#[tokio::test]
async fn can_list_and_buy_item() {
    let (instance, _id, wallets) = get_contract_instance().await;
    // Now you have an instance of your contract you can use to test each function

    // get access to some test wallets
    let wallet_1 = wallets.get(0).unwrap();
    let mut total_wallet_1_fees = 0;
    let wallet_1_starting_balance: u64 = wallet_1
        .get_asset_balance(&AssetId::zeroed())
        .await
        .unwrap();

    let wallet_2 = wallets.get(1).unwrap();
    let mut total_wallet_2_fees = 0;
    let wallet_2_starting_balance: u64 = wallet_2
        .get_asset_balance(&AssetId::zeroed())
        .await
        .unwrap();

    let provider = wallet_1.provider().unwrap().clone();
    let client = FuelClient::new(provider.url()).unwrap();

    // item 1 params
    let item_1_metadata: SizedAsciiString<20> = "metadata__url__here_"
        .try_into()
        .expect("Should have succeeded");
    let item_1_price: u64 = 15;

    // list item 1 from wallet_1
    let response = instance
        .clone()
        .with_account(wallet_1.clone())
        .methods()
        .list_item(item_1_price, item_1_metadata)
        .call()
        .await
        .unwrap();
    let tx = response.tx_id.unwrap();
    total_wallet_1_fees += get_tx_fee(&client, &tx).await;

    // call params to send the project price in the buy_item fn
    let call_params = CallParameters::default().with_amount(item_1_price);

    // buy item 1 from wallet_2
    let response = instance
        .clone()
        .with_account(wallet_2.clone())
        .methods()
        .buy_item(1)
        .with_variable_output_policy(VariableOutputPolicy::Exactly(1))
        .call_params(call_params)
        .unwrap()
        .call()
        .await
        .unwrap();
    total_wallet_2_fees += get_tx_fee(&client, &response.tx_id.unwrap()).await;

    // check the balances of wallet_1 and wallet_2
    let wallet_1_balance: u64 = wallet_1
        .get_asset_balance(&AssetId::zeroed())
        .await
        .unwrap();
    let wallet_2_balance: u64 = wallet_2
        .get_asset_balance(&AssetId::zeroed())
        .await
        .unwrap();

    // make sure the price was transferred from wallet_2 to
    assert_eq!(
        wallet_1_balance,
        wallet_1_starting_balance - total_wallet_1_fees + item_1_price
    );
    assert_eq!(
        wallet_2_balance,
        wallet_2_starting_balance - total_wallet_2_fees - item_1_price
    );

    let item_1 = instance.methods().get_item(1).call().await.unwrap();

    assert!(item_1.value.price == item_1_price);
    assert!(item_1.value.id == 1);
    assert!(item_1.value.total_bought == 1);
}
// ANCHOR_END: rs_test_list_and_buy_item

// ANCHOR: rs_test_withdraw_funds
#[tokio::test]
async fn can_withdraw_funds() {
    let (instance, _id, wallets) = get_contract_instance().await;
    // Now you have an instance of your contract you can use to test each function

    // get access to some test wallets
    let wallet_1 = wallets.get(0).unwrap();
    let mut total_wallet_1_fees = 0;
    let wallet_1_starting_balance: u64 = wallet_1
        .get_asset_balance(&AssetId::zeroed())
        .await
        .unwrap();

    let wallet_2 = wallets.get(1).unwrap();
    let mut total_wallet_2_fees = 0;
    let wallet_2_starting_balance: u64 = wallet_2
        .get_asset_balance(&AssetId::zeroed())
        .await
        .unwrap();

    let wallet_3 = wallets.get(2).unwrap();
    let mut total_wallet_3_fees = 0;
    let wallet_3_starting_balance: u64 = wallet_3
        .get_asset_balance(&AssetId::zeroed())
        .await
        .unwrap();

    let provider = wallet_1.provider().unwrap().clone();
    let client = FuelClient::new(provider.url()).unwrap();

    // initialize wallet_1 as the owner
    let response = instance
        .clone()
        .with_account(wallet_1.clone())
        .methods()
        .initialize_owner()
        .call()
        .await
        .unwrap();
    let tx = response.tx_id.unwrap();
    total_wallet_1_fees += get_tx_fee(&client, &tx).await;

    // make sure the returned identity matches wallet_1
    assert!(Identity::Address(wallet_1.address().into()) == response.value);

    // item 1 params
    let item_1_metadata: SizedAsciiString<20> = "metadata__url__here_"
        .try_into()
        .expect("Should have succeeded");
    let item_1_price: u64 = 150_000_000;

    // list item 1 from wallet_2
    let response = instance
        .clone()
        .with_account(wallet_2.clone())
        .methods()
        .list_item(item_1_price, item_1_metadata)
        .call()
        .await;
    assert!(response.is_ok());
    total_wallet_2_fees += get_tx_fee(&client, &response.unwrap().tx_id.unwrap()).await;

    // make sure the item count increased
    let count = instance.clone()
        .methods()
        .get_count()
        .simulate(Execution::default())
        .await
        .unwrap();
    assert_eq!(count.value, 1);

    // call params to send the project price in the buy_item fn
    let call_params = CallParameters::default().with_amount(item_1_price);
    
    // buy item 1 from wallet_3
    let response = instance.clone()
        .with_account(wallet_3.clone())
        .methods()
        .buy_item(1)
        .with_variable_output_policy(VariableOutputPolicy::Exactly(1))
        .call_params(call_params)
        .unwrap()
        .call()
        .await;
    assert!(response.is_ok());
    total_wallet_3_fees += get_tx_fee(&client, &response.unwrap().tx_id.unwrap()).await;

     // make sure the item's total_bought count increased
     let listed_item = instance
        .methods()
        .get_item(1)
        .simulate(Execution::default())
        .await
        .unwrap();
    assert_eq!(listed_item.value.total_bought, 1);

    // withdraw the balance from the owner's wallet
    let response = instance
        .with_account(wallet_1.clone())
        .methods()
        .withdraw_funds()
        .with_variable_output_policy(VariableOutputPolicy::Exactly(1))
        .call()
        .await;
    assert!(response.is_ok());
    total_wallet_1_fees += get_tx_fee(&client, &response.unwrap().tx_id.unwrap()).await;


    // check the balances of wallet_1 and wallet_2
    let balance_1: u64 = wallet_1.get_asset_balance(&AssetId::zeroed()).await.unwrap();
    let balance_2: u64 = wallet_2.get_asset_balance(&AssetId::zeroed()).await.unwrap();
    let balance_3: u64 = wallet_3.get_asset_balance(&AssetId::zeroed()).await.unwrap();

    assert!(balance_1 == wallet_1_starting_balance - total_wallet_1_fees + (item_1_price / 20)); // 5% commission
    assert!(balance_2 == wallet_2_starting_balance - total_wallet_2_fees + item_1_price - ((item_1_price / 20))); // sell price - 5% commission
    assert!(balance_3 == wallet_3_starting_balance - total_wallet_3_fees - item_1_price);
}
// ANCHOR_END: rs_test_withdraw_funds
