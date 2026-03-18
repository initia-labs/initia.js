/**
 * Shared constants for example code.
 *
 * Required env vars:
 *   TEST_MNEMONIC   — BIP-39 mnemonic (DO NOT use with real funds)
 *
 * Well-known contract addresses are hardcoded from testnet chains.
 */

import { MnemonicKey } from 'initia.js'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` + 'Set it before running examples.'
    )
  }
  return value
}

export const TEST_MNEMONIC = requireEnv('TEST_MNEMONIC')

// Derive sender (index 0) and recipient (index 1) from mnemonic
const senderKey = new MnemonicKey({ mnemonic: TEST_MNEMONIC, index: 0 })
const recipientKey = new MnemonicKey({ mnemonic: TEST_MNEMONIC, index: 1 })

export const SENDER = {
  bech32: senderKey.address,
  evm: senderKey.evmAddress,
  valoper: senderKey.valAddress,
}

export const RECIPIENT = {
  bech32: recipientKey.address,
  evm: recipientKey.evmAddress,
  valoper: recipientKey.valAddress,
}

// ---------------------------------------------------------------------------
// Well-known testnet contract addresses
// ---------------------------------------------------------------------------

/** EVM contracts on evm-1 testnet */
export const CONTRACT = {
  /** USDE ERC20 token (name=USDE, symbol=USDE, decimals=18) */
  evm: '0x5A1C9CDC91C002025AeEEBf315B407bf2E1E873C',
  /** Wrapped L2 native token */
  evmWrappedL2: '0x2eE7007DF876084d4C74685e90bB7f4cd7c86e22',
}

/** CosmWasm contracts on wasm-1 testnet */
export const WASM_CONTRACT = {
  /** Magico SBT — CW721 (name=Slime Soul Bound SBT, symbol=SOUL, code_id=12) */
  cw721Sbt: 'init1657pee2jhf4jk8pq6yq64e758ngvum45gl866knmjkd83w6jgn3sjhxcwy',
  /** Goops! — CW721 NFT (name=Goops!, symbol=GOOP, code_id=19) */
  cw721Nft: 'init18glh4zetf3nkdu724dxqvlw2gw6fdwnhrycazt32dgysq5gvyj4s97wucu',
  /** Slime Core Contract (code_id=20) */
  slimeCore: 'init1hv02xe2vzm0m94pygppm3mc5epl5uppaaxhk8e6gldz4np5ynd0qys063c',
  /** Creator of Slime ecosystem contracts */
  slimeCreator: 'init1cf9qny8sfh8aewnshsh9pqatmh352f5849vc2w',
} as const

// Protocol constants — not configurable
export const MODULE = {
  moveStdlib: '0x1',
  bech32: 'init1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpqr5e3d',
} as const
