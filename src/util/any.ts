/**
 * Cosmos-compatible protobuf Any packing.
 *
 * Drop-in replacement for `anyPack` from `@bufbuild/protobuf/wkt`.
 * Uses `/{typeName}` prefix instead of `type.googleapis.com/{typeName}`.
 */

import { type DescMessage, type MessageShape, toBinary, create } from '@bufbuild/protobuf'
import { AnySchema, type Any } from '@bufbuild/protobuf/wkt'

export function anyPack<T extends DescMessage>(schema: T, message: MessageShape<T>): Any {
  return create(AnySchema, {
    typeUrl: '/' + schema.typeName,
    value: toBinary(schema, message),
  })
}
