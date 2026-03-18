/**
 * Shared chain config resolution helpers.
 *
 * Used by entry points (entry.browser.ts, entry.node.ts) and bridge/bridge.ts
 * to resolve chain type → built config with consistent validation.
 */

import type { DescService } from '@bufbuild/protobuf'
import type { ChainConfigBuilder } from '../chain-config'
import type { ChainType } from '../client/types'
import type { ChainInfo } from '../provider/types'
import type { MsgsForChain } from '../msgs/types'
import { ValidationError } from '../errors'
import { initiaChain } from './initia'
import { minievmChain } from './minievm'
import { minimoveChain } from './minimove'
import { miniwasmChain } from './miniwasm'
import { createBaseConfig } from './common'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const chainConfigs: Record<string, ChainConfigBuilder<any>> = {
  initia: initiaChain,
  minievm: minievmChain,
  minimove: minimoveChain,
  miniwasm: miniwasmChain,
}

function resolveConfig(chainType: string) {
  if (chainType === 'other') {
    return createBaseConfig().build()
  }
  const config = chainConfigs[chainType]
  if (!config) {
    const known = Object.keys(chainConfigs).join(', ')
    throw new ValidationError(
      'chainType',
      `Unknown chain type "${chainType}". Expected one of: ${known}, other`
    )
  }
  return config.build()
}

// Cache to avoid building the same config twice when services + registry are requested separately
const configCache = new WeakMap<ChainInfo, ReturnType<typeof resolveConfig>>()

function getCached(chainInfo: ChainInfo) {
  let cached = configCache.get(chainInfo)
  if (!cached) {
    cached = resolveConfig(chainInfo.chainType)
    configCache.set(chainInfo, cached)
  }
  return cached
}

/** Resolve ChainInfo → services (Record<string, DescService>) */
export function resolveServices(chainInfo: ChainInfo): Record<string, DescService> {
  return getCached(chainInfo).services as Record<string, DescService>
}

/** Resolve ChainInfo → type registry */
export function resolveRegistry(chainInfo: ChainInfo) {
  return getCached(chainInfo).registry
}

/** Resolve ChainType → msgs (for buildChainContextFactory's getMsgs callback) */
const msgsCache = new Map<string, MsgsForChain<ChainType>>()
export function resolveMsgs(chainType: ChainType): MsgsForChain<ChainType> {
  let cached = msgsCache.get(chainType)
  if (!cached) {
    cached = resolveConfig(chainType).msgs as MsgsForChain<ChainType>
    msgsCache.set(chainType, cached)
  }
  return cached
}
