# initia.js
JavaScript SDK for Initia, written in TypeScript

## Main Features

* Improve user-friendly Typescript definitions with Initia core data structures integration
* Core Layer: Key management, BCS serialization, Support Initia.proto etc
* Client Layer: API request generation, LCD provider etc

## Prerequisites

Initia.js library requires the installation of the following packages in order to function properly.

* node.js v14+
* npm

## Installation

Before installation, check the latest version of [npm](https://www.npmjs.com/package/@initia/initia.js):&#x20;

```bash
npm install @initia/initia.js
```

## Usage;

The usage section of this document provides detailed explanations and code examples of the most commonly used classes of the Initia.js library, which can be utilized both in a Node.js environment and within a browser.

### LCD client&#x20;

**LCD**(Light Client Daemon) class facilitates interaction with the Initia blockchain.

```typescript
import { LCDClient } from '@initia/initia.js'

const lcd = new LCDClient('https://stone-rest.initia.tech/', {
    chainId: "stone-7",
    gasPrices: "0.005uinit", // default gas prices
    gasAdjustment: "2.0",  // default gas adjustment for fee estimation
});
```


> **`gasPrices`** and **`gasAdjustment`**are optional, but essential for the fee estimation


### Key

An abstract key interface that enables transaction signing and provides Bech32 address and public key derivation from a public key.&#x20;

```typescript
import { MnemonicKey } from "@initia/initia.js";

const key = new MnemonicKey({
    mnemonic: "bird upset ...  evil cigar", // (optional) if null, generate a new Mnemonic key
    account: 0, // (optional) BIP44 account number. default = 0
    index: 0, // (optional) BIP44 index number. defualt = 0
    coinType: 118, // (optional) BIP44 coinType. default = 118
});
```

### BCS

**BCS**(Binary Canonical Serialization) is the binary encoding for Move resources and other non-module values published on-chain. &#x20;

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

// vector
const serializedVector = bcs.serialize("vector<u64>", [123, 456, 678]);

// option
const serializedSome = bcs.serialize("option<u64>", 123); // some
const serializedNone = bcs.serialize("option<u64>", null); // none
```

**Support types for BCS**
> \`u8\`, \`u16\`, \`u32\`, \`u64\`, \`u128\`, \`u256\`, \`bool\`, \`vector\`, \`address\`, \`string\`, \`option\`


### Msg&#x20;

Msgs are object whose end-goal is to trigger state-transitions. They are wrapped in transactions, which may contain one or more of them.

* `MsgSend()`&#x20;

Send coins to others.

```typescript
import { MsgSend } from "@initia/initia.js";

const msg = new MsgSend(
    "init1kdwzpz3wzvpdj90gtga4fw5zm9tk4cyrgnjauu",   // sender address
    "init18sj3x80fdjc6gzfvwl7lf8sxcvuvqjpvcmp6np",   // recipient address
    "1000uinit",                                     // send amount
);
```

* `MsgDelegate()`

Delegate governance coin to validators (staking).

```typescript
import { MsgDelegate } from "@initia/initia.js";

const msg = new MsgDelegate(
    "init1kdwzpz3wzvpdj90gtga4fw5zm9tk4cyrgnjauu", // delegator address
    "init18sj3x80fdjc6gzfvwl7lf8sxcvuvqjpvcmp6np", // validator's operator addres
    "100000uinit",                                 // delegate amount
)
```

* `MsgUndelegate()`

Undelegate governance coin from validators (unstaking).

```typescript
import { MsgUndelegate } from "@initia/initia.js";

const msg = new MsgUndelegate(
    "init1kdwzpz3wzvpdj90gtga4fw5zm9tk4cyrgnjauu", // delegator address
    "init18sj3x80fdjc6gzfvwl7lf8sxcvuvqjpvcmp6np", // validator's operator addres
    "100000uinit",                                 // undelegate amount
)
```

* `MsgExecute()`

Execute move contract function.

```typescript
import { MsgExecute } from "@initia/initia.js";

const msg = new MsgExecute(
    "init1kdwzpz3wzvpdj90gtga4fw5zm9tk4cyrgnjauu",                     // sender address
    "init18sj3x80fdjc6gzfvwl7lf8sxcvuvqjpvcmp6np",                     // owner of the module
    "dex",                                                             // name of the module
    "swap_script",                                                     // function name
    ["0x1::native_uinit::Coin", "0x2::module_name::AnotherCoin"],      // type arguments
    [bcs.serialize("u64", 10000), bcs.serialize("optoin<u64>", null)], // arguments
);
```

### Tx broadcasting&#x20;

* `createAndSignTx()`

Create a wallet and sign transaction. &#x20;

```typescript
import { Wallet, LCDClient, MnemonicKey } from "@initia/initia.js";

const key = new MnemonicKey({
    mnemonic: 
        'moral wise tape glance grit gentle movie doll omit you pet soon enter year funny gauge digital supply cereal city ring egg repair coyote',
});

const lcd = new LCDClient('https://stone-rest.initia.tech/', {
  chainId: 'stone-7',
  gasPrices: '0.15uinit',
  gasAdjustment: '2.0',
});

const wallet = new Wallet(lcd, key);

const sendMsg = new MsgSend(
    "init14l3c2vxrdvu6y0sqykppey930s4kufsvt97aeu",   // sender address
    "init18sj3x80fdjc6gzfvwl7lf8sxcvuvqjpvcmp6np",   // recipient address
    "1000uinit",                                     // send amount
);

const signedTx = await wallet.createAndSignTx({
    msgs: [sendMsg],
    memo: "sample memo",
});
```

When sending coins with `MsgSend`, sender address should be same with wallet address.

* `broadcast()`

`broadcast()` is the action that sends your transaction to the blockchain code.

```typescript
const broadcastResult = await lcd.tx.broadcast(signedTx);
```

### Queries&#x20;

* `balance()`

Query the balance of the account.

```typescript
const balances = await lcd.bank.balance("init14l3c2vxrdvu6y0sqykppey930s4kufsvt97aeu");
```

* `viewfunction()`

Obtain the return values of a Move function that has a `public entry`.

```typescript
const res = await lcd.move
  .viewFunction(
    '0x1',                                                  // owner of the module
    'dex',                                                  // name of the module
    'get_swap_simulation',                                  // function name
    ['0x1::native_uinit::Coin', '0x1::native_uusdc::Coin'], // type arguments
    [bcs.serialize('u64', 10000)]                           // arguments
)
```