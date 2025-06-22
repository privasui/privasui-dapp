## Install Sui cli

Before deploying your move code, ensure that you have installed the Sui CLI. You
can follow the [Sui installation instruction](https://docs.sui.io/build/install)
to get everything set up.

This template uses `testnet` by default, so we'll need to set up a testnet
environment in the CLI:

```bash
sui client new-env --alias testnet --rpc https://fullnode.testnet.sui.io:443
sui client switch --env testnet
```

If you haven't set up an address in the sui client yet, you can use the
following command to get a new address:

```bash
sui client new-address secp256k1
```

This well generate a new address and recover phrase for you. You can mark a
newly created address as you active address by running the following command
with your new address:

```bash
sui client switch --address 0xYOUR_ADDRESS...
```

We can ensure we have some Sui in our new wallet by requesting Sui from the
faucet (make sure to replace the address with your address):

```bash
curl --location --request POST 'https://faucet.testnet.sui.io/gas' \
--header 'Content-Type: application/json' \
--data-raw '{
    "FixedAmountRequest": {
        "recipient": "<YOUR_ADDRESS>"
    }
}'
```

## Publishing the move package

The move code for this template is located in the `move` directory. To publish
it, you can enter the `move` directory, and publish it with the Sui CLI:

```bash
cd move
sui client publish --gas-budget 100000000 counter
```

In the output there will be an object with a `"packageId"` property. You'll want
to save that package ID to the `src/constants.ts` file as `PACKAGE_ID`:

```ts
export const TESTNET_COUNTER_PACKAGE_ID = "<YOUR_PACKAGE_ID>";
```

Now that we have published the move code, and update the package ID, we can
start the app.

## Sui env
```bash

sui client envs                                                      ✔  13s 
╭─────────┬─────────────────────────────────────┬────────╮
│ alias   │ url                                 │ active │
├─────────┼─────────────────────────────────────┼────────┤
│ testnet │ https://fullnode.testnet.sui.io:443 │ *      │
│ mainnet │ https://fullnode.mainnet.sui.io     │        │
╰─────────┴─────────────────────────────────────┴────────╯

# sui configs are stored under ~/.sui/sui_config

sui client switch --env testnet
sui client switch --env mainnet

sui client new-env --alias mainnet --rpc https://fullnode.mainnet.sui.io
```


## Sui active address
```bash
sui client active-address
sui client switch --address <address>

# or generate new address
sui client new-address ed25519 pi word24

# or generate with the keytool 
sui keytool generate ed25519 "m/44'/784'/0'/0'/0'" word24

```

## Sui Package Publish 
```bash
sui client publish --gas-budget 100000000
```

## Update package
```bash
RUST_LOG=debug sui client upgrade --json-errors --gas-budget 100000000 --upgrade-capability  <UpgradeCapID> .
```

## List your gas coins 
```bash
sui client gas

╭────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│ Showing 11 gas coins and their balances.                                                                   │
├────────────────────────────────────────────────────────────────────┬────────────────────┬──────────────────┤
│ gasCoinId                                                          │ mistBalance (MIST) │ suiBalance (SUI) │
├────────────────────────────────────────────────────────────────────┼────────────────────┼──────────────────┤
│ 0x2b73ec0c0eea6f210fd554445fed59b19ece1619438b5e25775cfbef20d679f3 │ 92779336           │ 0.09             │
│ 0x2c7a7e90b01ef31cf9606e9e4cc16f5c33822e9f453d985eb420c26f70de6c07 │ 36066236           │ 0.03             │
│ 0x32a6a4caef9cfa367eefe56243cb44257e71c7be3fc0446c4f111b1b8384c0bd │ 21037972           │ 0.02             │
│ 0x4f26a88eebc00bab1f08a6e8372f4370aa95f5be59a3607db4f1b6cf916b3a63 │ 560001928          │ 0.56             │
│ 0x52a8cda8945c5fffbaf8e2a79763f172a01f490c1d8a0377b060f3fa19fe4ee7 │ 281773916          │ 0.28             │
│ 0x62e4751fb57dd9e9e651979d4fa39b19d7f4647e9790f807662f7eee8ee10bb6 │ 979947120          │ 0.97             │
│ 0x80143adb80622791bbed5f4194bdff3ee2d53f30c8f6c75949f8da7d2e3b2adb │ 1000000000         │ 1.00             │
│ 0x9b3af4d5a8ade6967f9e0cbfaf617ac2008c60b6ed05d392beb72540813da9c3 │ 804231140          │ 0.80             │
│ 0x9bcbe053d83138c32bb9fb983c6f6f6c9ef51691aa03626232e33d4044fd6c42 │ 1000000000         │ 1.00             │
│ 0xb438a27546c3ba71dd3f8ed25cb1944526bfbeb36865108bf9599c475bcad6bc │ 997889800          │ 0.99             │
│ 0xe4ae541b71255a5f7912cfd0f29f5cbce9e89f57f0672138a15634e1b706baa4 │ 1000000000         │ 1.00             │
├────────────────────────────────────────────────────────────────────┴────────────────────┴──────────────────┤
│ Showing 11 gas coins and their balances.                                                                   │
╰────────────────────────────────────────────────────────────────────────────────────────────────────────────╯

```

## Pay Sui
```bash
sui client pay-sui \
--input-coins <gas-coin-id> \
--recipients <recipeint_address> \
--amounts 7000000000 \
--gas-budget 10000000

sui client pay-sui \
--input-coins 0xe4ae541b71255a5f7912cfd0f29f5cbce9e89f57f0672138a15634e1b706baa4 \
--recipients 0xa26b9a77dcbb7c1964ce4a510dc3a0618d5e35fbbb9c13a8745367a3506bf0fd \
--amounts 850000000 \
--gas-budget 10000000
```

## Install Walrus
```bash
git clone https://github.com/MystenLabs/walrus.git 
cd walrus/setup
chmod +x ./walrus-install.sh

./walrus-install.sh -i /usr/local/bin -f -n testnet

./walrus-install.sh -i /usr/local/bin -f -n mainnet

# setup client config for walrus 
/root/.walrus/client_config.yaml

walrus info

# for testnet
walrus get-wal

```


## Sitebuilder

```bash

SYSTEM= # set this to your system: ubuntu-x86_64, ubuntu-x86_64-generic, macos-x86_64, macos-arm64, windows-x86_64.exe
curl https://storage.googleapis.com/mysten-walrus-binaries/site-builder-testnet-latest-$SYSTEM -o site-builder
chmod +x site-builder

```


```bash

RUST_LOG=debug site-builder --config ./site-config.yaml publish --epochs 2 --ws-resources ./ws-resources.json ./dist

RUST_LOG=debug site-builder --config ./site-config.yaml update --epochs 2 --ws-resources ./ws-resources.json ./dist 0x31b505bddc38af0efd12460730c700c0e9e22e18c675bbb43981214485c10043

# deployed site object id under mainnet is 0x31b505bddc38af0efd12460730c700c0e9e22e18c675bbb43981214485c10043

site-builder --config ./site-config.yaml convert 0x31b505bddc38af0efd12460730c700c0e9e22e18c675bbb43981214485c10043

site-builder --config ./site-config.yaml sitemap 0x31b505bddc38af0efd12460730c700c0e9e22e18c675bbb43981214485c10043

```

## Suivm 

```bash


# add --force to overwrite
cargo install --git https://github.com/origin-byte/suivm --force

# i.e  , not always working properly but we can fix the right SYSTEM to use ...
suivm use testnet

```