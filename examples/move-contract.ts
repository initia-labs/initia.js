/**
 * Example: Move Contract — ABI-Driven Interactions
 *
 * Demonstrates how Move module ABIs (auto-fetched from chain) enable
 * structured interactions with full function/type introspection.
 *
 * Covered patterns:
 *  1. ABI introspection  — explore module functions, structs, params
 *  2. Entry functions     — type-checked execute via proxy
 *  3. View functions      — type-checked queries via proxy
 *  4. Token helpers       — getTokenInfo / parseUnits / formatUnits (coin type)
 *  5. Resource queries    — read on-chain state (CoinStore, etc.)
 *  6. Table entry queries — key-value lookups with BCS-encoded keys
 *  7. Multi-module        — interact with >1 module in a single flow
 *  8. BCS encoding        — encodeMoveArg / decodeMoveResult for all Move types
 *  9. Standalone queries  — callViewFunction / queryResource without contract instance
 * 10. Module publishing   — createPublishMsg / createScriptMsg
 * 11. Event decoding      — parse Move events from tx results
 * 12. Cache management    — clearAbiCache for upgradeable modules
 */

import { createMinimoveContext } from 'initia.js'
import {
  createMoveContract,
  createExecuteMsg,
  createPublishMsg,
  createScriptMsg,
  createBcsScriptMsg,
  // ABI exploration
  getModuleAbi,
  getModulesAbi,
  findFunction,
  findStruct,
  getEntryFunctions,
  getViewFunctions,
  requiresSigner,
  getNonSignerParams,
  // Standalone queries
  callViewFunction,
  queryResource,
  queryTableEntry,
  // BCS encoding/decoding
  encodeMoveArg,
  decodeMoveResult,
  // Cache
  clearAbiCache,
  UpgradePolicy,
  type MoveModuleAbi,
} from 'initia.js/move'
import {
  parseMoveEvents,
  findMoveEventsByModule,
  findMoveEventsByType,
  type CosmosEvent,
} from 'initia.js/events'
import { SENDER, RECIPIENT, MODULE } from './constants'

// Coin type constant used throughout
const UINIT_COIN = '0x1::native_uinit::Coin'
const COIN_STORE = `0x1::coin::CoinStore<${UINIT_COIN}>`

// =============================================================================
// Main
// =============================================================================

