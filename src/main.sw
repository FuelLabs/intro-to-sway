contract;

use std::{
    storage::{
        StorageMap,
        StorageVec
    },
    constants::BASE_ASSET_ID,
    auth::{AuthError, msg_sender},
    call_frames::msg_asset_id,
    context::{ msg_amount },
    token::transfer,
    identity::Identity
};

struct Item {
    id: u64,
    price: u64,
    owner: Identity,
    metadata: str[20]
}

enum InvalidError {
    IncorrectAssetId: (),
    NotEnoughTokens: ()
}

abi SwayStore {
    #[storage(read, write)]
    fn list_item(price: u64, metadata: str[20]);

    #[storage(read, write)]
    fn buy_item(item_id: u64);
}

storage {
    // counter for total items listed
    item_counter: u64 = 0,

    // map of item IDs to Items
    item_map: StorageMap<u64, Item> = StorageMap{},

    // a vector of all purchases
    // stores the item ID and buyer identity for all purchases
    purchases: StorageVec<(u64, Identity)> = StorageVec{},

}


impl SwayStore for Contract {
    #[storage(read, write)]
    fn list_item(price: u64, metadata: str[20]){
        storage.item_counter = storage.item_counter + 1;
        let sender: Result<Identity, AuthError> = msg_sender();
        let new_item: Item = Item {
            id: storage.item_counter,
            price: price,
            owner: sender.unwrap(),
            metadata: metadata
        };

        storage.item_map.insert(storage.item_counter, new_item);
    }

    #[storage(read, write)]
    fn buy_item(item_id: u64){
        let asset_id = msg_asset_id();
        let amount = msg_amount();
        let item = storage.item_map.get(item_id);

        // require payment
        require(asset_id == BASE_ASSET_ID, InvalidError::IncorrectAssetId);
        require(amount >= item.price, InvalidError::NotEnoughTokens);

        let sender: Result<Identity, AuthError> = msg_sender();

        storage.purchases.push((item_id, sender.unwrap()));

          // send the payout
        transfer(amount, asset_id, item.owner);
    }
}
