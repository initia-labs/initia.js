/**
 * Example: Move Typed Contract with Static ABI
 *
 * Demonstrates how importing a static ABI from a separate file enables:
 *   - Synchronous contract creation (no await needed)
 *   - IDE autocomplete for view/execute function names
 *   - Typed args and return values for non-generic view functions
 *
 * Key difference from move-contract.ts:
 *   - ABI lives in a separate file (./abis/coin.ts)
 *   - `ctx.contract(ABI)` is sync (no gRPC fetch)
 *   - Function names autocomplete in IDE
 *
 * Compare:
 *   const coin = ctx.contract(COIN_ABI)                               // sync, typed
 *   const coin = await ctx.contract('0x1', 'coin')                    // async, untyped
 */

import { createMinimoveContext } from 'initia.js'
import { SENDER, RECIPIENT } from './constants'

// Import static ABI from separate file — `as const satisfies ReadonlyMoveModuleAbi`
import { COIN_ABI } from './abis/coin'

const UINIT_COIN = '0x1::native_uinit::Coin'

async function main() {
  const chain = await createMinimoveContext({ network: 'testnet', chainId: 'move-1' })

  // Static ABI — sync (no await needed, ABI is already known)
  const coin = chain.contract(COIN_ABI)

  // Runtime ABI — async (fetches ABI from chain, must await)
  // const coin = await chain.contract('0x1', 'coin')

  // =========================================================================
  // Typed views — non-generic functions have typed args and return values
  //   coin.view.name({ args: [metadataAddr] })     → Promise<string>
  //   coin.view.decimals({ args: [metadataAddr] })  → Promise<number>
  //   coin.view.is_frozen({ args: [meta, addr] })   → Promise<boolean>
  //   coin.view.balance(...)                         → Promise<unknown> (generic)
  //
  // When the ABI includes struct definitions, return types are fully inferred:
  //   contract.view.get_proposal({ args: ['1'] })
  //     → Promise<{ total_tally: bigint; voting_end_time: bigint; executed: boolean }>
  // No `as` cast needed — TypeScript infers the struct shape from the ABI.
  // =========================================================================
  const metadataAddr = '0x15bb76e1a08dd8f8fb5e569a79f32f767ceec701fcc0dedc1e1e7c523d849781'

  const [name, symbol, decimals] = await Promise.all([
    coin.view.name({ args: [metadataAddr] }),
    coin.view.symbol({ args: [metadataAddr] }),
    coin.view.decimals({ args: [metadataAddr] }),
  ])
  console.log(`Token: ${name} (${symbol}), decimals=${decimals}`)

  const frozen = await coin.view.is_frozen({
    args: [metadataAddr as `0x${string}`, SENDER.bech32 as `0x${string}`],
  })
  console.log(`Frozen: ${frozen}`)

  // Generic view — falls back to untyped args (typeArgs required)
  const balance = await coin.view.balance({
    typeArgs: [UINIT_COIN],
    args: [SENDER.bech32],
  })
  console.log(`Balance: ${balance}`)

  // =========================================================================
  // Typed execute — function name autocomplete
  //   coin.execute.transfer(sender, { typeArgs, args })
  // =========================================================================
  const transferMsg = coin.execute.transfer(SENDER.bech32, {
    typeArgs: [UINIT_COIN],
    args: [RECIPIENT.bech32, '1000000'],
  })
  console.log(`Transfer msg: function=${transferMsg.value.functionName}`)

  // To broadcast: await chain.signAndBroadcast([transferMsg])
}

main().catch(console.error)
