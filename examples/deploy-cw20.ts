/**
 * Deploy CW20 Base Token on Miniwasm Testnet
 *
 * Prerequisites:
 *   1. Set TEST_MNEMONIC env var with a funded testnet wallet
 *   2. Download cw20_base.wasm:
 *      curl -L -o examples/cw20_base.wasm \
 *        https://github.com/CosmWasm/cw-plus/releases/download/v0.16.0/cw20_base.wasm
 *   3. Run:
 *      npx tsx examples/deploy-cw20.ts
 *
 * After deployment, update WASM_CONTRACT.cw20 in examples/constants.ts
 * with the printed contract address.
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { createWasmContext, MnemonicKey } from 'initia.js'
import { findEvent, getEventAttribute } from 'initia.js/events'
import { TEST_MNEMONIC, SENDER } from './constants'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const CHAIN_ID = 'wasm-1'

const TOKEN_CONFIG = {
  name: 'Initia Test Token',
  symbol: 'ITT',
  decimals: 6,
  initial_balances: [
    {
      address: SENDER.bech32,
      amount: '1000000000000', // 1,000,000 tokens (6 decimals)
    },
  ],
  mint: {
    minter: SENDER.bech32,
  },
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // 1. Load wasm binary
  const wasmPath = path.join(import.meta.dirname ?? '.', 'cw20_base.wasm')
  if (!fs.existsSync(wasmPath)) {
    console.error(`Missing ${wasmPath}`)
    console.error('Download it first:')
    console.error(
      '  curl -L -o examples/cw20_base.wasm https://github.com/CosmWasm/cw-plus/releases/download/v0.16.0/cw20_base.wasm'
    )
    process.exit(1)
  }

  const wasmByteCode = new Uint8Array(fs.readFileSync(wasmPath))
  console.log(`Loaded wasm binary: ${wasmByteCode.length} bytes`)

  // 2. Connect to chain
  const key = new MnemonicKey({ mnemonic: TEST_MNEMONIC })
  const ctx = await createWasmContext({ network: 'testnet', chainId: CHAIN_ID, signer: key })
  console.log(`Connected to ${ctx.chainId} as ${key.address}`)

  // 3. Store code
  console.log('\nStoring code...')
  const storeMsg = ctx.msgs.wasm.storeCode({
    sender: key.address,
    wasmByteCode,
    instantiatePermission: { permission: 3 /* EVERYBODY */, addresses: [] },
  })

  const storeResult = await ctx.signAndBroadcast([storeMsg], {
    waitForConfirmation: true,
  })

  if (storeResult.code !== 0) {
    throw new Error(`Store code failed: ${storeResult.rawLog}`)
  }

  // Parse code_id from events
  const storeCodeEvent = findEvent(storeResult.events, 'store_code')
  const codeId = storeCodeEvent ? getEventAttribute(storeCodeEvent, 'code_id') : undefined
  if (!codeId) {
    throw new Error('Could not parse code_id from store_code events')
  }
  console.log(`Code stored! code_id=${codeId} (tx: ${storeResult.txHash})`)

  // 4. Instantiate contract
  console.log('\nInstantiating CW20...')
  const initMsg = ctx.msgs.wasm.instantiateContract({
    sender: key.address,
    codeId: BigInt(codeId),
    msg: new TextEncoder().encode(JSON.stringify(TOKEN_CONFIG)),
    label: `cw20-${TOKEN_CONFIG.symbol.toLowerCase()}-${Date.now()}`,
    funds: [],
    admin: key.address,
  })

  const initResult = await ctx.signAndBroadcast([initMsg], {
    waitForConfirmation: true,
  })

  if (initResult.code !== 0) {
    throw new Error(`Instantiate failed: ${initResult.rawLog}`)
  }

  // Parse contract address from events
  const instantiateEvent = findEvent(initResult.events, 'instantiate')
  const contractAddress = instantiateEvent
    ? getEventAttribute(instantiateEvent, '_contract_address')
    : undefined
  if (!contractAddress) {
    throw new Error('Could not parse contract address from instantiate events')
  }

  console.log(`\nDeployed!`)
  console.log(`  Contract: ${contractAddress}`)
  console.log(`  Code ID:  ${codeId}`)
  console.log(`  Token:    ${TOKEN_CONFIG.name} (${TOKEN_CONFIG.symbol})`)
  console.log(`  Supply:   ${TOKEN_CONFIG.initial_balances[0].amount} (smallest unit)`)
  console.log(`  Tx:       ${initResult.txHash}`)
  console.log(`\nUpdate constants.ts:`)
  console.log(`  cw20: '${contractAddress}',`)
}

main().catch(err => {
  console.error('Deploy failed:', err)
  process.exit(1)
})
