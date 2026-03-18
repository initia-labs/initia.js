/**
 * Example: VM-Agnostic Token Abstraction
 *
 * Demonstrates the unified TokenContract interface across VMs:
 * 1. ChainContext.getTokenContract() — auto-dispatch by chain type
 * 2. Unified operations: getInfo(), balanceOf(), createTransferMsg()
 * 3. Low-level resolveTokenContract() for direct client usage
 *
 * Dispatch rules:
 *   minievm  + 0x address  → ERC20
 *   miniwasm + bech32 addr → CW20
 *   initia/minimove + addr → Move Fungible Asset
 */

import { createChainContext, resolveTokenContract, type EvmEnabled } from 'initia.js'
import { createRegistryProvider } from 'initia.js/provider'
import { SENDER, CONTRACT } from './constants'

async function main() {
  const provider = await createRegistryProvider({ network: 'testnet' })

  // -------------------------------------------------------------------------
  // 1. ERC20 via ChainContext.getTokenContract() (recommended)
  // -------------------------------------------------------------------------
  console.log('=== ERC20 Token via ChainContext ===\n')

  const evmChain = provider.listChains().find(c => c.chainType === 'minievm')
  if (!evmChain) throw new Error('No minievm chain found')

  const evmCtx = createChainContext(evmChain)

  // getTokenContract dispatches to ERC20 adapter automatically
  const erc20 = evmCtx.getTokenContract(CONTRACT.evmWrappedL2)

  const info = await erc20.getInfo()
  console.log(`Name: ${info.name}, Symbol: ${info.symbol}, Decimals: ${info.decimals}`)

  const balance = await erc20.balanceOf(SENDER.evm)
  console.log(`Balance: ${balance}`)

  // Create transfer message (for signing — not executed here)
  const msg = erc20.createTransferMsg(SENDER.evm, SENDER.evm, 1000)
  console.log('Transfer msg type:', msg.typeUrl)

  // ERC20/CW20-specific: allowance (optional on TokenContract)
  if (erc20.allowance) {
    const allowance = await erc20.allowance(SENDER.evm, SENDER.evm)
    console.log('Allowance:', allowance)
  }

  // -------------------------------------------------------------------------
  // 2. Same interface via low-level resolveTokenContract()
  // -------------------------------------------------------------------------
  console.log('\n=== resolveTokenContract (low-level) ===\n')

  // Useful when you have a client but no ChainContext.
  // Type assertion needed because listChains() returns untyped ChainInfo[].
  const token = resolveTokenContract(
    evmCtx.client as EvmEnabled,
    'minievm',
    CONTRACT.evm,
    SENDER.evm
  )

  const tokenInfo = await token.getInfo()
  console.log(`Name: ${tokenInfo.name}, Symbol: ${tokenInfo.symbol}`)

  const tokenBalance = await token.balanceOf(SENDER.evm)
  console.log(`Balance: ${tokenBalance}`)

  // -------------------------------------------------------------------------
  // 3. Move Fungible Asset on initia L1
  // -------------------------------------------------------------------------
  console.log('\n=== Move Fungible Asset (initia L1) ===\n')

  const initiaInfo = provider.getChainInfo<'initia'>('initiation-2')
  if (!initiaInfo) throw new Error('Initia chain not found')

  const initiaCtx = createChainContext(initiaInfo)

  // Metadata address identifies the fungible asset
  // For custom tokens, use the metadata object address from deployment
  const metadataAddress = '0x1::metadata::uinit'
  const fa = initiaCtx.getTokenContract(metadataAddress)

  try {
    const faInfo = await fa.getInfo()
    console.log(`Name: ${faInfo.name}, Symbol: ${faInfo.symbol}, Decimals: ${faInfo.decimals}`)

    const faBalance = await fa.balanceOf(SENDER.bech32)
    console.log(`Balance: ${faBalance}`)

    // Move FA does not have allowance/approve (undefined)
    console.log('Has allowance?', !!fa.allowance)
  } catch (e) {
    console.log('Move FA query failed:', (e as Error).message)
  }
}

main().catch(console.error)
