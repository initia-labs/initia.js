/**
 * Example: Wasm Typed Contract with Static Schema
 *
 * Demonstrates how importing a static schema from a separate file enables:
 *   - IDE autocomplete for execute/query variant names
 *   - Compile-time validation of variant names
 *
 * Key difference from wasm-contract.ts:
 *   - Schema lives in a separate file (./abis/cw20.ts)
 *   - Schema uses `as const satisfies ReadonlyWasmContractSchema`
 *   - Passing schema directly (not wrapped in options) returns TypedWasmContract<T>
 *
 * Note: Args remain `Record<string, unknown>` — Wasm schemas only provide
 * variant name autocomplete, not deep type inference for args/returns.
 */

import { createWasmContext } from 'initia.js'
import { createWasmContract } from 'initia.js/wasm'
import { SENDER, RECIPIENT, WASM_CONTRACT } from './constants'

// Import static schema from separate file — `as const satisfies ReadonlyWasmContractSchema`
import { CW20_SCHEMA } from './abis/cw20'

async function main() {
  const chain = await createWasmContext({ network: 'testnet', chainId: 'wasm-1' })

  // Create typed contract — pass schema directly (not in options)
  // Try typing `cw20.execute.` or `cw20.query.` to see autocomplete.
  const cw20 = createWasmContract(chain, WASM_CONTRACT.slimeCore, CW20_SCHEMA)

  // =========================================================================
  // Typed execute — variant name autocomplete
  //   cw20.execute.transfer(...)          // ✓ autocomplete
  //   cw20.execute.burn(...)              // ✓ autocomplete
  //   cw20.execute.send(...)              // ✓ autocomplete
  //   cw20.execute.increase_allowance(...)
  //   cw20.execute.mint(...)
  // =========================================================================
  const transferMsg = cw20.execute.transfer(SENDER.bech32, {
    recipient: RECIPIENT.bech32,
    amount: '1000000',
  })
  console.log(`Transfer msg: sender=${transferMsg.value.sender}`)

  const burnMsg = cw20.execute.burn(SENDER.bech32, {
    amount: '500000',
  })
  console.log(`Burn msg: sender=${burnMsg.value.sender}`)

  // =========================================================================
  // Typed query — variant name autocomplete
  //   cw20.query.balance(...)      // ✓ autocomplete
  //   cw20.query.token_info(...)   // ✓ autocomplete
  //   cw20.query.minter(...)       // ✓ autocomplete
  //   cw20.query.allowance(...)
  // =========================================================================
  const balanceResp = (await cw20.query.balance({
    address: SENDER.bech32,
  })) as { balance: string }
  console.log(`Balance: ${balanceResp.balance}`)

  const tokenInfo = (await cw20.query.token_info()) as {
    name: string
    symbol: string
    decimals: number
    total_supply: string
  }
  console.log(`Token: ${tokenInfo.name} (${tokenInfo.symbol}), decimals=${tokenInfo.decimals}`)

  // To broadcast: await chain.signAndBroadcast([transferMsg, burnMsg])
}

main().catch(console.error)
