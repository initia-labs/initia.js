/**
 * Example: Auth & Headers
 *
 * Demonstrates authentication and custom header injection (ADR-004):
 * 1. Context-level auth (injected into every gRPC request)
 * 2. Per-request auth override (full replacement, not merge)
 * 3. Custom headers
 * 4. Historical query via QueryOptions.height
 * 5. EVM RPC client with auth
 *
 * All three auth types: bearer, api-key, basic.
 * See docs/ADR-004-headers-auth.md for design rationale.
 */

import { createInitiaContext } from 'initia.js'
import { auth } from 'initia.js/client'
import { createEvmRpcClient } from 'initia.js/evm'
import { createRegistryProvider } from 'initia.js/provider'

async function main() {
  const provider = await createRegistryProvider({ network: 'testnet' })

  // -------------------------------------------------------------------------
  // 1. Context-level auth — injected into every gRPC request
  // -------------------------------------------------------------------------
  console.log('=== Context-Level Auth ===\n')

  const ctx = createInitiaContext(provider, 'initiation-2', {
    auth: auth.bearer('my-rpc-provider-token'),
  })

  // Bearer token is automatically included
  const balance = await ctx.client.bank.balance({
    address: 'init1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpqr5e3d',
    denom: 'uinit',
  })
  console.log('Balance:', balance.balance?.amount)

  // -------------------------------------------------------------------------
  // 2. Per-request auth override — fully replaces context auth
  // -------------------------------------------------------------------------
  console.log('\n=== Per-Request Auth Override ===\n')

  // Switches from bearer to api-key for this single request.
  // The bearer token from context is NOT present — full replacement semantics.
  const overridden = await ctx.client.bank.allBalances(
    { address: 'init1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpqr5e3d' },
    { auth: auth.apiKey('sk-different-provider') }
  )
  console.log('Balances:', overridden.balances.length, 'denoms')

  // -------------------------------------------------------------------------
  // 3. Custom headers (context-level)
  // -------------------------------------------------------------------------
  console.log('\n=== Custom Headers ===\n')

  const ctxWithHeaders = createInitiaContext(provider, 'initiation-2', {
    headers: { 'x-request-source': 'initia-js-example' },
  })

  const account = await ctxWithHeaders.client.auth.account({
    address: 'init1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpqr5e3d',
  })
  console.log('Account type:', account.account?.typeUrl)

  // Per-request headers (additive, overrides same-key)
  await ctxWithHeaders.client.bank.balance(
    { address: 'init1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpqr5e3d', denom: 'uinit' },
    { headers: { 'x-request-id': 'req-123' } }
  )

  // -------------------------------------------------------------------------
  // 4. Historical query (height)
  // -------------------------------------------------------------------------
  console.log('\n=== Historical Query ===\n')

  const latestBlock = await ctx.client.tendermint.getLatestBlock({})
  const height = latestBlock.block?.header?.height
  if (height && height > 100n) {
    const historical = await ctx.client.bank.balance(
      { address: 'init1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpqr5e3d', denom: 'uinit' },
      { height: height - 100n }
    )
    console.log('Balance 100 blocks ago:', historical.balance?.amount)
  }

  // -------------------------------------------------------------------------
  // 5. EVM RPC client with auth
  // -------------------------------------------------------------------------
  console.log('\n=== EVM RPC Auth ===\n')

  const minievm = provider.listChains().find(c => c.chainType === 'minievm')
  if (minievm?.evmRpc) {
    // Context-level auth
    const rpc = createEvmRpcClient(minievm.evmRpc, {
      auth: auth.apiKey('my-api-key'),
    })
    const blockNumber = await rpc.getBlockNumber()
    console.log('Block number:', blockNumber)

    // Per-request auth override
    const chainId = await rpc.getChainId({ auth: auth.bearer('override-token') })
    console.log('Chain ID:', chainId)
  }

  // -------------------------------------------------------------------------
  // Auth types reference:
  //   auth.bearer('token')              → Authorization: Bearer token
  //   auth.apiKey('key')                → X-Api-Key: key
  //   auth.apiKey('key', 'X-Custom')    → X-Custom: key
  //   auth.basic('user', 'pass')        → Authorization: Basic base64(user:pass)
  // -------------------------------------------------------------------------
}

main().catch(console.error)
