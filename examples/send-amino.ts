/**
 * Example: Send tokens using Amino signing (high-level API)
 *
 * Amino signing is automatic — just set signMode: 'amino'.
 * The SDK converts messages to Amino format internally.
 *
 * Use cases:
 * - Ledger hardware wallets (Amino-only)
 * - Legacy wallet compatibility
 * - Human-readable sign documents
 *
 * Compare with:
 * - send.ts           — same flow with Direct signing (default)
 * - raw-send-amino.ts — manual Amino conversion (low-level)
 */

import { MnemonicKey, createInitiaContext, coin } from 'initia.js'
import { TEST_MNEMONIC, RECIPIENT } from './constants'

async function main() {
  const key = new MnemonicKey({ mnemonic: TEST_MNEMONIC })
  const ctx = await createInitiaContext({ network: 'testnet', signer: key })
  if (!ctx.address) throw new Error('Address not available')

  console.log('Chain:', ctx.chainId)
  console.log('Address:', ctx.address)

  // Build message — same as direct signing, no Amino-specific code
  const msg = ctx.msgs.bank.send({
    fromAddress: ctx.address,
    toAddress: RECIPIENT.bech32,
    amount: [coin('uinit', '1000000')],
  })

  // Sign and broadcast with Amino — just add signMode: 'amino'
  // The SDK calls msg.toAmino() internally; no manual conversion needed.
  const result = await ctx.signAndBroadcast([msg], {
    signMode: 'amino',
    memo: 'Send 1 INIT via Amino (high-level)',
    fee: [coin('uinit', '10000')],
    gasLimit: 200000,
  })

  console.log('Tx hash:', result.txHash)
  console.log('Gas used:', result.gasUsed)
}

main().catch(console.error)
