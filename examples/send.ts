/**
 * Example: Send tokens using High-Level API
 *
 * This example demonstrates the simplified high-level API:
 * 1. Create provider and get chain info
 * 2. Create ChainContext from chain info and key
 * 3. Use ctx.msgs.bank.send() builder
 * 4. Use ctx.signAndBroadcast() for one-call transaction
 *
 * Compare with raw-send.ts to see the difference between low-level and high-level APIs.
 */

import { MnemonicKey, createInitiaContext, coin } from 'initia.js'
import { TEST_MNEMONIC, RECIPIENT } from './constants'

async function main() {
  // 1. Create key and ChainContext (all-in-one)
  const key = new MnemonicKey({ mnemonic: TEST_MNEMONIC })
  const ctx = await createInitiaContext({ network: 'testnet', signer: key })

  console.log('Chain:', ctx.chainId)
  console.log('Chain type:', ctx.chainInfo.chainType)
  if (!ctx.address) {
    throw new Error('Address not available')
  }
  console.log('Address:', ctx.address)

  // 2. Check balance (optional)
  const balances = await ctx.getBalance()
  console.log(
    'Balances:',
    balances.map(b => b.toString())
  )

  // 3. Build message using high-level builder
  // Compare: Low-level requires create(MsgSendSchema, {...}) + anyPack()
  const recipient = RECIPIENT.bech32
  const msg = ctx.msgs.bank.send({
    fromAddress: ctx.address,
    toAddress: recipient,
    amount: [coin('uinit', '1000000')],
  })
  console.log('Message type:', msg.typeUrl)
  console.log('From:', msg.value.fromAddress)
  console.log('To:', msg.value.toAddress)

  // 4. Sign and broadcast in one call
  // Compare: Low-level requires manual account fetch, sign, broadcast
  const result = await ctx.signAndBroadcast([msg], {
    memo: 'Send 1 INIT via high-level API',
    fee: [coin('uinit', '10000')],
    gasLimit: 200000,
  })

  console.log('Tx hash:', result.txHash)
  console.log('Gas used:', result.gasUsed)
}

main().catch(console.error)
