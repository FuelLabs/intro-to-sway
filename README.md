# Intro to Sway for JS Devs

If you know JavaScript, you can quickly learn to build full-stack dapps, or decentralized applications, on Fuel with Sway. Once you learn some Sway fundamentals, you'll be ready to start building your own dapp.

## TLDR

A Sway contract for a decentralized Amazon-like marketplace.

Make sure you have the Rust and Fuel toolchains installed. Install the beta-2 toolchain distribution and set it as your default.

You can build the Sway contract with `forc build`.

To run the tests in `harness.rs`, use `cargo test`. To print to the console from the tests, use `cargo test -- --nocapture`.

## What is Sway?

Sway is a strongly-typed programming language based on Rust used to write smart contracts on the Fuel blockchain. It inherits Rust's performance, control, and safety to use in a blockchain virtual machine environment optimized for gas costs and contract safety. 

Sway is backed by a powerful compiler and toolchain that work to abstract away complexities and ensure that your code is working, safe, and performant. 

Part of what makes Sway so unique is the fantastic suite of tools surrounding it that help you turn a contract into a full-stack dapp:


- 📚 Sway Standard Library: A native library of helpful types and methods.

- 🧰 Forc: The Fuel toolbox that helps you build, deploy, and manage your Sway projects.

- 🧑‍🔧 Fuelup: The official Fuel toolchain manager helps you install and manage versions. 

- 🦀 Fuels Rust SDK: Test and interact with your Sway contract with Rust.

- ⚡ Fuels Typescript SDK: Test and interact with your Sway contract with TypeScript.

- 🔭 Fuel Indexer: Easily make your own indexer to organize and query on-chain data.

You can use Sway to write contracts, scripts, predicates, and libraries for the Fuel network.

- 💼 A contract is a set of functions with persistent state that can be deployed on a blockchain. Once deployed, the contract lives on the blockchain and can never be changed or deleted. Anyone can access the state or call public functions without permission. 

- 📋 A script is a function that gets compiled into bytecode and passed into a transaction to be executed. It cannot be deployed or called like a contract and cannot store persistent state.

- 🔐 A predicate is a pure function that can return true or false, and is sent inside a transaction as bytecode and checked at transaction validity time. If it evaluates to false the transaction will not be processed, and no gas will be used. If it evaluates to true, any coins belonging to the address equal to the Merkle root of the predicate bytecode may be spent by the transaction.

- 📗 A library is a set of shareable code that can be used in a contract, script, or predicate.

## Dev Setup

Before diving into any Sway code, ensure you have installed the following dependencies.

