/**
 * Example: Send tokens using a raw BSR proto message
 *
 * Shows how to create a protobuf message directly from BSR packages
 * and sign/broadcast it with the SDK. Useful when:
 * - Your proto module isn't covered by ctx.msgs.*
 * - You need full control over message fields
 * - You're integrating a custom chain module
 *
 * Compare with send.ts (high-level API using ctx.msgs.bank.send).
 */

import { MnemonicKey, createInitiaContext, coin } from 'initia.js'
import { TEST_MNEMONIC, RECIPIENT } from './constants'
import { create } from '@bufbuild/protobuf'
import { anyPack } from '@bufbuild/protobuf/wkt'
import { MsgSendSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/bank/v1beta1/tx_pb'
import { CoinSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/base/v1beta1/coin_pb'

async function main() {
  const key = new MnemonicKey({ mnemonic: TEST_MNEMONIC })
  const ctx = await createInitiaContext({ network: 'testnet', signer: key })

  console.log('Chain:', ctx.chainId)
  console.log('Address:', key.address)

  // 1. Create MsgSend from BSR proto schema
  const msgSend = create(MsgSendSchema, {
    fromAddress: key.address,
    toAddress: RECIPIENT.bech32,
    amount: [
      // Or use SDK's coin: coin('uinit', '1000000').toProto()
      create(CoinSchema, { denom: 'uinit', amount: '1000000' }),
    ],
  })

  // 2. Wrap as Any (required by signAndBroadcast)
  const msgAny = anyPack(MsgSendSchema, msgSend)

  // 3. Sign and broadcast — the SDK handles account fetch, signing, and encoding
  const result = await ctx.signAndBroadcast([msgAny], {
    memo: 'Send 1 INIT via raw proto message',
    fee: [coin('uinit', '10000')],
    gasLimit: 200000,
    // signMode: 'amino',  // Amino signing for Ledger / legacy wallet support
  })

  console.log('Tx hash:', result.txHash)
  console.log('Gas used:', result.gasUsed)
}

main().catch(console.error)
