/**
 * Example: Ledger Hardware Wallet
 *
 * Demonstrates:
 * 1. Connect to Ledger via Ethereum app (recommended)
 * 2. Display address on device for verification
 * 3. Sign and broadcast a transaction
 *
 * Prerequisites:
 *   npm install @initia/ledger-key @ledgerhq/hw-transport-node-hid
 *   Ledger device connected via USB with Ethereum app open
 *
 * Usage:
 *   npx tsx examples/ledger.ts
 */

import TransportNodeHid from '@ledgerhq/hw-transport-node-hid'
import { LedgerKey } from '@initia/ledger-key'
import { createInitiaContext, coin } from 'initia.js'

async function main() {
  // 1. Connect to Ledger
  console.log('Connecting to Ledger...')
  const transport = await TransportNodeHid.create(5000)
  const key = await LedgerKey.createEthereumApp(transport)

  console.log('Address:', key.address)
  console.log('EVM:', key.evmAddress)
  console.log('Path:', key.getPath())

  // 2. Verify address on device
  console.log('\nPlease confirm address on device...')
  await key.showAddressAndPubKey()
  console.log('Address confirmed.')

  // 3. Sign and broadcast
  const ctx = await createInitiaContext({ network: 'testnet', signer: key })
  console.log('\nChain:', ctx.chainId)

  const msg = ctx.msgs.bank.send({
    fromAddress: key.address,
    toAddress: key.address, // self-transfer
    amount: [coin('uinit', '1')],
  })

  console.log('\nPlease approve transaction on device...')
  const result = await ctx.signAndBroadcast([msg])
  console.log('Tx hash:', result.txHash)

  // Cleanup
  await transport.close()
}

main().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
