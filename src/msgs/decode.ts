import type { DescMessage } from '@bufbuild/protobuf'
import type { Any } from '@bufbuild/protobuf/wkt'
import { ParseError } from '../errors'
import { Message } from './types'

/**
 * Create a decode function that resolves Any messages by typeUrl.
 *
 * Looks up the schema from the registered set and returns a fully decoded Message.
 * Throws ParseError if the typeUrl is not registered.
 *
 * The returned Message is unparameterized — use `isMessageOf(decoded, SomeSchema)`
 * to narrow the type and access typed `.value` properties.
 *
 * When duplicate typeUrls exist in schemas, the last entry wins (override semantics).
 * This is intentional for ChainConfigBuilder where network-specific overrides
 * may replace base module schemas.
 */
export function createDecode(schemas: DescMessage[]): (packed: Any) => Message {
  const map = new Map<string, DescMessage>()
  for (const s of schemas) map.set('/' + s.typeName, s)
  return (packed: Any) => {
    const schema = map.get(packed.typeUrl)
    if (!schema) {
      throw new ParseError(
        'message',
        `Unknown message type: ${packed.typeUrl}. Not registered in decode schema map. ` +
          'If using custom modules, ensure all schemas are included in the module definition.'
      )
    }
    return Message.fromAny(schema, packed)
  }
}
