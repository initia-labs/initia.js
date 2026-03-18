/**
 * Static CW20 contract schema for typed contract interactions.
 *
 * Extracted from the cw20-base contract JSON schema.
 * Only commonly-used variants are included for brevity.
 *
 * Two styles are supported:
 *   // Style A: wasmAbi() helper (no nested `as const` needed)
 *   import { wasmAbi } from 'initia.js/wasm'
 *   export const CW20_SCHEMA = wasmAbi({...})
 *
 *   // Style B: as const satisfies (requires `as const` on each required array)
 *   import type { ReadonlyWasmContractSchema } from 'initia.js/wasm'
 *   export const CW20_SCHEMA = {...} as const satisfies ReadonlyWasmContractSchema
 *
 * Usage:
 *   const cw20 = createWasmContract(ctx, addr, CW20_SCHEMA)
 *   cw20.execute.transfer(sender, { recipient: '...', amount: '1000' })
 *   cw20.query.balance({ address: '...' })
 */

import { wasmAbi } from 'initia.js/wasm'

export const CW20_SCHEMA = wasmAbi({
  execute: {
    oneOf: [
      { required: ['transfer'], properties: { transfer: {} } },
      { required: ['burn'], properties: { burn: {} } },
      { required: ['send'], properties: { send: {} } },
      { required: ['increase_allowance'], properties: { increase_allowance: {} } },
      { required: ['decrease_allowance'], properties: { decrease_allowance: {} } },
      { required: ['transfer_from'], properties: { transfer_from: {} } },
      { required: ['mint'], properties: { mint: {} } },
    ],
  },
  query: {
    oneOf: [
      { required: ['balance'], properties: { balance: {} } },
      { required: ['token_info'], properties: { token_info: {} } },
      { required: ['minter'], properties: { minter: {} } },
      { required: ['allowance'], properties: { allowance: {} } },
      { required: ['all_allowances'], properties: { all_allowances: {} } },
      { required: ['all_accounts'], properties: { all_accounts: {} } },
    ],
  },
})
