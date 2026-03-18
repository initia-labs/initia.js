/**
 * Example: CosmWasm Contract — Schema-Driven Interactions
 *
 * Demonstrates how JSON schemas provide structural validation and
 * variant discovery for CosmWasm contract interactions.
 *
 * Covered patterns:
 *  1. Schema definition   — define execute/query/instantiate schemas
 *  2. Schema introspection — getSchemaInfo, getSchemaVariants, getVariantSchema
 *  3. Schema validation   — validateExecuteMsg / validateQueryMsg before sending
 *  4. Type inference      — derive field types from schema for documentation
 *  5. Execute proxy       — schema-validated message creation
 *  6. Query proxy         — schema-validated queries
 *  7. CW20 token helpers  — getTokenInfo / parseUnits / formatUnits
 *  8. CW721 NFT helpers   — getNftInfo / getOwnerOf / getTokens
 *  9. Raw execute/query   — bypass schema for custom messages
 * 10. Multi-contract      — interact with >1 contract in a single flow
 * 11. Lifecycle messages  — store, instantiate, migrate, admin management
 * 12. Management queries  — contract info, code info, history, raw state
 * 13. Event parsing       — parse Wasm events from tx results
 */

import { createMiniwasmContext } from 'initia.js'
import {
  createWasmContract,
  // Lifecycle message builders
  createStoreCodeMsg,
  createInstantiateMsg,
  createInstantiate2Msg,
  createMigrateMsg,
  createUpdateAdminMsg,
  createClearAdminMsg,
  // Standalone query/execute
  createWasmExecuteMsg,
  queryContract,
  getContractInfo,
  getRawContractState,
  getCodeInfo,
  getContractsByCode,
  getContractHistory,
  // Schema utilities
  validateExecuteMsg,
  validateQueryMsg,
  getSchemaInfo,
  getSchemaVariants,
  getVariantSchema,
  getResponseSchema,
  type WasmContractSchema,
  type JsonSchema,
} from 'initia.js/wasm'
import {
  parseWasmEvents,
  findWasmEventsByContract,
  findWasmEventsByAction,
  type CosmosEvent,
} from 'initia.js/events'
import { SENDER, RECIPIENT, WASM_CONTRACT } from './constants'

// =============================================================================
// 1) Schema definitions — the "ABI" for CosmWasm contracts
//
//    Schemas are optional but recommended: they enable variant validation,
//    introspection, and better error messages.
// =============================================================================

