/**
 * Example: Query Operations
 *
 * This example demonstrates read-only queries using ChainContext:
 * 1. High-level convenience queries (getAccount, getBalance)
 * 2. Direct gRPC client queries (bank, auth, staking)
 *
 * No signing required - context without a key is query-only.
 * For signing capabilities, pass a signer to createInitiaContext().
 */

import { createInitiaContext } from 'initia.js'
import { SENDER } from './constants'

async function main() {
  const ctx = await createInitiaContext({ network: 'testnet' })
  console.log('Connected to:', ctx.chainId)

  // -------------------------------------------------------------------------
  // 1. Direct gRPC Client Queries
  // -------------------------------------------------------------------------
  console.log('\n=== Direct gRPC Queries ===\n')

  const address = SENDER.bech32

  const balanceResponse = await ctx.client.bank.balance({ address, denom: 'uinit' })
  console.log('Balance:', balanceResponse.balance?.amount, 'uinit')

  const allBalancesResponse = await ctx.client.bank.allBalances({ address })
  console.log('All balances:', allBalancesResponse.balances.length, 'denoms')

  const accountResponse = await ctx.client.auth.account({ address })
  console.log('Account type:', accountResponse.account?.typeUrl)

  const delegationsResponse = await ctx.client.mstaking.delegatorDelegations({
    delegatorAddr: address,
  })
  console.log('Delegations:', delegationsResponse.delegationResponses.length)

  for (const delegation of delegationsResponse.delegationResponses) {
    console.log(
      `  Validator: ${delegation.delegation?.validatorAddress}`,
      `Amount: ${delegation.balance.map(b => `${b.amount} ${b.denom}`).join(', ')}`
    )
  }
}

main().catch(console.error)
