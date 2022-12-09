# Sway Store Contract

A Sway contract for a decentralized Amazon-like marketplace.

## Setup

Make sure you have the Rust and Fuel toolchains installed. Install the beta-2 toolchain distribution and set it as your default with:

```bash
$ fuelup toolchain install beta-2
$ fuelup default beta-2
```

You can check to see the current toolchain version installed by running the following:

```bash
$ fuelup show
```

Next, add the [Sway extension](https://marketplace.visualstudio.com/items?itemName=FuelLabs.sway-vscode-plugin) to your VS Code.

## Commands

You can build the Sway contract with `forc build`.

To run the tests in `harness.rs`, use `cargo test`. To print to the console from the tests, use `cargo test -- --nocapture`.

