# initia.js

TypeScript SDK for Initia and its rollup ecosystem.

## Features

- Multi-VM support: Move, EVM, and CosmWasm contracts in one SDK
- Type-safe gRPC client with Proxy-based service access
- Typed context factories: `createInitiaContext`, `createEvmContext`, `createWasmContext`, `createMoveContext`
- VM-agnostic token abstraction (Fungible Asset, ERC20, CW20)
- OP Bridge and Router API for L1/L2 cross-chain transfers
- Automatic Amino conversion via proto schema options
- Transaction decoding with VM-aware arg enrichment (`ctx.getTx()`)
- ABI-driven contracts: BCS (Move), `abitype` (EVM), JSON schema (CosmWasm)
- CometBFT HTTP RPC client (23 endpoints) and EVM JSON-RPC client
- Signer bridge adapters for viem and ethers.js interop
- Cosmos chain-registry integration (Osmosis, Noble, etc.)
- Browser-native with gRPC-Web transport, zero Node.js polyfills
- WebSocket subscriptions and event parsing
- Codegen CLI (`npx abigen`) for Move, EVM, and CosmWasm ABIs
- tree-shakeable subpath exports

## Supported Environments

| Environment | Version    | Transport              |
| ----------- | ---------- | ---------------------- |
| Node.js     | >= 22      | Native gRPC (HTTP/2)   |
| Browser     | Modern     | gRPC-Web               |
| Bun         | >= 1.3.11  | Native gRPC (HTTP/2)   |
| Deno        | >= 2.5     | Native gRPC (HTTP/2)   |

## Compatibility

### Chain Versions

| initia.js | Initia L1 | Minievm | Minimove   | Miniwasm | OPinit |
| --------- | --------- | ------- | ---------- | -------- | ------ |
| v2.0.x    | v1.4.0    | v1.2.15 | v1.1.11\*  | v1.2.11  | v1.3.0 |

\* Minimove v1.1.11 uses Initia v1.2.2 move proto — governance messages (Whitelist/Delist) differ from v1.4.0. Core move execute/view/query are compatible.

### Proto Dependencies

| initia.js | Cosmos SDK       | IBC               | CosmWasm          | Connect (Oracle)  |
| --------- | ---------------- | ----------------- | ----------------- | ----------------- |
| v2.0.x    | [`5a6ab7bc`][cs] | [`cc1d31ac`][ibc] | [`3c30b822`][cw]  | [`ea643a0e`][co]  |

[cs]: https://buf.build/cosmos/cosmos-sdk/commits/5a6ab7bc14314acaa912d5e53aef1c2f
[ibc]: https://buf.build/cosmos/ibc/commits/cc1d31ac98a0477580379346dab8e87b
[cw]: https://buf.build/cosmwasm/wasmd/commits/3c30b822226c4bea96d5fad293a6e010
[co]: https://buf.build/skip-mev/connect/commits/ea643a0e8c46420caa71d33530c84b46

## Installation

```bash
npm install initia.js
```

All proto dependencies are sourced from BSR (Buf Schema Registry) packages (`@buf/cosmos_cosmos-sdk`, `@buf/initia-labs_initia`, `@buf/initia-labs_minievm`, etc.) and bundled as regular dependencies — no registry configuration needed.

## Which Provider?

- **Initia L1/L2** → `RegistryProvider` (default, zero config)
- **Cosmos chains** (Osmosis, Noble, etc.) → `CosmosRegistryProvider`
- **Custom/private endpoints** → `CustomProvider`
- **CI/offline** → `PackageProvider`

Most users don't need to choose — `createInitiaContext({ network: 'mainnet' })` uses `RegistryProvider` automatically.

## Quick Start

### Query balance

```typescript
import { createInitiaContext } from 'initia.js'

const ctx = await createInitiaContext({ network: 'mainnet' })

const { balance } = await ctx.client.bank.balance({
  address: 'init1...',
  denom: 'uinit',
})
console.log(balance?.amount)
```

### Send tokens

```typescript
import { createInitiaContext, MnemonicKey, coin } from 'initia.js'

const key = new MnemonicKey({ mnemonic: 'your mnemonic ...' })
const ctx = await createInitiaContext({ network: 'mainnet', signer: key })

const result = await ctx.signAndBroadcast([
  ctx.msgs.bank.send({
    fromAddress: ctx.address,
    toAddress: 'init1recipient...',
    amount: [coin('uinit', '1000000')],
  }),
])
console.log(result.txHash)
```

### Move contract call

```typescript
import { createMoveContract } from 'initia.js/move'

const coin = await createMoveContract(ctx, '0x1', 'coin')

const balance = await coin.view.balance({
  typeArgs: ['0x1::native_uinit::Coin'],
  args: ['init1owner...'],
})
const msg = coin.execute.transfer(ctx.address, {
  typeArgs: ['0x1::native_uinit::Coin'],
  args: ['init1recipient...', '1000000'],
})
await ctx.signAndBroadcast([msg])
```