const CW20_SCHEMA: WasmContractSchema = {
  contract_name: 'cw20-base',
  contract_version: '0.16.0',
  instantiate: {
    type: 'object',
    required: ['name', 'symbol', 'decimals', 'initial_balances'],
    properties: {
      name: { type: 'string' },
      symbol: { type: 'string' },
      decimals: { type: 'integer' },
      initial_balances: {
        type: 'array',
        items: {
          type: 'object',
          required: ['address', 'amount'],
          properties: {
            address: { type: 'string' },
            amount: { type: 'string' },
          },
        },
      },
      mint: {
        type: 'object',
        properties: {
          minter: { type: 'string' },
          cap: { type: 'string' },
        },
      },
    },
  },
  execute: {
    oneOf: [
      {
        required: ['transfer'],
        properties: {
          transfer: {
            type: 'object',
            required: ['recipient', 'amount'],
            properties: {
              recipient: { type: 'string' },
              amount: { type: 'string' },
            },
          },
        },
      },
      {
        required: ['burn'],
        properties: {
          burn: {
            type: 'object',
            required: ['amount'],
            properties: {
              amount: { type: 'string' },
            },
          },
        },
      },
      {
        required: ['send'],
        properties: {
          send: {
            type: 'object',
            required: ['contract', 'amount', 'msg'],
            properties: {
              contract: { type: 'string' },
              amount: { type: 'string' },
              msg: { type: 'string' },
            },
          },
        },
      },
      {
        required: ['increase_allowance'],
        properties: {
          increase_allowance: {
            type: 'object',
            required: ['spender', 'amount'],
            properties: {
              spender: { type: 'string' },
              amount: { type: 'string' },
              expires: { type: 'object' },
            },
          },
        },
      },
      {
        required: ['decrease_allowance'],
        properties: {
          decrease_allowance: {
            type: 'object',
            required: ['spender', 'amount'],
            properties: {
              spender: { type: 'string' },
              amount: { type: 'string' },
              expires: { type: 'object' },
            },
          },
        },
      },
      {
        required: ['transfer_from'],
        properties: {
          transfer_from: {
            type: 'object',
            required: ['owner', 'recipient', 'amount'],
            properties: {
              owner: { type: 'string' },
              recipient: { type: 'string' },
              amount: { type: 'string' },
            },
          },
        },
      },
      {
        required: ['mint'],
        properties: {
          mint: {
            type: 'object',
            required: ['recipient', 'amount'],
            properties: {
              recipient: { type: 'string' },
              amount: { type: 'string' },
            },
          },
        },
      },
    ],
  },
  query: {
    oneOf: [
      {
        required: ['balance'],
        properties: {
          balance: {
            type: 'object',
            required: ['address'],
            properties: { address: { type: 'string' } },
          },
        },
      },
      {
        required: ['token_info'],
        properties: {
          token_info: { type: 'object' },
        },
      },
      {
        required: ['minter'],
        properties: {
          minter: { type: 'object' },
        },
      },
      {
        required: ['allowance'],
        properties: {
          allowance: {
            type: 'object',
            required: ['owner', 'spender'],
            properties: {
              owner: { type: 'string' },
              spender: { type: 'string' },
            },
          },
        },
      },
      {
        required: ['all_allowances'],
        properties: {
          all_allowances: {
            type: 'object',
            required: ['owner'],
            properties: {
              owner: { type: 'string' },
              start_after: { type: 'string' },
              limit: { type: 'integer' },
            },
          },
        },
      },
      {
        required: ['all_accounts'],
        properties: {
          all_accounts: {
            type: 'object',
            properties: {
              start_after: { type: 'string' },
              limit: { type: 'integer' },
            },
          },
        },
      },
    ],
  },
  responses: {
    balance: {
      type: 'object',
      required: ['balance'],
      properties: { balance: { type: 'string' } },
    },
    token_info: {
      type: 'object',
      required: ['name', 'symbol', 'decimals', 'total_supply'],
      properties: {
        name: { type: 'string' },
        symbol: { type: 'string' },
        decimals: { type: 'integer' },
        total_supply: { type: 'string' },
      },
    },
    minter: {
      type: 'object',
      properties: {
        minter: { type: 'string' },
        cap: { type: 'string' },
      },
    },
  },
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const chain = await createMiniwasmContext({ network: 'testnet', chainId: 'wasm-1' })

  // =========================================================================
  // Pattern 2: Schema introspection — discover contract capabilities
  // =========================================================================
  console.log('\n--- 2. Schema introspection ---')

  const info = getSchemaInfo(CW20_SCHEMA)
  console.log(`Contract: ${info.name} v${info.version}`)
  console.log(`Execute variants: ${info.executeVariants.join(', ')}`)
  console.log(`Query variants: ${info.queryVariants.join(', ')}`)
  console.log(`Has instantiate schema: ${info.hasInstantiate}`)
  console.log(`Has migrate schema: ${info.hasMigrate}`)

  // Get execute variant names from schema
  const execVariants = getSchemaVariants(CW20_SCHEMA.execute)
  console.log(`\nAll execute variants: ${execVariants.join(', ')}`)

  // Get query variant names
  const queryVariants = getSchemaVariants(CW20_SCHEMA.query)
  console.log(`All query variants: ${queryVariants.join(', ')}`)

  // Inspect a specific variant's schema
  const transferSchema = getVariantSchema(CW20_SCHEMA.execute, 'transfer')
  if (transferSchema) {
    console.log(`\ntransfer schema:`, JSON.stringify(transferSchema, null, 2))
  }

  // Get response schema for a query variant
  const balanceResponseSchema = getResponseSchema(CW20_SCHEMA, 'balance')
  if (balanceResponseSchema) {
    console.log(`balance response schema:`, JSON.stringify(balanceResponseSchema))
  }

  // =========================================================================
  // Pattern 3: Schema validation — check messages before sending
  // =========================================================================
  console.log('\n--- 3. Schema validation ---')

  // Valid execute message
  const validExec = validateExecuteMsg(
    { transfer: { recipient: RECIPIENT.bech32, amount: '1000' } },
    CW20_SCHEMA
  )
  console.log(`Valid transfer: ${validExec.valid}`)

  // Invalid execute variant
  const invalidExec = validateExecuteMsg({ unknown_action: {} }, CW20_SCHEMA)
  console.log(`Invalid variant: valid=${invalidExec.valid}, error="${invalidExec.error}"`)

  // Valid query message
  const validQuery = validateQueryMsg({ balance: { address: SENDER.bech32 } }, CW20_SCHEMA)
  console.log(`Valid query: ${validQuery.valid}`)

  // Multi-key message (structural error)
  const multiKey = validateExecuteMsg({ transfer: {}, burn: {} }, CW20_SCHEMA)
  console.log(`Multi-key: valid=${multiKey.valid}, error="${multiKey.error}"`)

  // =========================================================================
  // Pattern 4: Type inference — generate TS types from schema
  // =========================================================================
  console.log('\n--- 4. Type inference from schema ---')

  typeInferenceExample(CW20_SCHEMA)

  // =========================================================================
  // Pattern 5: Execute proxy — schema-validated message creation
  // =========================================================================
  console.log('\n--- 5. Execute proxy ---')

  const cw20 = createWasmContract(chain, WASM_CONTRACT.slimeCore, {
    schema: CW20_SCHEMA,
  })

  // The execute proxy validates variant names against schema
  const transferMsg = cw20.execute.transfer(SENDER.bech32, {
    recipient: RECIPIENT.bech32,
    amount: '1000000',
  })
  console.log(`transfer msg: sender=${transferMsg.value.sender}`)

  // Allowance flow
  const approveMsg = cw20.execute.increase_allowance(SENDER.bech32, {
    spender: RECIPIENT.bech32,
    amount: '5000000',
  })
  console.log(`increase_allowance msg: sender=${approveMsg.value.sender}`)

  const transferFromMsg = cw20.execute.transfer_from(SENDER.bech32, {
    owner: SENDER.bech32,
    recipient: RECIPIENT.bech32,
    amount: '1000000',
  })
  console.log(`transfer_from msg: sender=${transferFromMsg.value.sender}`)

  // Execute with funds attached
  // const sendMsg = cw20.execute.send(SENDER.bech32, {
  //   contract: WASM_CONTRACT.slimeCore,
  //   amount: '1000',
  //   msg: btoa('{}'),
  // }, [{ denom: 'uinit', amount: '1000' }])

  // To broadcast: await chain.signAndBroadcast([transferMsg])

  // =========================================================================
  // Pattern 6: Query proxy — schema-validated queries
  // =========================================================================
  console.log('\n--- 6. Query proxy ---')

  const balanceResp = (await cw20.query.balance({
    address: SENDER.bech32,
  })) as { balance: string }
  console.log(`Balance: ${balanceResp.balance}`)

  const tokenInfoResp = (await cw20.query.token_info({})) as {
    name: string
    symbol: string
    decimals: number
    total_supply: string
  }
  console.log(`Token: ${tokenInfoResp.name} (${tokenInfoResp.symbol})`)
  console.log(`Decimals: ${tokenInfoResp.decimals}, Supply: ${tokenInfoResp.total_supply}`)

  // =========================================================================
  // Pattern 7: CW20 token helpers
  // =========================================================================
  console.log('\n--- 7. CW20 token helpers ---')

  // getTokenInfo — convenience wrapper for token_info query
  const tokenInfo = await cw20.getTokenInfo()
  console.log(`${tokenInfo.name} (${tokenInfo.symbol}), decimals=${tokenInfo.decimals}`)
  if (tokenInfo.totalSupply !== undefined) {
    console.log(`Total supply: ${tokenInfo.totalSupply}`)
  }

  // parseUnits / formatUnits — use cached decimals from getTokenInfo
  const smallest = await cw20.parseUnits('100.5')
  const display = await cw20.formatUnits(smallest)
  console.log(`parseUnits("100.5") = ${smallest}`)
  console.log(`formatUnits back = "${display}"`)

  // =========================================================================
  // Pattern 8: CW721 NFT helpers
  // =========================================================================
  console.log('\n--- 8. CW721 NFT helpers ---')

  await nftHelpersExample(chain)

  // =========================================================================
  // Pattern 9: Raw execute/query — bypass schema for custom messages
  // =========================================================================
  console.log('\n--- 9. Raw execute/query ---')

  // executeRaw — send any message structure (no schema validation)
  const rawMsg = cw20.executeRaw(SENDER.bech32, {
    increase_allowance: {
      spender: RECIPIENT.bech32,
      amount: '10000000',
    },
  })
  console.log(`Raw execute msg: sender=${rawMsg.sender}`)

  // queryRaw — query without schema validation
  const rawBalance = (await cw20.queryRaw({
    balance: { address: SENDER.bech32 },
  })) as { balance: string }
  console.log(`Raw query balance: ${rawBalance.balance}`)

  // getRawState — read contract's internal state by storage key
  const rawState = await cw20.getRawState('config')
  console.log(`Raw state (config): ${rawState.length} bytes`)

  // getContractInfo — contract metadata
  const contractInfo = await cw20.getContractInfo()
  console.log(`Contract: codeId=${contractInfo.codeId}, admin="${contractInfo.admin}"`)

  // =========================================================================
  // Pattern 10: Multi-contract — interact with >1 contract
  // =========================================================================
  console.log('\n--- 10. Multi-contract ---')

  await multiContractExample(chain)

  // =========================================================================
  // Pattern 11: Lifecycle messages
  // =========================================================================
  console.log('\n--- 11. Lifecycle messages ---')

  lifecycleExample()

  // =========================================================================
  // Pattern 12: Management queries — standalone functions
  // =========================================================================
  console.log('\n--- 12. Management queries ---')

  await managementQueriesExample(chain)

  // =========================================================================
  // Pattern 13: Event parsing
  // =========================================================================
  console.log('\n--- 13. Event parsing ---')

  eventParsingExample([])
}

