/**
 * Verify EVM signing fix: noble-curves format:'recovered' byte layout.
 *
 * This script verifies that sendEvmTx correctly signs EIP-1559 transactions
 * by sending a real transaction on evm-1 testnet.
 *
 * Steps:
 *   1. Check sender EVM balance on evm-1
 *   2. If no balance, deposit 1 INIT from L1 (initiation-2) → evm-1
 *   3. Send a simple ETH self-transfer via JSON-RPC (exercises sendEvmTx)
 *   4. Wait for receipt and verify success
 *
 * Prerequisites:
 *   TEST_MNEMONIC env var with funded testnet wallet on initiation-2.
 *
 * Usage:
 *   TEST_MNEMONIC="..." npx tsx examples/verify-evm-signing.ts
 */

import { createChainContext, createEvmContext, MnemonicKey } from 'initia.js'
import { createRegistryProvider } from 'initia.js/provider'
import { sendEvmTxAndWait } from 'initia.js/evm'
import { TEST_MNEMONIC, SENDER } from './constants'

const L1_CHAIN = 'initiation-2'
const L2_CHAIN = 'evm-1'

async function main() {
  console.log('=== EVM Signing Verification ===\n')

  const provider = await createRegistryProvider({ network: 'testnet' })
  const key = new MnemonicKey({ mnemonic: TEST_MNEMONIC, index: 0 })

  console.log(`Sender bech32: ${key.address}`)
  console.log(`Sender EVM:    ${key.evmAddress}`)
  console.log(`Private key:   ${key.getPrivateKeyHex().slice(0, 10)}...`)

  // -------------------------------------------------------------------------
  // 1. Check EVM balance on evm-1
  // -------------------------------------------------------------------------
  const ctx = createEvmContext(provider, L2_CHAIN, {
    signer: key,
    evmTransport: 'jsonrpc',
  })

  const evmRpc = ctx.evmRpc
  const evmAddr = SENDER.evm as `0x${string}`

  const balance = await evmRpc.getBalance(evmAddr)
  console.log(`\nevm-1 balance: ${balance} wei (${Number(balance) / 1e18} native)`)

  // -------------------------------------------------------------------------
  // 2. If no balance, deposit from L1
  // -------------------------------------------------------------------------
  if (balance === 0n) {
    console.log('\nNo balance on evm-1. Depositing 1 INIT from L1...')

    const bridge = provider.bridge
    const l1Info = provider.getChainInfo<'initia'>(L1_CHAIN)
    if (!l1Info) throw new Error(`Chain ${L1_CHAIN} not found`)
    const l1 = createChainContext(l1Info, { signer: key })

    const depositMsg = bridge.deposit({
      sender: key.address,
      toChain: L2_CHAIN,
      amount: '1000000uinit',
    })

    const result = await l1.signAndBroadcast([depositMsg], {
      waitForConfirmation: true,
    })

    if (result.code !== 0) {
      throw new Error(`Deposit failed: ${result.rawLog}`)
    }

    console.log(`Deposit tx: ${result.txHash}`)
    console.log('Waiting for deposit to arrive on evm-1 (may take a few minutes)...')

    // Poll for balance on evm-1
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 10_000))
      const newBalance = await evmRpc.getBalance(evmAddr)
      if (newBalance > 0n) {
        console.log(`Balance arrived: ${newBalance} wei`)
        break
      }
      console.log(`  still waiting... (${(i + 1) * 10}s)`)
    }
  }

  // -------------------------------------------------------------------------
  // 3. Send self-transfer via sendEvmTx (exercises the signing fix)
  // -------------------------------------------------------------------------
  console.log('\n--- Sending EVM self-transfer via sendEvmTx ---')

  const result = await sendEvmTxAndWait({
    rpc: evmRpc,
    privateKey: key.getPrivateKeyHex(),
    to: evmAddr,
    data: '0x',
    value: 1n, // 1 wei self-transfer
  })

  console.log(`\nTx hash:      ${result.txHash}`)
  console.log(`Status:       ${result.status}`)
  console.log(`Block number: ${result.blockNumber}`)
  console.log(`Gas used:     ${result.gasUsed}`)

  if (result.status === 'success') {
    console.log('\n✓ EVM signing fix verified! Transaction succeeded on testnet.')
  } else {
    console.log('\n✗ Transaction reverted. Check the tx hash for details.')
    process.exit(1)
  }
}

main().catch(err => {
  console.error('\nError:', err)
  process.exit(1)
})
