import { sha256 } from './hash'
import { bytesToHex } from '@noble/hashes/utils.js'

/**
 * Denom type classification based on prefix.
 */
export type DenomType = 'native' | 'ibc' | 'evm' | 'move' | 'l2' | 'cw20' | 'factory'

/**
 * Detect denom type from prefix.
 */
export function getDenomType(denom: string): DenomType {
  if (denom.startsWith('ibc/')) return 'ibc'
  if (denom.startsWith('evm/')) return 'evm'
  if (denom.startsWith('move/')) return 'move'
  if (denom.startsWith('l2/')) return 'l2'
  if (denom.startsWith('cw20:')) return 'cw20'
  if (denom.startsWith('factory/')) return 'factory'
  return 'native'
}

/**
 * Extract hash from IBC denom.
 * @example getIbcDenomHash('ibc/ABC123...') → 'ABC123...'
 */
export function getIbcDenomHash(denom: string): string | undefined {
  if (!denom.startsWith('ibc/')) return undefined
  return denom.slice(4)
}

/**
 * Create IBC denom from transfer path.
 * @param path - e.g., 'transfer/channel-0/uinit'
 */
export function createIbcDenom(path: string): string {
  const hash = sha256(new TextEncoder().encode(path))
  return `ibc/${bytesToHex(hash).toUpperCase()}`
}

/**
 * Extract contract address from EVM denom.
 * @example getEvmContractAddress('evm/ABC123...') → '0xABC123...'
 */
export function getEvmContractAddress(denom: string): string | undefined {
  if (!denom.startsWith('evm/')) return undefined
  return `0x${denom.slice(4)}`
}

/**
 * Parse Move denom into address, module, and name.
 * @example getMoveAssetInfo('move/0x1::aptos_coin::AptosCoin')
 *   → { address: '0x1', module: 'aptos_coin', name: 'AptosCoin' }
 */
export function getMoveAssetInfo(denom: string):
  | {
      address: string
      module: string
      name: string
    }
  | undefined {
  if (!denom.startsWith('move/')) return undefined
  const parts = denom.slice(5).split('::')
  if (parts.length !== 3) return undefined
  return { address: parts[0], module: parts[1], name: parts[2] }
}

/**
 * Extract contract address from CW20 denom.
 * @example getCw20ContractAddress('cw20:juno1abc...') → 'juno1abc...'
 */
export function getCw20ContractAddress(denom: string): string | undefined {
  if (!denom.startsWith('cw20:')) return undefined
  return denom.slice(5)
}
