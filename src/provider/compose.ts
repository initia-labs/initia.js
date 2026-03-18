import { CompositeProvider } from './composite-provider'
import type { ChainDataProvider } from './types'
import { ValidationError } from '../errors'

/**
 * Compose multiple providers into a single CompositeProvider.
 * First provider wins for duplicate chain IDs.
 */
export function composeProviders(...providers: ChainDataProvider[]): CompositeProvider {
  if (providers.length === 0) {
    throw new ValidationError('providers', 'composeProviders requires at least one provider')
  }
  return new CompositeProvider(providers)
}
