/**
 * Example: Type Narrowing for Multi-VM Chains
 *
 * Demonstrates how TypeScript generics narrow ChainContext to provide
 * VM-specific autocomplete and type safety — no `as any` casts needed.
 *
 * Patterns shown:
 *  1. getChainInfo<T>()       → narrowed ChainInfo with chainType: T
 *  2. createChainContext()    → narrowed ChainContext<T> with VM-specific client/msgs
 *  3. wallet.chain<T>(id)    → same narrowing via Wallet API
 *  4. Contract factories     → accept narrowed context without cast
 *
 * This file is not meant to be executed — it demonstrates compile-time
 * type inference. Run `npx tsc --noEmit examples/type-narrowing.ts` to verify.
 */

import { createChainContext, MnemonicKey, coin } from 'initia.js'
import { createRegistryProvider } from 'initia.js/provider'
import { createEvmContract } from 'initia.js/evm'
import { createMoveContract } from 'initia.js/move'
import { createWasmContract } from 'initia.js/wasm'
import { TEST_MNEMONIC, CONTRACT, MODULE } from './constants'

// Minimal ERC20 ABI for demonstration
const ERC20_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const

async function main() {
  const provider = await createRegistryProvider({ network: 'testnet' })
  const key = new MnemonicKey({ mnemonic: TEST_MNEMONIC })

  // ===========================================================================
  // 1. Initia L1 — narrowed to 'initia'
  // ===========================================================================

  // getChainInfo<'initia'>() returns ChainInfo & { chainType: 'initia' }
  const l1Info = provider.getChainInfo<'initia'>('initiation-2')
  if (!l1Info) throw new Error('Chain not found')

  // createChainContext infers ChainContext<'initia'> from l1Info.chainType
  const l1 = createChainContext(l1Info, { signer: key })

  // ctx.msgs is narrowed to InitiaMsgs — mstaking.delegate, gov.vote etc.
  const delegateMsg = l1.msgs.mstaking.delegate({
    delegatorAddress: key.address,
    validatorAddress: 'initvaloper1...',
    amount: [coin('uinit', '1000000')],
  })

  // Message return type is narrowed: Message<typeof MsgDelegateSchema>
  // TypeScript knows the exact fields — no cast or type assertion needed
  console.log(`Delegate type:      ${delegateMsg.typeUrl}`)
  console.log(`Delegate delegator: ${delegateMsg.value.delegatorAddress}`)
  console.log(`Delegate validator: ${delegateMsg.value.validatorAddress}`)

  // ctx.client has mstaking, distribution, gov etc.
  const delegations = await l1.client.mstaking.delegatorDelegations({
    delegatorAddr: key.address,
  })
  console.log(`L1 delegations: ${delegations.delegationResponses.length}`)

  // ===========================================================================
  // 2. Minievm L2 — narrowed to 'minievm'
  // ===========================================================================

  const evmInfo = provider.getChainInfo<'minievm'>('evm-1')
  if (!evmInfo) throw new Error('Chain not found')

  const evm = createChainContext(evmInfo, { signer: key })

  // evmRpc is available (narrowed to minievm) — no cast needed
  const chainId = await evm.evmRpc.getChainId()
  console.log(`EVM chain ID: ${chainId}`)

  // Contract factory accepts narrowed context directly
  const erc20 = createEvmContract(evm, CONTRACT.evm, ERC20_ABI)
  const balance = await erc20.read.balanceOf(key.evmAddress as `0x${string}`)
  console.log(`ERC20 balance: ${balance}`)

  // ctx.evmRpc is also available on minievm contexts
  if (evm.evmRpc) {
    const blockNumber = await evm.evmRpc.getBlockNumber()
    console.log(`EVM block: ${blockNumber}`)
  }

  // ===========================================================================
  // 3. Minimove L2 — narrowed to 'minimove'
  // ===========================================================================

  const moveInfo = provider.getChainInfo<'minimove'>('move-1')
  if (!moveInfo) throw new Error('Chain not found')

  const move = createChainContext(moveInfo, { signer: key })

  // ctx.client.move is available — no cast needed
  const coinModule = await createMoveContract(move, MODULE.moveStdlib, 'coin')
  const moveBalance = await coinModule.view.balance({
    typeArgs: ['0x1::native_uinit::Coin'],
    args: [key.address],
  })
  console.log(`Move balance: ${moveBalance}`)

  // ===========================================================================
  // 4. Miniwasm L2 — narrowed to 'miniwasm'
  // ===========================================================================

  const wasmInfo = provider.getChainInfo<'miniwasm'>('wasm-1')
  if (!wasmInfo) throw new Error('Chain not found')

  const wasm = createChainContext(wasmInfo, { signer: key })

  // ctx.client.wasm is available — no cast needed
  const codes = await wasm.client.wasm.codes({})
  console.log(`Wasm codes: ${codes.codeInfos.length}`)

  // Contract factory accepts narrowed context
  const cw20 = createWasmContract(wasm, 'init1...')
  const tokenInfo = await cw20.query.token_info({})
  console.log(`CW20 token info:`, tokenInfo)
}

main().catch(console.error)
