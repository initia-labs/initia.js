/**
 * Example: Staking operations using High-Level API
 *
 * This example demonstrates staking with the high-level API:
 * 1. Delegate tokens to a validator
 * 2. Redelegate to another validator
 * 3. Undelegate tokens
 * 4. Withdraw rewards
 *
 * All operations use ctx.msgs builders and ctx.signAndBroadcast().
 *
 * Note: Staking operations are only available on Initia L1 chains (mstaking module).
 * Rollup chains (minievm, miniwasm, minimove) use different staking mechanisms.
 */

import { MnemonicKey, createInitiaContext, coin } from 'initia.js'
import { TEST_MNEMONIC, SENDER, RECIPIENT } from './constants'

async function main() {
  // Setup: Create key and context
  const key = new MnemonicKey({ mnemonic: TEST_MNEMONIC })
  // Narrowed to ChainContext<'initia'> — ctx.msgs has mstaking, distribution, etc.
  const ctx = await createInitiaContext({ network: 'testnet', signer: key })

  if (!ctx.address) {
    throw new Error('Address not available')
  }

  console.log('Address:', ctx.address)

  // ctx.msgs is narrowed to InitiaMsgs via ChainContext<'initia'>
  const msgs = ctx.msgs

  // Example validators (replace with real addresses)
  const validator1 = SENDER.valoper
  const validator2 = RECIPIENT.valoper // Replace with actual validator address

  // -------------------------------------------------------------------------
  // 1. Delegate tokens to a validator
  // -------------------------------------------------------------------------
  console.log('\n--- Delegating 10 INIT to validator1 ---')

  const delegateMsg = msgs.mstaking.delegate({
    delegatorAddress: ctx.address,
    validatorAddress: validator1,
    amount: [coin('uinit', '10000000')], // 10 INIT
  })
  console.log('Type:', delegateMsg.typeUrl)
  console.log('Delegator:', delegateMsg.value.delegatorAddress)
  console.log('Validator:', delegateMsg.value.validatorAddress)

  const delegateResult = await ctx.signAndBroadcast([delegateMsg], {
    memo: 'Delegate via high-level API',
    fee: [coin('uinit', '10000')],
    gasLimit: 200000,
  })

  console.log('Delegate tx:', delegateResult.txHash)

  // -------------------------------------------------------------------------
  // 2. Redelegate to another validator
  // -------------------------------------------------------------------------
  console.log('\n--- Redelegating 5 INIT from validator1 to validator2 ---')

  const redelegateMsg = msgs.mstaking.beginRedelegate({
    delegatorAddress: ctx.address,
    validatorSrcAddress: validator1,
    validatorDstAddress: validator2,
    amount: [coin('uinit', '5000000')], // 5 INIT
  })

  const redelegateResult = await ctx.signAndBroadcast([redelegateMsg], {
    memo: 'Redelegate via high-level API',
    fee: [coin('uinit', '15000')],
    gasLimit: 300000,
  })

  console.log('Redelegate tx:', redelegateResult.txHash)

  // -------------------------------------------------------------------------
  // 3. Withdraw rewards
  // -------------------------------------------------------------------------
  console.log('\n--- Withdrawing rewards from validator1 ---')

  const withdrawMsg = msgs.distribution.withdrawDelegatorReward({
    delegatorAddress: ctx.address,
    validatorAddress: validator1,
  })

  const withdrawResult = await ctx.signAndBroadcast([withdrawMsg], {
    memo: 'Withdraw rewards',
    fee: [coin('uinit', '10000')],
    gasLimit: 200000,
  })

  console.log('Withdraw tx:', withdrawResult.txHash)

  // -------------------------------------------------------------------------
  // 4. Undelegate tokens
  // -------------------------------------------------------------------------
  console.log('\n--- Undelegating 5 INIT from validator2 ---')

  const undelegateMsg = msgs.mstaking.undelegate({
    delegatorAddress: ctx.address,
    validatorAddress: validator2,
    amount: [coin('uinit', '5000000')], // 5 INIT
  })

  const undelegateResult = await ctx.signAndBroadcast([undelegateMsg], {
    memo: 'Undelegate via high-level API',
    fee: [coin('uinit', '10000')],
    gasLimit: 200000,
  })

  console.log('Undelegate tx:', undelegateResult.txHash)

  // -------------------------------------------------------------------------
  // Bonus: Multiple messages in one transaction
  // -------------------------------------------------------------------------
  console.log('\n--- Withdrawing rewards from both validators in one tx ---')

  const multiMsg = [
    msgs.distribution.withdrawDelegatorReward({
      delegatorAddress: ctx.address,
      validatorAddress: validator1,
    }),
    msgs.distribution.withdrawDelegatorReward({
      delegatorAddress: ctx.address,
      validatorAddress: validator2,
    }),
  ]

  const multiResult = await ctx.signAndBroadcast(multiMsg, {
    memo: 'Batch withdraw rewards',
    fee: [coin('uinit', '15000')],
    gasLimit: 300000,
  })

  console.log('Batch tx:', multiResult.txHash)
}

main().catch(console.error)
