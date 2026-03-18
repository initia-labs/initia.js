# @initia/ledger-key

Ledger hardware wallet support for [initia.js](https://github.com/initia-labs/initia.js) v2.

## Supported Apps

| Ledger App | Sign Mode | Coin Type | Notes |
|------------|-----------|-----------|-------|
| Ethereum | EIP-191 | 60 | Recommended. Uses `signPersonalMessage` internally. |
| Cosmos | Amino | 118 | For wallets that require Cosmos-native signing. |

## Installation

```bash
npm install @initia/ledger-key
```

Peer dependency: `initia.js@^2`

## Quick Start

### Ethereum app (recommended)

```typescript
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid'
import { LedgerKey } from '@initia/ledger-key'
import { createInitiaContext, coin } from 'initia.js'

const transport = await TransportNodeHid.create()
const key = await LedgerKey.createEthereumApp(transport)

console.log('Address:', key.address)        // init1...
console.log('EVM:', key.evmAddress)          // 0x...
console.log('Path:', key.getPath())          // m/44'/60'/0'/0/0

const ctx = await createInitiaContext({ network: 'mainnet', signer: key })
const result = await ctx.signAndBroadcast([
  ctx.msgs.bank.send({
    fromAddress: key.address,
    toAddress: 'init1recipient...',
    amount: [coin('uinit', '1000000')],
  }),
])
console.log('Tx:', result.txHash)
```

### Cosmos app

```typescript
const key = await LedgerKey.createCosmosApp(transport)
// Signs with SIGN_MODE_LEGACY_AMINO_JSON
// Uses coin type 118 by default
```

### Options

```typescript
const key = await LedgerKey.createEthereumApp(transport, {
  index: 1,       // Account index (default: 0)
  coinType: 60,   // BIP44 coin type (default: 60)
})
```

## API

| Method | Description |
|--------|-------------|
| `LedgerKey.createEthereumApp(transport, opts?)` | Connect via Ethereum app |
| `LedgerKey.createCosmosApp(transport, opts?)` | Connect via Cosmos app |
| `key.address` | Bech32 address (init1...) |
| `key.evmAddress` | EVM address (0x...) |
| `key.publicKey` | Compressed public key (33 bytes) |
| `key.getPath()` | BIP44 derivation path |
| `key.showAddressAndPubKey()` | Display address on device for verification |
| `key.signText(payload)` | Sign arbitrary text/bytes |
| `key.getAppConfiguration()` | Get Ledger app version and config |

## Browser Transport

Replace `@ledgerhq/hw-transport-node-hid` with a browser transport:

```typescript
import TransportWebHID from '@ledgerhq/hw-transport-webhid'
const transport = await TransportWebHID.create()
```

> **Note:** This package depends on `@zondax/ledger-cosmos-js`, which uses Node.js `Buffer` internally. In browser environments, your bundler (webpack, vite, etc.) must provide a `Buffer` polyfill. This is a common requirement across the entire Cosmos Ledger ecosystem — `@cosmjs/ledger-amino` has the same dependency.

## Testing

```bash
# Unit tests (no device needed)
npm test

# Integration tests (device required)
npm run test:integration         # Both apps
npm run test:integration:eth     # Ethereum app only
npm run test:integration:cosmos  # Cosmos app only
```

## License

[Apache-2.0](../../LICENSE)
