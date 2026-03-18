/**
 * Wasm message enricher for getTx.
 *
 * Parses JSON msg bytes from MsgExecuteContract, MsgInstantiateContract, etc.
 * No ABI needed — Wasm contract messages are always JSON.
 */

import type { MessageEnricher, DecodedTxMessage } from '../get-tx'

const WASM_MSG_TYPES = new Set([
  '/cosmwasm.wasm.v1.MsgExecuteContract',
  '/cosmwasm.wasm.v1.MsgInstantiateContract',
  '/cosmwasm.wasm.v1.MsgInstantiateContract2',
  '/cosmwasm.wasm.v1.MsgMigrateContract',
  '/cosmwasm.wasm.v1.MsgStoreAndInstantiateContract',
  '/cosmwasm.wasm.v1.MsgStoreAndMigrateContract',
])

/** Shape of Wasm execute/instantiate message value fields. */
interface WasmMsgValue {
  msg?: Uint8Array
}

const decoder = new TextDecoder()

export function createWasmEnricher(): MessageEnricher {
  return {
    canEnrich(typeUrl) {
      return WASM_MSG_TYPES.has(typeUrl)
    },

    // eslint-disable-next-line @typescript-eslint/require-await
    async enrich(msg: DecodedTxMessage) {
      const val = (msg.message as unknown as Record<string, unknown>).value as WasmMsgValue
      const msgBytes = val.msg
      if (!msgBytes?.length) return

      const json = decoder.decode(msgBytes)
      try {
        msg.contractMsg = JSON.parse(json) as unknown
      } catch (cause) {
        throw new Error(`Failed to parse Wasm contract msg as JSON: ${json.slice(0, 200)}`, {
          cause,
        })
      }
    },
  }
}