async function main() {
  const chain = await createMinimoveContext({ network: 'testnet', chainId: 'move-1' })

  // PRIMARY API — ctx.contract() dispatches to the correct VM factory
  const coin = await chain.contract('0x1', 'coin')

  // Equivalent: const coin = await createMoveContract(chain, '0x1', 'coin')

  // =========================================================================
  // Pattern 1: ABI introspection — explore module structure
  // =========================================================================
  console.log('\n--- 1. ABI introspection ---')

  const abi = coin.abi
  console.log(`Module: ${abi.address}::${abi.name}`)
  console.log(`Friends: ${abi.friends.length}`)

  // List all entry functions (callable via MsgExecuteJSON)
  const entryFns = getEntryFunctions(abi)
  console.log(`Entry functions (${entryFns.length}):`)
  for (const fn of entryFns) {
    const signerRequired = requiresSigner(fn)
    const nonSignerParams = getNonSignerParams(fn)
    console.log(
      `  ${fn.name}(${fn.params.join(', ')})` +
        ` → signer=${signerRequired}, args=${nonSignerParams.length}`
    )
  }

  // List all view functions (read-only, no tx needed)
  const viewFns = getViewFunctions(abi)
  console.log(`View functions (${viewFns.length}):`)
  for (const fn of viewFns) {
    console.log(`  ${fn.name}(${fn.params.join(', ')})` + ` → returns [${fn.return.join(', ')}]`)
  }

  // Inspect a specific function
  const transferFn = findFunction(abi, 'transfer')
  if (transferFn) {
    console.log(`\ntransfer details:`)
    console.log(`  visibility: ${transferFn.visibility}`)
    console.log(`  is_entry: ${transferFn.is_entry}`)
    console.log(`  generic_type_params: ${transferFn.generic_type_params.length}`)
    console.log(`  params: ${transferFn.params.join(', ')}`)
  }

  // Inspect structs
  const coinInfoStruct = findStruct(abi, 'CoinInfo')
  if (coinInfoStruct) {
    console.log(`\nCoinInfo struct:`)
    console.log(`  abilities: ${coinInfoStruct.abilities.join(', ')}`)
    for (const field of coinInfoStruct.fields) {
      console.log(`  field: ${field.name}: ${field.type}`)
    }
  }

  // =========================================================================
  // Pattern 2: Entry functions — execute proxy creates MsgExecuteJSON
  // =========================================================================
  console.log('\n--- 2. Entry functions (execute proxy) ---')

  // The execute proxy validates against ABI: function must exist & be is_entry
  const transferMsg = coin.execute.transfer(SENDER.bech32, {
    typeArgs: [UINIT_COIN],
    args: [RECIPIENT.bech32, '1000000'],
  })
  console.log(`transfer MsgExecuteJSON:`)
  console.log(`  sender: ${transferMsg.value.sender}`)
  console.log(`  module: ${transferMsg.value.moduleAddress}::${transferMsg.value.moduleName}`)
  console.log(`  function: ${transferMsg.value.functionName}`)
  console.log(`  typeArgs: ${transferMsg.value.typeArgs}`)

  // To broadcast: await chain.signAndBroadcast([transferMsg])

  // =========================================================================
  // Pattern 3: View functions — read-only queries via proxy
  // =========================================================================
  console.log('\n--- 3. View functions (view proxy) ---')

  // The view proxy validates against ABI: function must exist & be is_view
  const balanceResult = await coin.view.balance({
    typeArgs: [UINIT_COIN],
    args: [SENDER.bech32],
  })
  console.log(`balance of sender: ${balanceResult}`)

  // View function returning multiple values
  const supplyResult = await coin.view.supply({
    typeArgs: [UINIT_COIN],
    args: [],
  })
  console.log(`UINIT supply: ${supplyResult}`)

  // =========================================================================
  // Pattern 4: Token helpers — getTokenInfo / parseUnits / formatUnits
  // =========================================================================
  console.log('\n--- 4. Token helpers ---')

  // getTokenInfo reads CoinInfo resource for a given coin type
  const info = await coin.getTokenInfo(UINIT_COIN)
  console.log(`Token: ${info.name} (${info.symbol}), decimals=${info.decimals}`)
  if (info.totalSupply !== undefined) {
    console.log(`Total supply: ${info.totalSupply}`)
  }

  // parseUnits: human-readable → smallest unit (uses CoinInfo.decimals)
  const smallest = await coin.parseUnits('100.5', UINIT_COIN)
  console.log(`parseUnits("100.5") = ${smallest}`)

  // formatUnits: smallest unit → human-readable
  const display = await coin.formatUnits(smallest, UINIT_COIN)
  console.log(`formatUnits back = "${display}"`)

  // =========================================================================
  // Pattern 5: Resource queries — read on-chain state
  // =========================================================================
  console.log('\n--- 5. Resource queries ---')

  // Query CoinStore resource for UINIT balance
  const coinStore = (await coin.resource(SENDER.bech32, COIN_STORE)) as {
    coin: { value: bigint } // u64 fields are auto-converted to bigint
    frozen: boolean
  }
  console.log(`CoinStore balance: ${coinStore.coin.value}`)
  console.log(`CoinStore frozen: ${coinStore.frozen}`)

  // Query CoinInfo resource
  const coinInfo = (await coin.resource(
    MODULE.moveStdlib,
    `0x1::coin::CoinInfo<${UINIT_COIN}>`
  )) as {
    name: string
    symbol: string
    decimals: number
  }
  console.log(`CoinInfo: ${coinInfo.name} (${coinInfo.symbol}), decimals=${coinInfo.decimals}`)

  // =========================================================================
  // Pattern 6: Table entry queries — key-value lookups
  // =========================================================================
  console.log('\n--- 6. Table entry queries ---')

  // Table entries use BCS-encoded keys for lookups
  // Example: looking up a value in a Move table by address key
  try {
    const entry = await coin.tableEntry(
      '0xd8d69aed85d6f2a0aad9dfa81ea6c10aa20b6d44795b21f69dfc2b9a52dfa5db',
      SENDER.bech32,
      'address'
    )
    console.log('Table entry:', entry)
  } catch (e) {
    console.log('Table entry not found (expected for demo):', (e as Error).message)
  }

  // =========================================================================
  // Pattern 7: Multi-module interaction
  // =========================================================================
  console.log('\n--- 7. Multi-module interaction ---')

  // Fetch ABIs for multiple modules from the same address
  const allStdlibModules = await getModulesAbi(chain, MODULE.moveStdlib)
  console.log(`0x1 stdlib has ${allStdlibModules.length} modules`)

  // Create contract instances for different modules
  const account = await createMoveContract(chain, MODULE.moveStdlib, 'account')
  const code = await createMoveContract(chain, MODULE.moveStdlib, 'code')

  // Explore each module's capabilities
  for (const mod of [coin, account, code]) {
    const entries = getEntryFunctions(mod.abi)
    const views = getViewFunctions(mod.abi)
    console.log(`  ${mod.abi.name}: ${entries.length} entry, ${views.length} view functions`)
  }

  // Build multi-message transaction from different modules
  // (both messages go into a single signAndBroadcast call)
  const msgs = [
    coin.execute.transfer(SENDER.bech32, {
      typeArgs: [UINIT_COIN],
      args: [RECIPIENT.bech32, '500000'],
    }),
    // createExecuteMsg — direct message creation without contract instance
    createExecuteMsg(
      SENDER.bech32,
      MODULE.moveStdlib,
      'coin',
      'transfer',
      [UINIT_COIN],
      [RECIPIENT.bech32, '500000']
    ),
  ]
  console.log(`Batched ${msgs.length} messages for single tx`)

  // =========================================================================
  // Pattern 8: BCS encoding/decoding — all Move types
  // =========================================================================
  console.log('\n--- 8. BCS encoding/decoding ---')

  bcsExample()

  // =========================================================================
  // Pattern 9: Standalone queries — no contract instance needed
  // =========================================================================
  console.log('\n--- 9. Standalone queries ---')

  await standaloneQueries(chain)

  // =========================================================================
  // Pattern 10: Module publishing & script execution
  // =========================================================================
  console.log('\n--- 10. Module publishing & scripts ---')

  publishAndScriptExample()

  // =========================================================================
  // Pattern 11: Event decoding from tx results
  // =========================================================================
  console.log('\n--- 11. Event decoding ---')

  eventDecodingExample([])

  // =========================================================================
  // Pattern 12: Cache management
  // =========================================================================
  console.log('\n--- 12. Cache management ---')

  cacheManagementExample(chain, abi)
}

