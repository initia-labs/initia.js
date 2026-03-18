/**
 * Example: EVM Contract — ABI-Driven Interactions
 *
 * Demonstrates how `as const satisfies Abi` gives full TypeScript inference
 * for every read/write/event/error call.
 *
 * Covered patterns:
 *  1. Type-safe reads  — return types inferred from ABI outputs
 *  2. Type-safe writes — MsgCall created from ABI inputs
 *  3. Gas estimation   — same signature as write, returns gas
 *  4. Token helpers    — getTokenInfo / parseUnits / formatUnits
 *  5. Event decoding   — decode logs, filter by event, get topic0
 *  6. Error decoding   — custom errors + standard Error(string)
 *  7. Multi-contract   — interact with >1 contract in a single flow
 *  8. Deployment       — createDeployEvmContractMsg with constructor args
 *  9. Mid-level encode — encodeEvmCall / encodeEvmParameters (signature string, no ABI object)
 * 10. Low-level ABI    — encodeFunctionData / decodeFunctionResult standalone
 * 11. Address helpers  — EVM ↔ bech32 conversion
 */

import { createMinievmContext } from 'initia.js'
import {
  createEvmContract,
  createDeployEvmContractMsg,
  // Event utilities
  decodeEvmLogs,
  filterEvmLogsByEvent,
  getEventSignature,
  // Error utility
  decodeRevertReason,
  // Mid-level encoding (signature string + bech32 auto-conversion)
  encodeEvmCall,
  encodeEvmParameters,
  // Low-level ABI encoding (re-exported from viem)
  encodeFunctionData,
  decodeFunctionResult,
  // Type imports
  type Abi,
  type EvmLog,
} from 'initia.js/evm'
import { AccAddress, ContractError } from 'initia.js/util'
import { SENDER, RECIPIENT, CONTRACT } from './constants'

// =============================================================================
// 1) ABI definition — `as const satisfies Abi` is the key
//
//    This enables TypeScript to infer:
//    - erc20.read.balanceOf(addr)  → Promise<bigint>       (from outputs)
//    - erc20.read.name()           → Promise<string>
//    - erc20.write.transfer(...)   → MsgCall               (from inputs)
//    - decodeEvmLogs(ABI, logs)    → Transfer/Approval args (from events)
//    - decodeRevertReason(data, ABI) → InsufficientBalance  (from errors)
// =============================================================================

const ERC20_ABI = [
  // --- View functions ---
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  // --- State-changing functions ---
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'transferFrom',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  // --- Events ---
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Approval',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'spender', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
  // --- Custom errors ---
  {
    type: 'error',
    name: 'InsufficientBalance',
    inputs: [
      { name: 'available', type: 'uint256' },
      { name: 'required', type: 'uint256' },
    ],
  },
  // --- Constructor (used by deploy) ---
  {
    type: 'constructor',
    inputs: [
      { name: 'name_', type: 'string' },
      { name: 'symbol_', type: 'string' },
      { name: 'decimals_', type: 'uint8' },
    ],
    stateMutability: 'nonpayable',
  },
] as const satisfies Abi

// =============================================================================
// Main
// =============================================================================

