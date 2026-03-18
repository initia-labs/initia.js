/**
 * Example: EVM Typed Contract with Static ABI
 *
 * Demonstrates how importing a static ABI from a separate file gives
 * full TypeScript inference for read/write method names, args, and returns.
 *
 * Key difference from evm-contract.ts:
 *   - ABI lives in a separate file (./abis/erc20.ts)
 *   - This example focuses on the typed autocomplete experience
 *
 * Try typing `erc20.read.` or `erc20.write.` in your IDE to see autocomplete.
 */

import { createMinievmContext } from 'initia.js'
import { createEvmContract } from 'initia.js/evm'
import { SENDER, RECIPIENT, CONTRACT } from './constants'

// Import static ABI from separate file — `as const satisfies Abi`
import { ERC20_ABI } from './abis/erc20'

async function main() {
  const chain = await createMinievmContext({ network: 'testnet', chainId: 'evm-1' })

  // Create typed contract — ABI from separate file
  const erc20 = createEvmContract(chain, CONTRACT.evm, ERC20_ABI)

  // =========================================================================
  // Typed reads — return types inferred from ABI outputs
  //   erc20.read.name()        → Promise<string>
  //   erc20.read.decimals()    → Promise<number>
  //   erc20.read.balanceOf(a)  → Promise<bigint>
  // =========================================================================
  const [name, symbol, decimals] = await Promise.all([
    erc20.read.name(),
    erc20.read.symbol(),
    erc20.read.decimals(),
  ])
  console.log(`Token: ${name} (${symbol}), decimals=${decimals}`)

  const balance = await erc20.read.balanceOf(SENDER.evm as `0x${string}`)
  console.log(`Balance: ${balance}`)

  // =========================================================================
  // Typed writes — args inferred from ABI inputs
  //   erc20.write.transfer(sender, to, amount) — (string, `0x${string}`, bigint)
  //   erc20.write.approve(sender, spender, amount)
  // =========================================================================
  const transferMsg = erc20.write.transfer(
    SENDER.bech32,
    RECIPIENT.evm as `0x${string}`,
    1_000_000n
  )
  console.log(`Transfer msg created: sender=${transferMsg.value.sender}`)

  const approveMsg = erc20.write.approve(SENDER.bech32, RECIPIENT.evm as `0x${string}`, 5_000_000n)
  console.log(`Approve msg created: sender=${approveMsg.value.sender}`)

  // To broadcast: await chain.signAndBroadcast([transferMsg, approveMsg])
}

main().catch(console.error)
