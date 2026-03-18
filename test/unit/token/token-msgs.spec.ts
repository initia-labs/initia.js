/**
 * Regression test: token module message builders return Message instances.
 * Covers #119: erc20, cw20, fungible-asset createTransferMsg/createApproveMsg.
 *
 * Note: gRPC clients are passed as null because msg-building methods
 * (createTransferMsg, createApproveMsg) never call the gRPC client —
 * they only construct Message instances from protobuf schemas.
 */

import { describe, it, expect, vi } from 'vitest'
import { Message } from '../../../src/msgs/types'
import { createErc20Token } from '../../../src/token/erc20'
import { createCw20Token } from '../../../src/token/cw20'
import { createFungibleAssetToken } from '../../../src/token/fungible-asset'

describe('token module message builders return Message instances', () => {
  describe('erc20', () => {
    const token = createErc20Token(null as any, '0x1234567890abcdef1234567890abcdef12345678')

    it('createTransferMsg() should return a Message', () => {
      const msg = token.createTransferMsg(
        'init1sender...',
        '0x0000000000000000000000000000000000000001',
        1000n
      )
      expect(msg).toBeInstanceOf(Message)
      expect(msg.toAny().typeUrl).toContain('MsgCall')
    })

    it('createApproveMsg() should return a Message', () => {
      const msg = token.createApproveMsg!(
        'init1sender...',
        '0x0000000000000000000000000000000000000002',
        500n
      )
      expect(msg).toBeInstanceOf(Message)
      expect(msg.toAny().typeUrl).toContain('MsgCall')
    })
  })

  describe('cw20', () => {
    const token = createCw20Token(null as any, 'init1contract...')

    it('createTransferMsg() should return a Message', () => {
      const msg = token.createTransferMsg('init1sender...', 'init1recipient...', 1000n)
      expect(msg).toBeInstanceOf(Message)
      expect(msg.toAny().typeUrl).toContain('MsgExecuteContract')
    })

    it('createApproveMsg() should return a Message', () => {
      const msg = token.createApproveMsg!('init1sender...', 'init1spender...', 500n)
      expect(msg).toBeInstanceOf(Message)
      expect(msg.toAny().typeUrl).toContain('MsgExecuteContract')
    })
  })

  describe('fungible-asset', () => {
    const token = createFungibleAssetToken(null as any, '0x1::metadata::Metadata')

    it('createTransferMsg() should return a Message', () => {
      const msg = token.createTransferMsg('init1sender...', 'init1recipient...', 1000n)
      expect(msg).toBeInstanceOf(Message)
      expect(msg.toAny().typeUrl).toContain('MsgExecute')
    })

    it('viewJSON should not crash with bigint-like args', async () => {
      const mockMoveClient = {
        viewJSON: vi.fn().mockResolvedValue({ data: '"1000000"' }),
      }
      const token = createFungibleAssetToken(mockMoveClient as any, '0x1::metadata::Metadata')
      const balance = await token.balanceOf('0xowner')
      expect(mockMoveClient.viewJSON).toHaveBeenCalled()
      expect(balance).toBe(1000000n)
    })
  })
})