async function main() {
  const chain = await createMinievmContext({ network: 'testnet', chainId: 'evm-1' })
  const erc20 = createEvmContract(chain, CONTRACT.evm, ERC20_ABI)

  // =========================================================================
  // Pattern 1: Type-safe reads — return types are inferred from ABI
  // =========================================================================
  console.log('\n--- 1. Type-safe reads ---')

  // TypeScript knows: name() → string, decimals() → number, balanceOf() → bigint
  const [name, symbol, decimals, totalSupply] = await Promise.all([
    erc20.read.name(),
    erc20.read.symbol(),
    erc20.read.decimals(),
    erc20.read.totalSupply(),
  ])
  console.log(`Token: ${name} (${symbol}), decimals=${decimals}, supply=${totalSupply}`)

  const balance = await erc20.read.balanceOf(SENDER.evm as `0x${string}`)
  console.log(`Balance of sender: ${balance}`)

  // allowance: two address params → returns bigint
  const allowance = await erc20.read.allowance(
    SENDER.evm as `0x${string}`,
    RECIPIENT.evm as `0x${string}`
  )
  console.log(`Allowance: ${allowance}`)

  // =========================================================================
  // Pattern 2: Type-safe writes — creates MsgCall from ABI
  // =========================================================================
  console.log('\n--- 2. Type-safe writes (message creation) ---')

  // write.transfer(sender, to, amount) — sender is always the first arg
  const transferMsg = erc20.write.transfer(
    SENDER.bech32,
    RECIPIENT.evm as `0x${string}`,
    1_000_000n
  )

  console.log(
    `transfer MsgCall: sender=${transferMsg.value.sender}, input=${transferMsg.value.input.slice(0, 20)}...`
  )

  // approve + transferFrom (allowance flow)
  const approveMsg = erc20.write.approve(SENDER.bech32, RECIPIENT.evm as `0x${string}`, 5_000_000n)
  console.log(`approve MsgCall: sender=${approveMsg.value.sender}`)

  const transferFromMsg = erc20.write.transferFrom(
    SENDER.bech32, // tx sender (spender)
    SENDER.evm as `0x${string}`, // from
    RECIPIENT.evm as `0x${string}`, // to
    1_000_000n
  )
  console.log(`transferFrom MsgCall: sender=${transferFromMsg.value.sender}`)

  // To broadcast: await chain.signAndBroadcast([transferMsg])

  // =========================================================================
  // Pattern 3: Gas estimation — same API as write, returns bigint gas
  // =========================================================================
  console.log('\n--- 3. Gas estimation ---')

  const gasTransfer = await erc20.estimateGas.transfer(
    SENDER.bech32,
    RECIPIENT.evm as `0x${string}`,
    1_000_000n
  )
  console.log(`transfer estimated gas: ${gasTransfer}`)

  // =========================================================================
  // Pattern 4: Token helpers — parseUnits / formatUnits / getTokenInfo
  // =========================================================================
  console.log('\n--- 4. Token helpers ---')

  const info = await erc20.getTokenInfo()
  console.log(
    `Token: ${info.name} (${info.symbol}), decimals=${info.decimals}, supply=${info.totalSupply}`
  )

  // parseUnits uses the ABI decimals() call internally (cached)
  const smallest = await erc20.parseUnits('100.5')
  const display = await erc20.formatUnits(smallest)
  console.log(`parseUnits("100.5") = ${smallest}, formatUnits back = "${display}"`)

  // =========================================================================
  // Pattern 5: Event decoding from transaction logs
  // =========================================================================
  console.log('\n--- 5. Event decoding ---')

  // In practice, logs come from tx results or getLogs(). Using mock data here.
  const mockLogs: EvmLog[] = [] // real logs from tx result

  // Decode all events matching the ABI
  const decoded = decodeEvmLogs(ERC20_ABI, mockLogs)
  for (const evt of decoded) {
    console.log(`Event: ${evt.eventName}`, evt.args)
  }

  // Filter by specific event name
  const transfers = filterEvmLogsByEvent(ERC20_ABI, mockLogs, 'Transfer')
  console.log(`Transfer events: ${transfers.length}`)

  // Get topic0 hash for log filtering (useful with eth_getLogs)
  const transferTopic = getEventSignature(ERC20_ABI, 'Transfer')
  const approvalTopic = getEventSignature(ERC20_ABI, 'Approval')
  console.log(`Transfer topic0: ${transferTopic}`)
  console.log(`Approval topic0: ${approvalTopic}`)

  // Alternative: viem's parseEventLogs for batch decoding with type inference
  // import { parseEventLogs } from 'initia.js/evm'
  //
  // const typedLogs = parseEventLogs({
  //   abi: ERC20_ABI,
  //   eventName: 'Transfer',
  //   logs: receipt.logs,
  // })
  // typedLogs[0].args.from // full autocomplete
  //
  // NOTE: parseEventLogs returns addresses in EIP-55 checksum format (mixed-case),
  // while on-chain RPC returns lowercase. Use .toLowerCase() when comparing
  // with raw on-chain data.

  // =========================================================================
  // Pattern 6: Revert reason decoding
  // =========================================================================
  console.log('\n--- 6. Error decoding ---')

  // If a contract call reverts, decode the reason from error data
  try {
    // Simulate a failing call (this won't actually fail here)
    await erc20.read.balanceOf(SENDER.evm as `0x${string}`)
  } catch (e) {
    if (e instanceof ContractError && e.data) {
      // Decodes custom errors defined in ABI (e.g., InsufficientBalance)
      // and standard Error(string) / Panic(uint256)
      const reason = decodeRevertReason(e.data, ERC20_ABI)
      console.log(`Revert reason: ${reason}`)
    }
  }

  // =========================================================================
  // Pattern 7: Multi-contract flow — two contracts, one flow
  // =========================================================================
  console.log('\n--- 7. Multi-contract interaction ---')

  // Create a second contract instance (wrapped L2 native token)
  const wrappedL2 = createEvmContract(chain, CONTRACT.evmWrappedL2, ERC20_ABI)

  // Read from both contracts in parallel
  const [tokenAInfo, tokenBInfo] = await Promise.all([
    erc20.getTokenInfo(),
    wrappedL2.getTokenInfo(),
  ])
  console.log(`Token A: ${tokenAInfo.symbol} (${tokenAInfo.decimals} decimals)`)
  console.log(`Token B: ${tokenBInfo.symbol} (${tokenBInfo.decimals} decimals)`)

  // Build multi-message transaction (e.g., approve + transferFrom in one tx)
  const msgs = [
    erc20.write.approve(SENDER.bech32, RECIPIENT.evm as `0x${string}`, 10_000_000n),
    erc20.write.transfer(SENDER.bech32, RECIPIENT.evm as `0x${string}`, 1_000_000n),
  ]
  console.log(`Batched ${msgs.length} messages for single tx`)

  // =========================================================================
  // Pattern 8: Deployment with constructor args
  // =========================================================================
  console.log('\n--- 8. Contract deployment ---')

  const deployMsg = createDeployEvmContractMsg(SENDER.evm, {
    abi: ERC20_ABI,
    bytecode: '0x6080604052...', // placeholder bytecode
    args: ['MyToken', 'MTK', 18], // constructor args inferred from ABI
  })
  console.log(`Deploy msg: contractAddr="${deployMsg.contractAddr}" (empty = create)`)

  // =========================================================================
  // Pattern 9: Mid-level encoding (signature string, no ABI object needed)
  //
  //   Accepts human-readable signatures (same format as viem/ethers.js).
  //   Bech32 addresses in args are auto-converted to hex for address params.
  //   Useful when you know the function signature but don't have a full ABI.
  // =========================================================================
  console.log('\n--- 9. Mid-level encoding ---')

  // encodeEvmCall: signature string → calldata (with function selector)
  const midCalldata = encodeEvmCall(
    'function transfer(address to, uint256 amount)',
    [SENDER.bech32, 1_000_000n] // bech32 address — auto-converted to hex
  )
  console.log(`encodeEvmCall: ${midCalldata.slice(0, 20)}... (${midCalldata.length} chars)`)

  // 'function' keyword is optional — Solidity signature format also works
  const midCalldata2 = encodeEvmCall(
    'transfer(address,uint256)',
    [RECIPIENT.evm, 500_000n] // hex address — passed through as-is
  )
  console.log(`encodeEvmCall (short form): ${midCalldata2.slice(0, 20)}...`)

  // encodeEvmParameters: type strings → encoded params (no function selector)
  const midEncoded = encodeEvmParameters(
    ['address', 'uint256'],
    [SENDER.bech32, 42n] // bech32 auto-converted
  )
  console.log(`encodeEvmParameters: ${midEncoded.slice(0, 20)}... (${midEncoded.length} chars)`)

  // =========================================================================
  // Pattern 10: Low-level ABI encoding (standalone, no contract instance)
  // =========================================================================
  console.log('\n--- 10. Low-level ABI encoding ---')

  // Encode a function call manually
  const calldata = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: [RECIPIENT.evm as `0x${string}`, 500_000n],
  })
  console.log(`Encoded calldata: ${calldata.slice(0, 20)}... (${calldata.length} chars)`)

  // Decode a raw return value
  const mockReturnData =
    '0x0000000000000000000000000000000000000000000000000000000000000001' as const
  const decodedResult = decodeFunctionResult({
    abi: ERC20_ABI,
    functionName: 'transfer',
    data: mockReturnData,
  })
  console.log(`Decoded transfer result: ${decodedResult}`) // true

  // =========================================================================
  // Pattern 11: Address conversion (EVM hex ↔ bech32)
  // =========================================================================
  console.log('\n--- 11. Address conversion ---')

  const bech32Addr = AccAddress.fromHex(SENDER.evm, { prefix: 'init' })
  const evmAddr = AccAddress.toHex(bech32Addr)
  console.log(`EVM → bech32 → EVM: ${SENDER.evm} → ${bech32Addr} → ${evmAddr}`)
}

main().catch(console.error)
