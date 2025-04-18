import { describe, it, expect } from 'vitest'
import { MsgRevokeAuthorization } from './MsgRevokeAuthorization'
const examples = require('./MsgRevokeAuthorization.data.json')

describe('MsgRevokeAuthorization', () => {
  it('deserializes', () => {
    examples.forEach((data: MsgRevokeAuthorization.Amino) => {
      expect(MsgRevokeAuthorization.fromAmino(data).toAmino()).toEqual(data)
    })
  })
})
