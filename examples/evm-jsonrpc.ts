/**
 * Example: EVM Contract via JSON-RPC Transport
 *
 * Demonstrates `{ evmTransport: 'jsonrpc' }` on context level.
 * All contracts created from this context use Ethereum JSON-RPC
 * (eth_call, eth_estimateGas, eth_sendRawTransaction) instead of Cosmos gRPC.
 *
 * Key differences from gRPC (default):
 *   - read:        identical API
 *   - estimateGas: no `sender` first arg (derived from privateKey)
 *   - write:       no `sender` first arg, returns Promise<string> (tx hash)
 *   - errors:      ContractError.data contains raw revert bytes
 *
 * Covered patterns:
 *  1. Read via JSON-RPC (same as gRPC)
 *  2. Gas estimation via JSON-RPC (no sender)
 *  3. Write via JSON-RPC (no sender, returns tx hash)
 *  4. Error handling with raw revert data
 *  5. Token helpers (parseUnits / formatUnits / getTokenInfo)
 */

import { createMinievmContext, MnemonicKey } from 'initia.js'
import { createEvmContract, decodeRevertReason } from 'initia.js/evm'
import { ContractError } from 'initia.js/util'
import { SENDER, RECIPIENT, CONTRACT, TEST_MNEMONIC } from './constants'

import { ERC20_ABI } from './abis/erc20'

// =============================================================================
// Main
// =============================================================================

async function main() {
  const senderKey = new MnemonicKey({ mnemonic: TEST_MNEMONIC, index: 0 })

  // -------------------------------------------------------------------------
  // Context-level JSON-RPC transport
  //
  // Set `evmTransport: 'jsonrpc'` once on the context.
  // All contracts created from this context automatically use JSON-RPC.
  // The signer provides the private key for write/estimateGas operations.
  // -------------------------------------------------------------------------
  const chain = await createMinievmContext({
    network: 'testnet',
    chainId: 'evm-1',
    signer: senderKey,
    evmTransport: 'jsonrpc',
  })

  // No per-contract transport option needed — inherited from context
  const erc20 = createEvmContract(chain, CONTRACT.evm, ERC20_ABI)

  // =========================================================================
  // 1. Read via JSON-RPC — identical API to gRPC
  // =========================================================================
  console.log('\n--- 1. Read via JSON-RPC ---')

  const [name, symbol, decimals, totalSupply] = await Promise.all([
    erc20.read.name(),
    erc20.read.symbol(),
    erc20.read.decimals(),
    erc20.read.totalSupply(),
  ])
  console.log(`Token: ${name} (${symbol}), decimals=${decimals}, supply=${totalSupply}`)

  const balance = await erc20.read.balanceOf(SENDER.evm as `0x${string}`)
  console.log(`Sender balance: ${balance}`)

  // =========================================================================
  // 2. Gas estimation — no sender arg (derived from privateKey)
  //
  //   gRPC:     erc20.estimateGas.transfer(sender, to, amount)
  //   JSON-RPC: erc20.estimateGas.transfer(to, amount)
  // =========================================================================
  console.log('\n--- 2. Gas estimation via JSON-RPC ---')

  const gasTransfer = await erc20.estimateGas.transfer(RECIPIENT.evm as `0x${string}`, 1_000_000n)
  console.log(`transfer estimated gas: ${gasTransfer}`)

  const gasApprove = await erc20.estimateGas.approve(RECIPIENT.evm as `0x${string}`, 5_000_000n)
  console.log(`approve estimated gas: ${gasApprove}`)

  // =========================================================================
  // 3. Write via JSON-RPC — no sender arg, returns tx hash
  //
  //   gRPC:     const msg = erc20.write.transfer(sender, to, amount)
  //             await ctx.signAndBroadcast([msg])
  //
  //   JSON-RPC: const txHash = await erc20.write.transfer(to, amount)
  // =========================================================================
  console.log('\n--- 3. Write via JSON-RPC ---')

  const txHash = await erc20.write.transfer(RECIPIENT.evm as `0x${string}`, 1_000_000n)
  console.log(`transfer tx hash: ${txHash}`)

  // =========================================================================
  // 4. Error handling — ContractError.data contains raw revert bytes
  //
  //   gRPC:     ContractError.message = "execution reverted" (string only)
  //   JSON-RPC: ContractError.data = "0x08c379a0..." (raw hex for decoding)
  // =========================================================================
  console.log('\n--- 4. Error handling ---')

  try {
    // This may fail if sender has insufficient balance
    await erc20.read.balanceOf('0x0000000000000000000000000000000000000000')
  } catch (e) {
    if (e instanceof ContractError && e.data) {
      // Decode custom errors, standard Error(string), or Panic(uint256)
      const reason = decodeRevertReason(e.data, ERC20_ABI)
      console.log(`Revert reason: ${reason}`)
      console.log(`Raw revert data: ${e.data}`)
    } else {
      console.log('Error (no revert data):', e)
    }
  }

  // =========================================================================
  // 5. Token helpers — identical to gRPC
  // =========================================================================
  console.log('\n--- 5. Token helpers ---')

  const info = await erc20.getTokenInfo()
  console.log(
    `Token: ${info.name} (${info.symbol}), decimals=${info.decimals}, supply=${info.totalSupply}`
  )

  const smallest = await erc20.parseUnits('100.5')
  const display = await erc20.formatUnits(smallest)
  console.log(`parseUnits("100.5") = ${smallest}, formatUnits back = "${display}"`)
}

main().catch(console.error)
