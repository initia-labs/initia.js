/**
 * Cosmos Registry entry point for initia.js
 *
 * Provides access to Cosmos ecosystem chains (Osmosis, Noble, Cosmos Hub, etc.)
 * via the chain-registry package.
 *
 * This is a separate entry point to avoid bundling ~1MB of chain data
 * for users who only need Initia chains.
 *
 * @example
 * ```typescript
 * import { CosmosRegistryProvider } from 'initia.js/cosmos'
 *
 * const provider = new CosmosRegistryProvider()
 * const osmosis = provider.getChainInfo('osmosis-1')
 * ```
 */

export {
  CosmosRegistryProvider,
  type CosmosRegistryProviderOptions,
} from './provider/cosmos-registry-provider'
