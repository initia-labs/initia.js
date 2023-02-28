# Initia.js

Initia Javascript SDK is a powerful toolkit designed for developers to easily interact with the Initia blockchain within JavaScript environments, such as Node.js and the browser. It offers a user-friendly interface for core data structures, serialization, key management, and API request generation, and is written in Typescript with type definitions.&#x20;

The library also includes support for key and address generation, enabling users to easily create and sign transactions.

## :dart: Main Features
* Use the library within Node.js, the browser, and React Native environments
* Improve user-friendly Typescript definitions with Initia core data structures integration
* Streamline key management, BCS serialization, and API requests with provided support 

## :bulb: Prerequisites

Initia.js library requires the installation of the following packages in order to function properly.

* node.js v14+
* npm&#x20;

## :computer: Installation

Before installation, check the latest version of [npm](https://www.npmjs.com/package/@initia/initia.js):&#x20;

```bash
npm install @initia/initia.js
```

## :toolbox: Usage&#x20;

The usage section of this document provides detailed explanations and code examples of the most commonly used classes of the Initia.js library, which can be utilized both in a Node.js environment and within a browser.

#### LCD client&#x20;

#### [**LCD**](initia-js.md#lcd-client)(Light Client Daemon) class facilitates interaction with the Initia blockchain.

```typescript
const lcd = new LCDClient({
	// The base URL to which LCD requests will be made.
  URL: "https://stone-rest.initia.tech/",
  // Chain ID of the blockchain to connect to.
  chainID: "stone-2",
  // Coins representing the default gas prices to use for fee estimation
  gasPrices: "0.005uinit",
  // Number presenting the default gas adjustment value to use for fee estimation.
  gasAdjustment: "2.0",
});
```

:information_source: `gasPrices` and `gasAdjustment`are optional, but essential for the fee estimation


#### Key

An abstract key interface that enables transaction signing and provides Bech32 address and public key derivation from a public key.&#x20;

```typescript
import { MnemonicKey, RawKey } from "@initia/initia.js";
import { CLIKey } from "@initia/initia.js/dist/key/CLIKey.js";

// There are three way to get Key
const MnemonicKey = new MnemonicKey({
    // option, if mnemonic is not defined, generate a new Mnemonic key
    mnemonic: "bird upset ...  evil cigar",
    // option, BIP44 account number. default = 0
    account: 0,
    // option: BIP44 index number. defualt = 0
    index: 0,
    // option: BIP44 coinType. default = 118
    coinType: 118,
  });
const rawKey = new RawKey(Buffer.from([0, 1, 2, 3 ...]);
// Get key from initiad
const cliKey = new CLIKey({ keyName: "name" });
```

#### BCS

#### [**BCS**](../learn/glossary.md#bcs-binary-canonical-serialization)(Binary Canonical Serialization) is the binary encoding for Move resources and other non-module values published on-chain.&#x20;

```typescript
import { BCS } from "@initia/initia.js";

  const bcs = BCS.getInstance();
  
  // serialize, serialize value to BCS and encode it to base64
  const serializedU64 = bcs.serialize("u64" /*type*/, 1234 /*value*/);
  
  // deserialize
  const deserializedU64 = bcs.deserialize(
    "u64", //type
    serializedU64 // base64 encoded and BCS serialize value
  );
  
  //Preregistered types : `u8`, `u16`, `u32`, `u64`, `u128`, `u256`,
  // `bool`, `vector`, `address`, `string`, `option`
  
  // vector
  const serializedVector = bcs.serialize("vector<u64>", [123, 456, 678]);
  
  // option
  const serializedSome = bcs.serialize("option<u64>", 123); // some
  const serializedNone = bcs.serialize("option<u64>", null); // none
```

#### Tx broadcasting&#x20;

* `MsgSend(myAddr, recipientAddr, "1000uinit")`.

```typescript
...
const sendMsg = new MsgSend(myAddr, recipientAddr, "1000uinit");
...
```

* `wallet` supports this to generate and sign transactions.

```typescript
...
const signedTx = await wallet.createAndSignTx({
  msgs: [sendMsg],
  // optional. If the fee is not given,
  // fee will be automatically filled by gas simulation using with
  // gas adjustment and gas price of LCDClient's config
  fee: new Fee(
    100000, // gas limit, the gas amount limit of the tx
    "100000uinit", // fee coin for gas, `gasLimit` * `gasPrice`
  ),
  memo: "sample memo",
});
...
```

* `broadcast` is the action that sends your transaction to the blockchain code.

```typescript
...
const broadcastResult = await lcd.tx.broadcast(signedTx);
...
```

#### Msg&#x20;

* `MsgSend()` Send coins to others.

```typescript
  const msg = new MsgSend(
    "init1123..", // sender address (type: AccAddress)
    "init1321..", // recipient address (type: AccAddress)
    "1000uinit", // send amount (type: Coins.Input)
  );
  
  // there are several ways to make Coins.Input
  // 1. an array of coin
  const coinArray = [new Coin("uinit", 1000), new Coin("denom", 1000), ...]
  // 2. Coins.AminoDict
  const aminoDict = {
    "init": 1000,
    "denom": 1000,
    ...
  }
  // 3. string
  const strCoins = "1000uinit,1000denom"
```

* `MsgDelegate()`

Delegate(Stake) governance coin to validators.

```typescript
const msg = new MsgDelegate(
  "init1123...", // delegator address (type: AccAddress)
  "init11321... ", // validator's operator address (type: ValAddress)
  new Coin("ulp", 100000), // delegate amount (type: Coin)
)
```

* `MsgUndelegate()`

Undelegate(Unstake) governance coin from validators.

```typescript
const msg = new MsgUndelegate(
  "init1123...", // delegator address (type: AccAddress)
  "init11321... ", // validator's operator address (type: ValAddress)
  new Coin("ulp", 100000), // undelegate amount (type: Coin)
);
```

* `MsgExecuteEntryFunction()`

Execute move contract function.

```typescript
const msg = new MsgExecuteEntryFunction(
  "init1123...", // sender address (type: AccAddress)
  "init1321...", // owner of the module (type: Accaddress)
  "dex", // name of the module (type: string)
  "swap_script", // function name
  // type arguments
  ["0x1::native_uinit::Coin", "0x2::module_name::AnotherCoin"],
  // arguments
  [bcs.serialize("u64", 10000), bcs.serialize("optoin<u64>", null)],
);

// Or you can use abi to generate Msg without knowing the type of arguments
const abi = await lcd.move.module(
  "init1321...", // owner of the module (type: Accaddress)
  "dex", // name of the module (type: string)
).then((res) => res.abi);

const msgGenWithAbi = MsgExecuteEntryFunction.fromPlainArgs(
  "init1123...", // sender address (type: AccAddress)
  "init1321...", // owner of the module (type: Accaddress)
  "dex", // name of the module (type: string)
  "swap_script" // function name
  // type arguments
  ["0x1::native_uinit::Coin", "0x2::module_name::AnotherCoin"],
  // arguments
  [10000, null],
)
```

#### :mortar\_board: How to read functions of Move&#x20;

```rust
// dex is the moudle name
module initia_std::dex {
    ...

   // move function
		
   // Only function that has `public entry` and doesn't have the return
   // can execute by `MsgExecuteEntryFunction`
   // `swap_script` is the function name
   // `OfferCoin` and `ReturnCoin` are type arguments.
   // There are three inputs, but the type `signer` will be filled in automatically
   // so in `MsgExecuteEntryFunction` you just have to fill `offer_coin_amount`
   // and `min_return`. You also can get types of input from the code.
   public entry fun swap_script<OfferCoin, ReturnCoin>(
	account: &signer,
	offer_coin_amount: u64,
	min_return: Option<u64>,
	) acquires Config, EventStore, Pool {
	  ...
	}
    ...
}
```

#### Queries&#x20;

* `balance()`

```typescript
const balances = await lcd.bank.balance("init1123...");
// return type: Coins.data
```

* `executeEntryfunction()`

Obtain the return values of a Move function that has a `public entry`.

```typescript
const res = await lcd.move
  .executeEntryFunction(
    '0x1', // owner of the module (type: Accaddress)
    'dex', // name of the module (type: string)
    'get_swap_simulation', // function name
    // type arguments
    ['0x1::native_uinit::Coin', '0x1::native_uusdc::Coin'],
    [bcs.serialize('u64', 10000)] // arguments
  )

// return type: { data: string }
```