### EVM contract call

```typescript
import { createEvmContract, type Abi } from 'initia.js/evm'

const abi = [/* ERC-20 ABI */] as const satisfies Abi
const erc20 = createEvmContract(ctx, '0xContractAddress', abi)

const balance = await erc20.read.balanceOf('0xOwner')
const msg = erc20.write.transfer(ctx.address, '0xRecipient', 1000n)
await ctx.signAndBroadcast([msg])
```

### Event parsing

```typescript
// Cosmos events — typed attribute extraction
import { parseEventAttrs, parseMoveEventData } from 'initia.js/events'

const transfers = parseEventAttrs(result.events, 'transfer', ['recipient', 'sender', 'amount'])
// → Array<{ recipient: string, sender: string, amount: string }>

// Move events — auto JSON parse
const withdraws = parseMoveEventData(result.events, '0x1::fungible_asset::WithdrawEvent')
// → Array<{ store_addr: string, metadata_addr: string, amount: string }>

// EVM logs — viem-powered typed decoding
import { parseEventLogs } from 'initia.js/evm'

const logs = parseEventLogs({ abi: erc20Abi, eventName: 'Transfer', logs: receipt.logs })
logs[0].args.from // full autocomplete from ABI
```

> **Note**: `parseEventLogs` returns addresses in EIP-55 checksum format (mixed-case), while on-chain RPC returns lowercase. Use `.toLowerCase()` when comparing with raw on-chain data.

### CometBFT RPC

The `ctx.rpc` accessor provides a CometBFT HTTP RPC client covering 23 endpoints not available via gRPC. It is lazily initialized and automatically inherits `auth`, `headers`, and `timeoutMs` from the context. All methods accept per-request option overrides.

**Endpoints by category:** blocks & headers (`block`, `blockByHash`, `blockResults`, `header`, `headerByHash`, `blockchain`, `blockSearch`), transactions (`tx`, `txSearch`, `unconfirmedTxs`, `numUnconfirmedTxs`), consensus (`validators`, `commit`, `consensusParams`, `consensusState`, `dumpConsensusState`), node (`status`, `health`, `netInfo`, `genesis`, `genesisChunked`), ABCI (`abciInfo`, `abciQuery`).

```typescript
import { createInitiaContext } from 'initia.js'

const ctx = await createInitiaContext({
  network: 'mainnet',
  auth: { type: 'api-key', key: 'my-key' },
  timeoutMs: 5000,
})

// CometBFT RPC — auth/headers/timeoutMs forwarded automatically
const blockResult = await ctx.rpc.blockResults(100)
const txResult = await ctx.rpc.tx('A1B2C3...')
const searchResult = await ctx.rpc.txSearch("message.action='/cosmos.bank.v1beta1.MsgSend'")
const status = await ctx.rpc.status()
const healthy = await ctx.rpc.health() // true/false, never throws
```

For minievm chains, `ctx.evmRpc` provides an Ethereum JSON-RPC client with the same option forwarding, including `getTransactionByHash()` and `getStorageAt()`.

### Signer bridges

Use existing viem or ethers.js wallets as Cosmos signers:

```typescript
import { viemAccountToSigner, keyToViemAccount } from 'initia.js/signer'

// viem private key → Cosmos signer
const signer = viemAccountToSigner('0xprivateKey...')

// RawKey → viem LocalAccount (for EVM dApps)
const account = keyToViemAccount(rawKey)
```

## Architecture

```text
Provider  -->  ChainInfo  -->  ChainContext
(registry)     (chain data)    (client + signer + msgs)
```

### Which provider to use

| Provider | Use case |
| --- | --- |
| `createRegistryProvider()` | **Default choice.** Fetches chain data from Initia registry. Works for all Initia L1/L2 chains. |
| `CustomProvider` | Private chains, local testnets, or non-Initia chains with manual config. |
| `CosmosRegistryProvider` | External Cosmos chains (Osmosis, Noble, etc.) via chain-registry npm package. |
| `composeProviders(a, b)` | Combine multiple providers (e.g., Initia registry + Cosmos registry). |

```typescript
// Most users — just use this:
const ctx = await createInitiaContext({ network: 'mainnet', signer: key })

// For external Cosmos chains:
import { CosmosRegistryProvider } from 'initia.js/cosmos'
import { composeProviders } from 'initia.js/provider'
const provider = composeProviders(
  await createRegistryProvider({ network: 'mainnet' }),
  new CosmosRegistryProvider(),
)
```

Domain-specific APIs are available via subpath exports:

| Import path | Description |
| --- | --- |
| `initia.js` | Core types, keys, wallet, typed context factories |
| `initia.js/client` | gRPC client, transport, interceptors |
| `initia.js/tx` | Signing, serialization, Amino conversion |
| `initia.js/msgs` | Module-namespaced message builders and decode |
| `initia.js/move` | Move contracts, BCS encoding, ABI |
| `initia.js/evm` | EVM contracts, ABI encoding, JSON-RPC client |
| `initia.js/wasm` | CosmWasm contracts, JSON schema |
| `initia.js/bridge` | OP Bridge, deposit/withdraw/claim, Router API |
| `initia.js/provider` | Registry, custom, and composite providers |
| `initia.js/signer` | Signer interfaces, KeyStore, viem/ethers bridges |
| `initia.js/events` | Event parsing, WebSocket subscriptions |
| `initia.js/util` | Address, hash, denom, formatting utilities |
| `initia.js/usernames` | `.init` domain resolution |
| `initia.js/cosmos` | Cosmos chain-registry integration (Osmosis, Noble, ...) |
| `initia.js/vip` | VIP lock staking, gauge voting, rewards |
| `initia.js/codegen` | ABI codegen for Move, EVM, CosmWasm |

## Examples

See the [examples/](./examples) directory for runnable scripts:

### Getting started

- [query.ts](./examples/query.ts) -- Read-only gRPC queries
- [send.ts](./examples/send.ts) -- Send tokens with high-level API
- [send-amino.ts](./examples/send-amino.ts) -- Send tokens with Amino signing mode
- [staking.ts](./examples/staking.ts) -- Delegate, redelegate, undelegate, claim rewards
- [get-tx.ts](./examples/get-tx.ts) -- Decode transactions with VM-aware arg enrichment

### Smart contracts

- [move-contract.ts](./examples/move-contract.ts) -- ABI-driven Move contract interactions
- [move-typed.ts](./examples/move-typed.ts) -- Move contract with full type inference
- [evm-contract.ts](./examples/evm-contract.ts) -- ABI-driven EVM contract interactions
- [evm-typed.ts](./examples/evm-typed.ts) -- EVM contract with full type inference
- [wasm-contract.ts](./examples/wasm-contract.ts) -- CosmWasm contract interactions
- [wasm-typed.ts](./examples/wasm-typed.ts) -- CosmWasm contract with full type inference
- [deploy-cw20.ts](./examples/deploy-cw20.ts) -- Deploy and interact with a CW20 token

### RPC & low-level

- [evm-rpc.ts](./examples/evm-rpc.ts) -- EVM JSON-RPC (blocks, logs, receipts)
- [evm-jsonrpc.ts](./examples/evm-jsonrpc.ts) -- EVM JSON-RPC direct calls
- [auth-headers.ts](./examples/auth-headers.ts) -- API key / Bearer auth configuration
- [block-subscription.ts](./examples/block-subscription.ts) -- WebSocket block/event subscriptions
- [raw-send.ts](./examples/raw-send.ts) -- Send using raw BSR proto messages
- [raw-query-historical.ts](./examples/raw-query-historical.ts) -- Query at historical block heights

### Cross-chain

- [op-bridge.ts](./examples/op-bridge.ts) -- OP Bridge deposit, withdraw, and claim
- [smart-route.ts](./examples/smart-route.ts) -- Router API for cross-chain transfers
- [ibc-transfer.ts](./examples/ibc-transfer.ts) -- IBC transfers between Initia chains
- [noble-ibc-transfer.ts](./examples/noble-ibc-transfer.ts) -- IBC from external Cosmos chains
- [osmosis-custom-provider.ts](./examples/osmosis-custom-provider.ts) -- Custom provider for external Cosmos chains

### Custom chains & modules

- [custom-chain.ts](./examples/custom-chain.ts) -- CustomProvider, CosmosRegistryProvider, composeProviders
- [custom-rollup.ts](./examples/custom-rollup.ts) -- Add custom proto modules to rollup contexts

### Utilities

- [usernames.ts](./examples/usernames.ts) -- `.init` domain resolution
- [token.ts](./examples/token.ts) -- VM-agnostic token operations
- [vip.ts](./examples/vip.ts) -- VIP lock staking, gauge voting, and reward claims
- [address-utils.ts](./examples/address-utils.ts) -- Address type detection and profile lookup
- [cache-management.ts](./examples/cache-management.ts) -- gRPC response cache control
- [provider-assets.ts](./examples/provider-assets.ts) -- Provider asset and denom lookup
- [keystore.ts](./examples/keystore.ts) -- KeyStore multi-key management
- [ledger.ts](./examples/ledger.ts) -- Ledger hardware wallet (`@initia/ledger-key`)

## License

[Apache-2.0](./LICENSE)