// =============================================================================
// Pattern 4: Type inference
// =============================================================================

function typeInferenceExample(schema: WasmContractSchema) {
  // Infer response types from schema (useful for documentation generation)
  if (schema.responses) {
    for (const [variant, respSchema] of Object.entries(schema.responses)) {
      const props = (respSchema as JsonSchema).properties
      if (props) {
        const fields = Object.entries(props)
          .map(([k, v]) => `${k}: ${(v as JsonSchema).type ?? 'unknown'}`)
          .join(', ')
        console.log(`  ${variant} response → { ${fields} }`)
      }
    }
  }

  // Inspect instantiate schema properties
  if (schema.instantiate?.properties) {
    const required = schema.instantiate.required ?? []
    const props = Object.keys(schema.instantiate.properties)
    console.log(`  instantiate: ${props.join(', ')} (required: ${required.join(', ')})`)
  }
}

// =============================================================================
// Pattern 8: CW721 NFT helpers
// =============================================================================

async function nftHelpersExample(ctx: Parameters<typeof createWasmContract>[0]) {
  // Create CW721 contract instance (no schema needed for built-in helpers)
  const nft = createWasmContract(ctx, WASM_CONTRACT.cw721Sbt)

  // getNftInfo — token metadata (token_uri + extension)
  try {
    const nftInfo = await nft.getNftInfo('0')
    console.log(`NFT #0 tokenUri: ${nftInfo.tokenUri}`)
    if (nftInfo.extension) {
      console.log(`NFT #0 extension:`, nftInfo.extension)
    }
  } catch (e) {
    console.log(`NFT #0 not found: ${(e as Error).message}`)
  }

  // getOwnerOf — owner and approvals
  try {
    const owner = await nft.getOwnerOf('0')
    console.log(`NFT #0 owner: ${owner.owner}`)
    console.log(`NFT #0 approvals: ${owner.approvals.length}`)
  } catch (e) {
    console.log(`Owner query failed: ${(e as Error).message}`)
  }

  // getTokens — list tokens owned by address
  const tokens = await nft.getTokens(WASM_CONTRACT.slimeCreator)
  console.log(`Tokens owned by creator: ${tokens.length}`)
  if (tokens.length > 0) {
    console.log(`First tokens: ${tokens.slice(0, 5).join(', ')}`)
  }
}

