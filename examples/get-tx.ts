/**
 * Example: Decode transaction with VM-aware arg enrichment
 *
 * Demonstrates ctx.getTx() for parsing on-chain transactions:
 * 1. Fetch and decode a transaction by hash
 * 2. Access convenience fields (txHash, code, height, timestamp)
 * 3. Inspect decoded messages with functionName, args, contractMsg
 * 4. Use ABI registries for offline decode (ctx.abis.set / options.abis)
 * 5. Fast listing with decodeArgs: 'none' (skip all ABI fetches)
 *
 * No signing required — query-only context.
 */

import { createInitiaContext, type DecodedTxMessage } from 'initia.js'

async function main() {
  const txHash = process.argv[2]
  if (!txHash) {
    console.error('Usage: npx tsx examples/get-tx.ts <TX_HASH>')
    process.exit(1)
  }

  // ---- Move chain (Initia L1) ----
  const ctx = await createInitiaContext({ network: 'testnet' })
  console.log('Connected to:', ctx.chainId)

  // Basic decode — automatically fetches Move ABIs on-chain for BCS decode
  const tx = await ctx.getTx(txHash)
  console.log(`\nTransaction ${tx.txHash}`)
  console.log(`Status: ${tx.code === 0 ? 'success' : `failed (code ${tx.code})`}`)
  console.log(`Height: ${tx.height}, Timestamp: ${tx.timestamp}`)
  console.log(`Gas: ${tx.gasUsed}/${tx.gasWanted}`)
  console.log(`Messages: ${tx.messages.length}`)

  for (const [i, msg] of tx.messages.entries()) {
    printMessage(i, msg)
  }

  // ---- Offline ABI — skip on-chain fetch ----
  // ctx.abis.set('0x1::coin', offlineCoinAbi)
  // const tx2 = await ctx.getTx(anotherHash)

  // ---- Fast listing — protobuf decode only, skip all ABI fetches ----
  const fastTx = await ctx.getTx(txHash, { decodeArgs: 'none' })
  console.log(`\n[Fast mode] ${fastTx.txHash}: ${fastTx.messages.length} messages`)

  // ---- EVM chain — register ABI for repeated use ----
  // const evmCtx = await createMinievmContext({ network: 'testnet', chainId: 'evm-1' })
  // evmCtx.abis.set('0x1234...', erc20Abi)
  // const evmTx = await evmCtx.getTx(evmTxHash)

  // ---- EVM chain — one-time ABI via options ----
  // const evmTx2 = await evmCtx.getTx(otherHash, {
  //   abis: { '0x5678...': customAbi }
  // })
}

function printMessage(index: number, msg: DecodedTxMessage) {
  console.log(`\n--- Message ${index} ---`)
  console.log('Type:', msg.typeUrl)

  if (msg.decodeError) {
    console.log('(decode failed — raw Any)')
    return
  }

  if (msg.functionName) console.log('Function:', msg.functionName)
  if (msg.args) console.log('Args:', msg.args)
  if (msg.namedArgs) console.log('Named args:', msg.namedArgs)
  if (msg.contractMsg) console.log('Contract msg:', msg.contractMsg)
}

main().catch(console.error)