Start by installing the [Rust toolchain](https://www.rust-lang.org/tools/install).

Then, install the [Fuel toolchain](https://github.com/FuelLabs/fuelup).

Install the beta-2 toolchain distribution and set it as your default with:

```bash
$ fuelup toolchain install beta-2
$ fuelup default beta-2
```

You can check to see the current toolchain version installed by running the following:

```bash
$ fuelup show
```

Next, add the [Sway extension](https://marketplace.visualstudio.com/items?itemName=FuelLabs.sway-vscode-plugin) to your VS Code.

## Writing a Contract

> This example uses the `beta-2` toolchain, which is version `0.31.1` of `forc` and version `0.14.1` of `fuel-core`.

Let's make a Sway contract for an online marketplace like Amazon, where sellers can list products, buyers can buy them, and the marketplace takes a cut of each purchase.

Part of what makes smart contracts so powerful is that they are immutable and permissionless. This means that unless you build a function to remove an item or block certain users, no one will be able to delist any item or deny any users. Likewise, if we hard-code a commission amount in the contract, no one can ever change the commission taken for products. 

On top of this, anyone can interact with the contract. This means that anyone can make a frontend for your contract without permission, and contracts can interact with any number of frontends.

We can start by creating a new folder called `sway-store`, and making a new contract called `sway-store-contract`. 

```bash
$ mkdir sway-store
$ cd sway-store
$ forc new sway-store-contract
```

Open up the `sway-store-contract` folder in VS Code, and inside the `src` folder you should see a file called `main.sw`. This is where you will write your Sway contract. You can delete everything in this file.

The first line of the file is specially reserved to let the compiler know if we are writing a contract, script, predicate, or library. To define the file as a contract, use the `contract` keyword.

```rust
contract;
```

### Imports

The Sway standard library provides several utility types and methods we can use in our contract. To import a library, you can use the `use` keyword and `::`, also called a namespace qualifier, to chain library names like this:

```rust
// imports the Address type from the std library
use std::address::Address;
```

You can also group together imports using curly brackets:

```rust
use std::{
    address::Address,
    storage::StorageMap,
}
```

For this contract, here is what needs to be imported:

```rust
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
```
We'll go through what each of these imports does as we use them later.

### Item Struct

Struct is short for structure, which is a data structure similar to an object in JavaScript. You define a struct with the `struct` keyword and define the fields of a struct inside curly brackets.

The core of our program is the ability to list, sell, get, etc. `items`.

You can define the `Item` type as shown below:

```rust
struct Item {
    id: u64,
    price: u64,
    owner: Identity,
    metadata: str[20],
    total_bought: u64,
}
```

The item struct will hold an ID, price, the owner's identity, a string for a URL or identifier where off-chain data about the item is stored (such as the description and photos), and a counter for the total number of purchases.

#### Types

The `Item` struct uses three types: `u64`, `str[20]`, and `Identity`.

`u64`: a 64-bit unsigned integer

In Sway, there are four native types of numbers:
- `u8`: an 8-bit unsigned integer
- `u16` a 16-bit unsigned integer
- `u32` a 32-bit unsigned integer
- `u64`: a 64-bit unsigned integer

An unsigned integer means there is no `+` or `-` sign, so the value is always positive. `u64` is the default type used for numbers in Sway. To use other number types, for example [`u256`](https://github.com/FuelLabs/sway/blob/master/sway-lib-std/src/u256.sw) or [signed integers](https://github.com/FuelLabs/sway-libs/tree/master/sway_libs/src/signed_integers), you must import them from a library.

In JavaScript, there are two types of integers: a number and a BigInt. The main difference between these types is that BigInt can store a much larger value. Similarly, each number type for Sway has different values for the largest number that can be stored.

`str[20]`: a string with exactly 20 characters. All strings in Sway must have a fixed length. 

`Identity`: an enum type that represents either a user's `Address` or a `ContractId`. We already imported this type from the standard library earlier.

### ABI

Next, we will define our ABI. ABI stands for application binary interface. In a Sway contract, it's an outline of all of the functions in the contract. For each function, you must specify its name, input types, return types, and level of storage access. 

Our contract's ABI will look like this:

```rust
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
}
``` 

#### Functions

A function is defined with the `fn` keyword. Sway uses snake case, so instead of naming a function `myFunction`, you would use `my_function`.

You must define the return type using a skinny arrow if the function returns anything. If there are any parameters, the types must also be defined for those. Semicolons are *required* at the end of each line.

If any function reads from or writes to storage, you must define that level of access above the function with either `#[storage(read)]` or `#[storage(read, write)]`.

### Storage Block

Next, we can add the storage block. The storage block is where you can store any state variables in your contract that you want to be persistent. Any Sway primitive type can be stored in the storage block.

Any variables declared inside a function and not saved in the storage block will be destroyed when the function finishes executing.

```rust
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
```

The first variable we have stored is `item_counter`, a number initialized to 0. You can use this counter to track the total number of items listed.

#### StorageMap
A StorageMap is a special type that allows you to save key-value pairs inside a storage block. 

To define a storage map, you must specify the type for the key and value. For example, below, the type for the key is `u64`, and the type for the value is an `Item` struct.

```rust
item_map: StorageMap<u64, Item> = StorageMap{}
```

Here, we are saving a mapping of the item's ID to the Item struct. With this, we can look up information about an item with the ID. 

#### Tuples

Tuples are like immutable, fixed-length arrays with predefined types at each index. You use parentheses to define a tuple:

```rust
let my_tuple: (u64, bool) = (5, true);
```

#### Storage Vector

A `StorageVec`, or storage vector, is also a type you can use only in a storage block. It works a lot like an array in JavaScript. 

To define a storage vector, specify the type that will be stored inside. For example, below, `purchases` will hold a vector of tuples that save a `u64` and an `Identity`, representing the item ID purchased and the `Address` or `ContractId` that bought the item.

```rust
purchases: StorageVec<(u64, Identity)> = StorageVec{}
```

#### Options

Here we are setting the variable `owner` as a variable that could be `None` or could store an `Identity`.

```rust
owner: Option<Identity> = Option::None
```

If you want a value to be null or undefined under certain conditions, you can use an `Option` type, which is an enum that can be either Some(value) or None. The keyword `None` represents that no value exists, while the keyword `Some` means there is some value stored.

### Error Handling

Enumerations, or enums, are a type that can be one of several variations. In our contract, you can use an enum to create custom errors to handle errors in a function. 

```rust
enum InvalidError {
    IncorrectAssetId: (),
    NotEnoughTokens: u64,
    OnlyOwner: (),
    OwnerNotInitialized: (),
    OwnerAlreadyInitialized: (),
    IncorrectItemID: ()
}
```

In our contract, we can expect there to be some different situations where we want to throw an error and prevent the transaction from executing: 
1. Someone could try to pay for an item with the wrong currency.
2. Someone could try to buy an item without having enough coins.
3. Someone could try to withdraw funds from the contract who isn't the owner. 
4. Someone could try to withdraw funds before the owner has been initialized.
5. Someone could try to set the owner after the owner has already been initialized.
6. Someone could try to buy an item that doesn't exist.

We can define the return type for a variation with the unit type `()`, or empty tuple, which means no other value is returned, to label the error reason. For the `NotEnoughTokens` variation, we can return the number of coins by defining the return type as a `u64`.

### Contract Functions

Finally, we can write our contract functions. Copy and paste the ABI from earlier. The functions in the contract *must* match the ABI, or the compiler will throw an error. Replace the semicolons at the end of each function with curly brackets, and change `abi SwayStore` to `impl SwayStore for Contract` as shown below:

```rust
impl SwayStore for Contract {
    #[storage(read, write)]
    fn list_item(price: u64, metadata: str[20]){
        
    }

    #[storage(read, write)]
    fn buy_item(item_id: u64) {
        
    }

    #[storage(read)]
    fn get_item(item_id: u64) -> Item {
        
    }

    #[storage(read, write)]
    fn initialize_owner() -> Identity {
        
    }

    #[storage(read)]
    fn withdraw_funds(){
        
    }
}
```

### Listing an item

Our first function allows sellers to list an item for sale. They can set the item's price and a string that points to some externally-stored data about the item. 

```rust
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
```

#### Updating storage

The first step is incrementing the `item_counter` from storage so we can use it as the item's ID. 

```rust
storage.item_counter = storage.item_counter + 1;
```

#### Getting the message sender

Next, we can get the `Identity` of the account listing the item.

To define a variable in Sway, you can use `let` or `const`. Types must be declared where they cannot be inferred by the compiler.

To get the `Identity`, you can use the `msg_sender` function imported from the standard library. This function returns a `Result`, which is an enum type that is either OK or an error. The `Result` type is used when a value that could potentially be an error is expected.

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

The `msg_sender` function returns a `Result` that is either an `Identity` or an `AuthError` (imported from the standard library) in the case of an error.

```rust
let sender: Result<Identity, AuthError> = msg_sender();
```

To access the inner returned value, you can use the `unwrap` method, which returns the inner value if the `Result` is OK, and panics if the result is an error.

#### Creating a new item

We can create a new item using the `Item` struct. Use the `item_counter` value from storage for the ID, set the price and metadata as the input parameters, and set `total_bought` to 0. 

Because the `owner` field requires a type `Identity`, you can use the `unwrap` method on the `Result` type to get the `Identity` returned from `msg_sender()`.

```rust
 let new_item: Item = Item {
    id: storage.item_counter,
    price: price,
    owner: sender.unwrap(),
    metadata: metadata,
    total_bought: 0,
};
```

#### Updating a StorageMap

Finally, you can add the item to the `item_map` in the storage using the `insert` method. You can use the same ID for the key and set the item as the value.

```rust
storage.item_map.insert(storage.item_counter, new_item);
```

### Buying an item

Next, we want buyers to be able to buy an item that has been listed, which means we will need to:
- accept the item ID as a function parameter
- make sure the buyer is paying the right price and using the right coins
- increment the `total_bought` count for the item
- add the purchase to the `purchases` storage vector
- transfer the cost of the item to the seller minus some fee that the contract will keep

```rust
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
```

#### Verifying payment

We can use the `msg_asset_id` function imported from the standard library to get the asset ID of the coins being sent in the transaction. 

```rust
let asset_id = msg_asset_id();
```

Then, we can use a `require` statement to assert that the asset sent is the right one.

A `require` statement takes two arguments: a condition and a value that gets logged if the condition is false. If false, the entire transaction will be reverted, and no changes will be applied. 

Here the condition is that the `asset_id` must be equal to the `BASE_ASSET_ID`, which is the default asset used for the base blockchain that we imported from the standard library.
 
If the asset is any different, or, for example, someone tries to buy an item with another coin, we can throw the custom error that we defined earlier.

```rust
require(asset_id == BASE_ASSET_ID, InvalidError::IncorrectAssetId);
```

Next, we can use the `msg_amount` function from the standard library to get the number of coins sent from the buyer.

```rust
let amount = msg_amount();
```

To check that this amount isn't less than the item's price, we need to look up the item details using the `item_id` parameter.

To get a value for a particular key in a storage map, we can use the `get` method and pass in the key value. If nothing has previously been stored for a key, this method will return a zero value of the same expected type. That means if someone passes an item ID to the function that hasn't been claimed, an Item struct of zero-equivalent values will be returned.


```rust
let mut item = storage.item_map.get(item_id);
```

By default, all variables are immutable in Sway for both `let` and `const`. However, if you want to change the value of any variable, you have to declare it as mutable with the `mut` keyword. Because we'll update the item's `total_bought` value later, we need to define it as mutable.

We'll want to ensure that the `item_id` passed is valid. Because the `get` method will return an Item struct with values of zero if the `item_id` is not valid, and the item ID of `0` is never used, we can check to see if the ID of the returned item is greater than zero to make sure the Item struct returned is valid.

```rust
require(item.id > 0, InvalidError::IncorrectItemID);
```

We also want to require that the number of coins sent to buy the item isn't less than the item's price.

```rust
require(amount >= item.price, InvalidError::NotEnoughTokens(amount));
```
#### Updating storage

We can increment the value for the item's `total_bought` field and then re-insert it into the `item_map`. This will overwrite the previous value with the updated item.

```rust
item.total_bought += 1;
storage.item_map.insert(item_id, item);
```

We'll use the `msg_sender` function again to get the buyer's identity. Then, we can use the `push` method on the `StorageVec` to add a tuple with the item ID and the buyer's Identity to the `purchases` storage vector.

```rust
let sender: Result<Identity, AuthError> = msg_sender();
storage.purchases.push((item_id, sender.unwrap()));
```

#### Transferring payment

Finally, we can transfer the payment to the seller. It's always best to transfer assets after all storage updates have been made to avoid [re-entrancy attacks](https://fuellabs.github.io/sway/v0.32.1/book/blockchain-development/calling_contracts.html).

We can subtract a fee for items that meet a certain price threshold using a conditional `if` statement. `if` statements in Sway don't use parentheses around the conditions, but otherwise look the same as in JavaScript.

```rust
if amount > 1_000 {
    let commission = amount / 20;
    let new_amount = amount - commission;
    transfer(new_amount, asset_id, item.owner);
} else {
    transfer(amount, asset_id, item.owner);
}
```

In the if-condition above, we check if the amount sent exceeds 1,000. To visually separate a large number like `1000`, we can use an underscore, like `1_000`.

If the amount exceeds 1,000, we calculate a commission and subtract that from the amount.

We can use the `transfer` function to send the amount to the item owner. The `transfer` function is imported from the standard library and takes three arguments: the number of coins to transfer, the asset ID of the coins, and an Identity to send the coins to. 

### Get an item

To get the details for an item, we can create a read-only function that returns the `Item` struct for a given item ID.

```rust
#[storage(read)]
fn get_item(item_id: u64) -> Item {
    // returns the item for the given item_id
    storage.item_map.get(item_id)
}
```

To return a value in a function, you can either use the `return` keyword just as you would in JavaScript or omit the semicolon in the last line to return that line.

```rust
fn my_function(num: u64) -> u64{
    // returning the num variable
    num
    
    // this would also work:
    // return num;
}
```

### Initialize the owner

To make sure we are setting the owner `Identity` correctly, instead of hard-coding it, we can use this function to set the owner from a wallet.

```rust
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
```

Because we only want to be able to call this function once (right after the contract is deployed), we'll require that the owner value still needs be `None`. To do that, we can use the `is_none` method, which checks if an Option type is `None`. 

```rust
let owner = storage.owner;
require(owner.is_none(), InvalidError::OwnerAlreadyInitialized);
```

To set the `owner` as the message sender, we'll need to convert the `Result` type to an `Option` type.

```rust
let sender: Result<Identity, AuthError> = msg_sender(); 
storage.owner = Option::Some(sender.unwrap());
```

Last, we'll return the message sender's `Identity`.

```rust
sender.unwrap()
```

### Withdraw funds

The last function allows the owner to withdraw the funds that the contract has accrued.

```rust
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
```

First, we'll ensure that the owner has been initalized to some address.

```rust
let owner = storage.owner;
require(owner.is_some(), InvalidError::OwnerNotInitialized);
```

Next, we will require that the person trying to withdraw the funds is the owner.

```rust
let sender: Result<Identity, AuthError> = msg_sender(); 
require(sender.unwrap() == owner.unwrap(), InvalidError::OnlyOwner);
```

We can also ensure that there are funds to send using the `this_balance` function from the standard library, which returns the balance of this contract.

```rust
let amount = this_balance(BASE_ASSET_ID);
require(amount > 0, InvalidError::NotEnoughTokens(amount));
```

Finally, we will transfer the balance of the contract to the owner.

```rust
transfer(amount, BASE_ASSET_ID, owner.unwrap());
```

## Testing the contract

You can compile your contract by running `forc build` in the contract folder. And that's it! You just wrote an entire contract in Sway 💪🛠🔥🚀🎉😎🌴✨.

You can see the complete code for this contract plus example tests using the Rust SDK in this repo.

To run the tests in `harness.rs`, use `cargo test`. To print to the console from the tests, use `cargo test -- --nocapture`.

## Keep building on Fuel

Ready to keep building? You can dive deeper into Sway and Fuel in the resources below:

📘 [Read the Sway Book](https://fuellabs.github.io/sway)

✨ [Build a frontend with the TypeScript SDK](https://fuellabs.github.io/fuels-ts/)

🦀 [Write tests with the Rust SDK](https://fuellabs.github.io/fuels-rs/)

🔧 [Learn how to use Fuelup](https://fuellabs.github.io/fuelup/latest)

🏃‍ [Follow the Fuel Quickstart](https://fuellabs.github.io/fuel-docs/master/developer-quickstart.html)

📖 [See Example Sway Applications](https://github.com/FuelLabs/sway-applications)

⚡️ [Learn about Fuel](https://fuellabs.github.io/fuel-docs/master/)

🐦 [Follow Sway Language on Twitter](https://twitter.com/SwayLang)

👾 [Join the Fuel Discord](http://discord.com/invite/xfpK4Pe)