// =============================================================================
// Pattern 10: Multi-contract
// =============================================================================

async function multiContractExample(ctx: Parameters<typeof createWasmContract>[0]) {
  // Create multiple contract instances
  const slimeCore = createWasmContract(ctx, WASM_CONTRACT.slimeCore, { schema: CW20_SCHEMA })
  const cw721 = createWasmContract(ctx, WASM_CONTRACT.cw721Nft)

  // Query both contracts in parallel
  const [tokenInfo, nftTokens] = await Promise.all([
    slimeCore.getTokenInfo(),
    cw721.getTokens(WASM_CONTRACT.slimeCreator),
  ])
  console.log(`CW20: ${tokenInfo.symbol} (${tokenInfo.decimals} decimals)`)
  console.log(`CW721: ${nftTokens.length} tokens owned by creator`)

  // Build multi-message transaction
  const msgs = [
    slimeCore.execute.transfer(SENDER.bech32, {
      recipient: RECIPIENT.bech32,
      amount: '1000',
    }),
    // Standalone message creation (no contract instance)
    createWasmExecuteMsg(SENDER.bech32, WASM_CONTRACT.cw721Nft, {
      transfer_nft: { recipient: RECIPIENT.bech32, token_id: '1' },
    }),
  ]
  console.log(`Batched ${msgs.length} messages for single tx`)

  // Standalone query (no contract instance)
  const result = await queryContract(ctx, WASM_CONTRACT.slimeCore, { token_info: {} })
  console.log(`Standalone query result:`, result)
}

