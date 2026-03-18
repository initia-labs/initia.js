/**
 * Move VM message enricher for getTx.
 *
 * Handles BCS-encoded args (MsgExecute, MsgGovExecute) via ABI fetch + BCS decode,
 * and JSON-encoded args (MsgExecuteJSON, MsgGovExecuteJSON) via JSON.parse.
 */

import type { MessageEnricher, DecodedTxMessage, GetTxOptions, AbiRegistry } from '../get-tx'
import type { MoveModuleAbi } from '../../contracts/move/types'
import type { MoveQueryClient } from '../../contracts/move/abi-fetcher'
import type { HasMoveService } from '../../client/types'
import { getModuleAbi, findFunction, getNonSignerParams } from '../../contracts/move/abi-fetcher'
import { decodeMoveResults, parseMoveType, type ParsedMoveType } from '../../contracts/move/bcs'

// BCS-encoded args: need ABI fetch + BCS decode
const BCS_EXECUTE_TYPES = new Set(['/initia.move.v1.MsgExecute', '/initia.move.v1.MsgGovExecute'])

// JSON-encoded args: just JSON.parse each arg string
const JSON_EXECUTE_TYPES = new Set([
  '/initia.move.v1.MsgExecuteJSON',
  '/initia.move.v1.MsgGovExecuteJSON',
])

// SKIP_TYPES — not referenced at runtime (Decision #83). Kept for grep discoverability.
// These types are excluded from ENRICHABLE_MOVE_TYPES (Decision #77):
// - /initia.move.v1.MsgScript
// - /initia.move.v1.MsgScriptJSON
// - /initia.move.v1.MsgGovScript
// - /initia.move.v1.MsgGovScriptJSON
// - /initia.move.v1.MsgPublish
// - /initia.move.v1.MsgGovPublish

// Only types that actually produce enriched data — SKIP_TYPES excluded (Decision #77)
const ENRICHABLE_MOVE_TYPES = new Set([...BCS_EXECUTE_TYPES, ...JSON_EXECUTE_TYPES])

/** Shape of Move execute message value fields. */
interface MoveExecuteValue {
  moduleAddress: string
  moduleName: string
  functionName: string
  args?: Uint8Array[] | string[]
}

// Types where @mysten/bcs returns string but bigint is more appropriate
const BIGINT_TYPES = new Set(['u64', 'u128', 'u256'])

/**
 * Post-process a BCS-decoded value using ABI type info.
 * Converts u64/u128/u256 string → bigint, recursively through containers.
 */
function castValue(value: unknown, parsed: ParsedMoveType): unknown {
  if (value === null || value === undefined) return value

  if (BIGINT_TYPES.has(parsed.base)) {
    try {
      return BigInt(value as string)
    } catch (cause) {
      throw new Error(
        `Failed to convert ${parsed.base} value to bigint: ${JSON.stringify(value)}`,
        { cause }
      )
    }
  }

  if (parsed.base === 'vector' && Array.isArray(value) && parsed.typeArgs.length === 1) {
    // vector<u8> is Uint8Array — skip (no element-level coercion needed)
    if (parsed.typeArgs[0].base === 'u8') return value
    return value.map(el => castValue(el, parsed.typeArgs[0]))
  }

  if (parsed.base === '0x1::option::Option' && parsed.typeArgs.length === 1) {
    // None is null, Some is the inner value
    return value === null ? null : castValue(value, parsed.typeArgs[0])
  }

  return value
}

/** Coerce an array of BCS-decoded values using ABI param type strings. */
function castArgs(values: unknown[], paramTypes: string[]): unknown[] {
  return values.map((v, i) => castValue(v, parseMoveType(paramTypes[i])))
}

export function createMoveEnricher(
  moveClient: MoveQueryClient,
  abis?: AbiRegistry<MoveModuleAbi>
): MessageEnricher {
  // MoveQueryClient is structurally compatible with HasMoveService.client.move
  // (same .module() method), but the wrapper types differ (Client vs QueryClient).
  const moveContext = { client: { move: moveClient } } as unknown as HasMoveService

  return {
    canEnrich(typeUrl) {
      return ENRICHABLE_MOVE_TYPES.has(typeUrl)
    },

    async enrich(msg: DecodedTxMessage, options: GetTxOptions) {
      const val = (msg.message as unknown as Record<string, unknown>).value as MoveExecuteValue
      const { moduleAddress, moduleName, functionName, args } = val
      msg.functionName = functionName

      if (!args?.length) return

      // JSON execute: args are JSON strings, not BCS bytes (Decision #63)
      if (JSON_EXECUTE_TYPES.has(msg.typeUrl)) {
        msg.args = (args as string[]).map((a, i) => {
          try {
            return JSON.parse(a) as unknown
          } catch (cause) {
            throw new Error(
              `Failed to parse JSON arg[${i}] for ${moduleAddress}::${moduleName}::${functionName}: ${a}`,
              { cause }
            )
          }
        })
        return
      }

      // BCS execute: check offline ABI first (ctx.abis / options.abis), then on-chain fetch
      const abiKey = `${moduleAddress}::${moduleName}`
      const offlineAbi =
        (options?.abis?.[abiKey.toLowerCase()] as MoveModuleAbi | undefined) ?? abis?.get(abiKey)
      const abi = offlineAbi ?? (await getModuleAbi(moveContext, moduleAddress, moduleName))
      const fn = findFunction(abi, functionName)
      if (!fn) {
        throw new Error(
          `Function '${functionName}' not found in ABI for ${moduleAddress}::${moduleName}`
        )
      }
      const paramTypes = getNonSignerParams(fn)
      const decoded = decodeMoveResults(args as Uint8Array[], paramTypes)
      msg.args = castArgs(decoded, paramTypes)
    },
  }
}
