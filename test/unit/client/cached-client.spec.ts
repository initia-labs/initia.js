import { describe, expect, it } from 'vitest'
import { UpgradePolicy } from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/types_pb'
import { UPGRADE_POLICY_IMMUTABLE } from '../../../src/client/cached-client'

describe('cached-client constants', () => {
  it('UPGRADE_POLICY_IMMUTABLE matches protobuf enum', () => {
    // src/client/cached-client.ts inlines this value
    // to avoid pulling move proto into shared chunks.
    // This test ensures the inlined constant stays in sync.
    expect(UPGRADE_POLICY_IMMUTABLE).toBe(UpgradePolicy.IMMUTABLE)
  })
})