// =============================================================================
// Pattern 11: Lifecycle messages
// =============================================================================

function lifecycleExample() {
  // Store wasm bytecode
  const storeMsg = createStoreCodeMsg({
    sender: SENDER.bech32,
    wasmByteCode: new Uint8Array([
      /* compiled wasm bytecode */
    ]),
  })
  console.log(`store msg: sender=${storeMsg.sender}`)

  // Instantiate contract from stored code
  const initMsg = createInstantiateMsg({
    sender: SENDER.bech32,
    codeId: 1,
    msg: {
      name: 'MyToken',
      symbol: 'MTK',
      decimals: 6,
      initial_balances: [{ address: SENDER.bech32, amount: '1000000000' }],
    },
    label: 'my-token-v1',
    admin: SENDER.bech32,
  })
  console.log(`instantiate msg: codeId=${initMsg.codeId}, label="${initMsg.label}"`)

  // Instantiate2 — predictable address using salt
  const init2Msg = createInstantiate2Msg({
    sender: SENDER.bech32,
    codeId: 1,
    msg: { name: 'MyToken', symbol: 'MTK', decimals: 6, initial_balances: [] },
    label: 'my-token-v1',
    salt: new TextEncoder().encode('unique-salt-123'),
  })
  console.log(`instantiate2 msg: salt=${init2Msg.salt.length} bytes`)

  // Migrate contract to new code
  const migrateMsg = createMigrateMsg({
    sender: SENDER.bech32,
    contract: WASM_CONTRACT.slimeCore,
    codeId: 2,
    msg: {},
  })
  console.log(`migrate msg: newCodeId=${migrateMsg.codeId}`)

  // Update admin
  const updateAdminMsg = createUpdateAdminMsg({
    sender: SENDER.bech32,
    contract: WASM_CONTRACT.slimeCore,
    newAdmin: RECIPIENT.bech32,
  })
  console.log(`update admin msg: newAdmin=${updateAdminMsg.newAdmin}`)

  // Clear admin (make contract immutable)
  const clearAdminMsg = createClearAdminMsg({
    sender: SENDER.bech32,
    contract: WASM_CONTRACT.slimeCore,
  })
  console.log(`clear admin msg: contract=${clearAdminMsg.contract}`)
}

// =============================================================================
// Pattern 12: Management queries
// =============================================================================

async function managementQueriesExample(ctx: Parameters<typeof getContractInfo>[0]) {
  const addr = WASM_CONTRACT.slimeCore

  // Contract info
  const contractInfo = await getContractInfo(ctx, addr)
  console.log(`Contract: codeId=${contractInfo.codeId}, creator=${contractInfo.creator}`)

  // Contract history (migration records)
  const history = await getContractHistory(ctx, addr)
  console.log(`History: ${history.length} entries`)
  for (const entry of history) {
    console.log(`  codeId=${entry.codeId}, operation=${entry.operation}`)
  }

  // Code info
  const codeInfo = await getCodeInfo(ctx, contractInfo.codeId)
  console.log(`Code ${contractInfo.codeId}: creator=${codeInfo.codeInfo?.creator}`)

  // All contracts using same code
  const contracts = await getContractsByCode(ctx, contractInfo.codeId)
  console.log(`Contracts using code ${contractInfo.codeId}: ${contracts.length}`)

  // Raw contract state by key
  const rawState = await getRawContractState(ctx, addr, 'config')
  if (rawState.length > 0) {
    const decoded = new TextDecoder().decode(rawState)
    console.log(`Raw state (config): ${decoded.slice(0, 100)}...`)
  }
}

// =============================================================================
// Pattern 13: Event parsing
// =============================================================================

function eventParsingExample(events: CosmosEvent[]) {
  // Parse all wasm events from tx result
  const wasmEvents = parseWasmEvents(events)
  for (const evt of wasmEvents) {
    console.log(`Wasm event: contract=${evt.contractAddress}, action=${evt.action}`)
    console.log(`  Data:`, evt.data)
  }

  // Filter by contract address
  const contractEvents = findWasmEventsByContract(events, WASM_CONTRACT.slimeCore)
  console.log(`Events from slimeCore: ${contractEvents.length}`)

  // Filter by action (e.g., 'transfer', 'mint', 'burn')
  const transferEvents = findWasmEventsByAction(events, 'transfer')
  console.log(`Transfer events: ${transferEvents.length}`)
}

main().catch(console.error)