// =============================================================================
// Pattern 8: BCS encoding/decoding
// =============================================================================

function bcsExample() {
  // Primitive types
  const u64Bytes = encodeMoveArg('1000000', 'u64')
  const u64Value = decodeMoveResult(u64Bytes, 'u64')
  console.log(`u64: encode(1000000) → ${u64Bytes.length} bytes → decode = ${u64Value}`)

  const boolBytes = encodeMoveArg(true, 'bool')
  const boolValue = decodeMoveResult(boolBytes, 'bool')
  console.log(`bool: encode(true) → ${boolBytes.length} bytes → decode = ${boolValue}`)

  // Address type (supports both hex and bech32)
  const addrBytes = encodeMoveArg(SENDER.bech32, 'address')
  console.log(`address: encode(${SENDER.bech32.slice(0, 10)}...) → ${addrBytes.length} bytes`)

  // String type
  const strBytes = encodeMoveArg('hello', 'string')
  const strValue = decodeMoveResult(strBytes, 'string')
  console.log(`string: encode("hello") → ${strBytes.length} bytes → decode = "${strValue}"`)

  // Vector types
  const vecU8 = encodeMoveArg([1, 2, 3, 4], 'vector<u8>')
  console.log(`vector<u8>: [1,2,3,4] → ${vecU8.length} bytes`)

  const vecStr = encodeMoveArg(['hello', 'world'], 'vector<string>')
  console.log(`vector<string>: → ${vecStr.length} bytes`)

  // Initia-specific types
  const fp32 = encodeMoveArg('1.5', '0x1::fixed_point32::FixedPoint32')
  console.log(`FixedPoint32: encode("1.5") → ${fp32.length} bytes`)

  const dec128 = encodeMoveArg('3.14', '0x1::decimal128::Decimal128')
  console.log(`Decimal128: encode("3.14") → ${dec128.length} bytes`)

  // Option type
  const someU64 = encodeMoveArg(42, '0x1::option::Option<u64>')
  console.log(`Option<u64>: Some(42) → ${someU64.length} bytes`)
}

// =============================================================================
// Pattern 9: Standalone queries
// =============================================================================

