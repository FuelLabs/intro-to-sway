contract;

use std::{
    auth::{
        AuthError,
        msg_sender,
    },
    call_frames::msg_asset_id,
    constants::BASE_ASSET_ID,
    context::{
        msg_amount,
        this_balance,
    },
    identity::Identity,
    storage::{
        StorageMap,
        StorageVec,
    },
    token::transfer,
};

struct Item {
    id: u64,
    price: u64,
    owner: Identity,
    metadata: str[20],
    total_bought: u64,
}

abi SwayStore {
    // a function to list an item for sale
    // takes the price and metadata as args
    #[storage(read, write)]
    fn list_item(price: u64, metadata: str[20]);

    // a function to buy an item
    // takes the item id as the arg
    #[storage(read, write)]
    fn buy_item(item_id: u64);

    // a function to get a certain item
    #[storage(read)]
    fn get_item(item_id: u64) -> Item;

    // a function to set the contract owner
    #[storage(read, write)]
    fn initialize_owner() -> Identity;

    // a function to withdraw contract funds
    #[storage(read)]
    fn withdraw_funds();

    #[storage(read)]
    fn get_count() -> u64;
}

storage {
    // counter for total items listed
    item_counter: u64 = 0,
    // map of item IDs to Items
    item_map: StorageMap<u64, Item> = StorageMap {},
    // a vector of all purchases
    // stores the item ID and buyer identity for all purchases
    purchases: StorageVec<(u64, Identity)> = StorageVec {},
    owner: Option<Identity> = Option::None,
}

enum InvalidError {
    IncorrectAssetId: (),
    NotEnoughTokens: u64,
    OnlyOwner: (),
    OwnerNotInitialized: (),
    OwnerAlreadyInitialized: (),
    IncorrectItemID: ()
}

impl SwayStore for Contract {
    #[storage(read, write)]
    fn list_item(price: u64, metadata: str[20]) {
        // increment the item counter
        storage.item_counter = storage.item_counter + 1;
        //  get the message sender
        let sender: Result<Identity, AuthError> = msg_sender();
        // configure the item
        let new_item: Item = Item {
            id: storage.item_counter,
            price: price,
            owner: sender.unwrap(),
            metadata: metadata,
            total_bought: 0,
        };
        // save the new item to storage using the counter value
        storage.item_map.insert(storage.item_counter, new_item);
    }

    #[storage(read, write)]
    fn buy_item(item_id: u64) {
        // get the asset id for the asset sent
        let asset_id = msg_asset_id();
        // require that the correct asset was sent
        require(asset_id == BASE_ASSET_ID, InvalidError::IncorrectAssetId);

        // get the amount of coins sent
        let amount = msg_amount();
        // get the item to buy
        let mut item = storage.item_map.get(item_id);
        // require the item to be set
        require(item.id > 0, InvalidError::IncorrectItemID);
        // require that the amount is at least the price of the item
        require(amount >= item.price, InvalidError::NotEnoughTokens(amount));

        // update the total amount bought
        item.total_bought += 1;
        // update the item in the storage map
        storage.item_map.insert(item_id, item);

        // get the identity of the sender
        let sender: Result<Identity, AuthError> = msg_sender();

        // add the purchase to the storage vector
        storage.purchases.push((item_id, sender.unwrap()));
        // only charge commission if price is more than 1,000
        if amount > 1_000 {
            // for every 100 coins, the contract keeps 5
            let commission = amount / 20;
            let new_amount = amount - commission;
            // send the payout minus commission to the seller
            transfer(new_amount, asset_id, item.owner);
        } else {
            // send the full payout to the seller
            transfer(amount, asset_id, item.owner);
        }
    }

    #[storage(read)]
    fn get_item(item_id: u64) -> Item {
        // returns the item for the given item_id
        storage.item_map.get(item_id)
    }

    #[storage(read, write)]
    fn initialize_owner() -> Identity {
        let owner = storage.owner;
        // make sure the owner has NOT already been initialized
        require(owner.is_none(), InvalidError::OwnerAlreadyInitialized);
        // get the identity of the sender
        let sender: Result<Identity, AuthError> = msg_sender(); 
        // set the owner to the sender's identity
        storage.owner = Option::Some(sender.unwrap());
        // return the owner
        sender.unwrap()
    }

    #[storage(read)]
    fn withdraw_funds() {
        let owner = storage.owner;
        // make sure the owner has been initialized
        require(owner.is_some(), InvalidError::OwnerNotInitialized);
        let sender: Result<Identity, AuthError> = msg_sender(); 
        // require the sender to be the owner
        require(sender.unwrap() == owner.unwrap(), InvalidError::OnlyOwner);

        // get the current balance of this contract for the base asset
        let amount = this_balance(BASE_ASSET_ID);

        // require the contract balance to be more than 0
        require(amount > 0, InvalidError::NotEnoughTokens(amount));
        // send the amount to the owner
        transfer(amount, BASE_ASSET_ID, owner.unwrap());
    }

    #[storage(read)]
    fn get_count() -> u64{
        storage.item_counter
    }
}
