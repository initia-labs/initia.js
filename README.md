# initia.js
Initia.js is a TypeScript-written JavaScript SDK tailored for the Initia blockchain, enhancing the development experience with user-friendly TypeScript definitions and integration with Initia's core data structures.

## Main Features
- **Improved TypeScript Definitions**: Offers comprehensive integration with Initia core data structures for an enhanced developer experience.
- **Core Layer**: Includes key management, BCS serialization, and support for initia.proto.
- **Client Layer**: Facilitates API request generation and REST provider interaction.


## Installation

Before installation, check the latest version of [npm](https://www.npmjs.com/package/@initia/initia.js):&#x20;

```bash
npm install @initia/initia.js
```

## Usage

The usage section of this document provides detailed explanations and code examples of the most commonly used classes of the Initia.js library, which can be utilized both in a Node.js environment and within a browser.

### REST client&#x20;

**REST**(previously LCD) class facilitates interaction with the Initia blockchain.

```typescript
import { RESTClient } from '@initia/initia.js'

const rest = new RESTClient('https://rest.testnet.initia.xyz', {
    chainId: 'initiation-2',
    gasPrices: '0.15uinit', // default gas prices
    gasAdjustment: '1.75',  // default gas adjustment for fee estimation
})
```


> **`gasPrices`** and **`gasAdjustment`**are optional, but essential for the fee estimation


### Key

An abstract key interface that enables transaction signing and provides Bech32 address and public key derivation from a public key.&#x20;

```typescript
import { MnemonicKey } from '@initia/initia.js'

const key = new MnemonicKey({
    mnemonic: 'bird upset ...  evil cigar', // (optional) if null, generate a new Mnemonic key
    account: 0, // (optional) BIP44 account number. default = 0
    index: 0, // (optional) BIP44 index number. default = 0
    coinType: 60, // (optional) BIP44 coinType. default = 60
})
```

### BCS

**BCS**(Binary Canonical Serialization) is the binary encoding for Move resources and other non-module values published on-chain. &#x20;

```typescript
import { bcs } from '@initia/initia.js'

// serialize, serialize value to BCS and encode it to base64
const serializedU64 = bcs
    .u64() // type
    .serialize(1234) // value 
    .toBase64()

// deserialize
const deserializedU64 = bcs
    .u64() // type
    .parse(Uint8Array.from(Buffer.from(serializedU64, 'base64')))

// vector
const serializedVector = bcs
    .vector(bcs.u64())
    .serialize([123, 456, 789])
    .toBase64()

// option
const serializedSome = bcs.option(bcs.u64()).serialize(123)
const serializedNone = bcs.option(bcs.u64()).serialize(null)
```

**Support types for BCS**
> \`u8\`, \`u16\`, \`u32\`, \`u64\`, \`u128\`, \`u256\`, \`bool\`, \`vector\`, \`address\`, \`string\`, \`option\`, \`fixed_point32\`, \`fixed_point64\`, \`decimal128\`, \`decimal256\`

### Msg&#x20;

Msgs are objects whose end-goal is to trigger state-transitions. They are wrapped in transactions, which may contain one or more of them.

* `MsgSend()`&#x20;

Send coins to others.

```typescript
import { MsgSend } from '@initia/initia.js'

const msg = new MsgSend(
    'init1kdwzpz3wzvpdj90gtga4fw5zm9tk4cyrgnjauu',   // sender address
    'init18sj3x80fdjc6gzfvwl7lf8sxcvuvqjpvcmp6np',   // recipient address
    '1000uinit',                                     // send amount
)
```

* `MsgDelegate()`

Delegate governance coin to validators (staking).

```typescript
import { MsgDelegate } from '@initia/initia.js'

const msg = new MsgDelegate(
    'init1kdwzpz3wzvpdj90gtga4fw5zm9tk4cyrgnjauu', // delegator address
    'init18sj3x80fdjc6gzfvwl7lf8sxcvuvqjpvcmp6np', // validator's operator address
    '100000uinit',                                 // delegate amount
)
```

* `MsgUndelegate()`

Undelegate governance coin from validators (unstaking).

```typescript
import { MsgUndelegate } from '@initia/initia.js'

const msg = new MsgUndelegate(
    'init1kdwzpz3wzvpdj90gtga4fw5zm9tk4cyrgnjauu', // delegator address
    'init18sj3x80fdjc6gzfvwl7lf8sxcvuvqjpvcmp6np', // validator's operator address
    '100000uinit',                                 // undelegate amount
)
```

* `MsgExecute()`

Execute move contract function.

```typescript
import { MsgExecute } from '@initia/initia.js'

const msg = new MsgExecute(
    'init1kdwzpz3wzvpdj90gtga4fw5zm9tk4cyrgnjauu', // sender address
    '0x1',                                         // owner of the module
    'dex',                                         // name of the module
    'swap_script',                                 // function name
    [],                                            // type arguments
    [                                              
        bcs.address().serialize('0x2').toBase64(), // arguments, BCS-encoded
        bcs.address().serialize('0x3').toBase64(), // arguments, BCS-encoded
        bcs.u64().serialize(10000).toBase64()      // arguments, BCS-encoded
    ]
)
```

### Tx broadcasting&#x20;

* `createAndSignTx()`

Create a wallet and sign transaction. &#x20;

```typescript
import { Wallet, RESTClient, MnemonicKey } from '@initia/initia.js'

const key = new MnemonicKey({
    mnemonic: 
        'moral wise tape glance grit gentle movie doll omit you pet soon enter year funny gauge digital supply cereal city ring egg repair coyote',
})

const rest = new RESTClient('https://rest.testnet.initia.xyz', {
    chainId: 'initiation-2',
    gasPrices: '0.15uinit', // default gas prices
    gasAdjustment: '1.75',  // default gas adjustment for fee estimation
})

const wallet = new Wallet(rest, key)

const sendMsg = new MsgSend(
    'init14l3c2vxrdvu6y0sqykppey930s4kufsvt97aeu',   // sender address
    'init18sj3x80fdjc6gzfvwl7lf8sxcvuvqjpvcmp6np',   // recipient address
    '1000uinit',                                     // send amount
)

const signedTx = await wallet.createAndSignTx({
    msgs: [sendMsg],
    memo: 'sample memo',
})
```

When sending coins with `MsgSend`, sender address should be the same as wallet address.

* `broadcast()`

`broadcast()` is the action that sends your transaction to the blockchain code.

```typescript
const broadcastResult = await rest.tx.broadcast(signedTx)
```

### Queries&#x20;

* `balance()`

Query the balance of the account.

```typescript
const balances = await rest.bank.balance('init14l3c2vxrdvu6y0sqykppey930s4kufsvt97aeu')
```

* `viewfunction()`

Obtain the return values of a Move view function.

```typescript
const res = await rest.move.viewFunction(
    '0x1',                                         // owner of the module
    'dex',                                         // name of the module
    'get_swap_simulation',                         // function name
    [],                                            // type arguments
    [       
        bcs.address().serialize('0x2').toBase64(), // arguments, BCS-encoded
        bcs.address().serialize('0x3').toBase64(), // arguments, BCS-encoded
        bcs.u64().serialize(10000).toBase64()      // arguments, BCS-encoded
    ]                           
)
```