async function standaloneQueries(ctx: Parameters<typeof callViewFunction>[0]) {
  // callViewFunction — low-level, no struct field conversion
  // For struct conversion, prefer ctx.contract() or createMoveContract + contract.view.*
  const balance = await callViewFunction(
    ctx,
    MODULE.moveStdlib,
    'coin',
    'balance',
    [UINIT_COIN],
    [SENDER.bech32]
  )
  console.log(`callViewFunction balance: ${balance}`)

  // queryResource — direct resource read
  const resource = await queryResource(ctx, SENDER.bech32, COIN_STORE)
  console.log('queryResource CoinStore:', JSON.stringify(resource).slice(0, 80) + '...')

  // queryTableEntry — direct table lookup (BCS key encoding handled internally)
  try {
    const entry = await queryTableEntry(
      ctx,
      '0xd8d69aed85d6f2a0aad9dfa81ea6c10aa20b6d44795b21f69dfc2b9a52dfa5db',
      SENDER.bech32,
      'address'
    )
    console.log('queryTableEntry:', entry)
  } catch (e) {
    console.log('queryTableEntry not found (demo):', (e as Error).message)
  }

  // getModuleAbi — fetch ABI without creating contract instance
  const abi = await getModuleAbi(ctx, MODULE.moveStdlib, 'coin')
  console.log(`getModuleAbi: ${abi.name} has ${abi.exposed_functions.length} functions`)
}

// =============================================================================
// Pattern 10: Publishing & scripts
// =============================================================================

function publishAndScriptExample() {
  // Publish one or more compiled Move modules
  const publishMsg = createPublishMsg({
    sender: SENDER.bech32,
    codeBytes: [
      new Uint8Array([
        /* compiled module bytecode */
      ]),
    ],
    upgradePolicy: UpgradePolicy.COMPATIBLE,
  })
  console.log(`publish msg: upgradePolicy=${publishMsg.upgradePolicy}`)

  // Execute a compiled Move script (JSON args)
  const scriptMsg = createScriptMsg({
    sender: SENDER.bech32,
    codeBytes: new Uint8Array([
      /* compiled script bytecode */
    ]),
    typeArgs: [UINIT_COIN],
    args: [RECIPIENT.bech32, '1000000'],
  })
  console.log(`script msg: typeArgs=${scriptMsg.typeArgs}`)

  // Execute script with BCS-encoded args (for pre-encoded arguments)
  const bcsArgs = [encodeMoveArg(RECIPIENT.bech32, 'address'), encodeMoveArg('1000000', 'u64')]
  const bcsScriptMsg = createBcsScriptMsg({
    sender: SENDER.bech32,
    codeBytes: new Uint8Array([
      /* compiled script bytecode */
    ]),
    typeArgs: [UINIT_COIN],
    args: bcsArgs,
  })
  console.log(`bcs script msg: ${bcsScriptMsg.args.length} BCS-encoded args`)
}

// =============================================================================
// Pattern 11: Event decoding
// =============================================================================

function eventDecodingExample(events: CosmosEvent[]) {
  // Parse all Move events from tx result
  const moveEvents = parseMoveEvents(events)
  for (const evt of moveEvents) {
    console.log(`Event: ${evt.eventType}`)
    console.log(`  Module: ${evt.moduleAddress}::${evt.moduleName}`)
    console.log(`  Data:`, evt.data)
  }

  // Filter by module (e.g., all events from 0x1::coin)
  const coinEvents = findMoveEventsByModule(events, '0x1', 'coin')
  console.log(`coin module events: ${coinEvents.length}`)

  // Filter by event type (e.g., DepositEvent)
  const depositEvents = findMoveEventsByType(events, '0x1::coin::DepositEvent')
  console.log(`DepositEvent count: ${depositEvents.length}`)
}

// =============================================================================
// Pattern 12: Cache management
// =============================================================================

function cacheManagementExample(ctx: Parameters<typeof getModuleAbi>[0], _abi: MoveModuleAbi) {
  // ABIs are cached based on upgrade policy:
  // - IMMUTABLE modules → cached permanently
  // - COMPATIBLE modules → cached with TTL (default 5 minutes)

  // Clear cache for a specific module address (after known upgrade)
  clearAbiCache(MODULE.moveStdlib)
  console.log('Cleared ABI cache for 0x1')

  // Clear all caches
  clearAbiCache()
  console.log('Cleared all ABI caches')

  // Bypass cache entirely for a single fetch
  // const freshAbi = await getModuleAbi(ctx, MODULE.moveStdlib, 'coin', { useCache: false })

  // Or provide a pre-fetched ABI to skip the gRPC call
  // const contract = await createMoveContract(ctx, MODULE.moveStdlib, 'coin', { abi: freshAbi })

  void ctx // used in commented examples above
}

main().catch(console.error)
