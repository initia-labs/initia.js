/**
 * Regression test: bridge message builders return Message instances.
 * Covers #118: deposit, withdraw, claim return Message class instances.
 */

import { describe, it, expect } from 'vitest'
import { OpBridgeInternal } from '../../../src/bridge/op-bridge'
import { Message } from '../../../src/msgs/types'
import { Coin } from '../../../src/core/coin'
import type { ChainInfoProvider } from '../../../src/provider/types'
import type { WithdrawalInfo } from '../../../src/bridge/types'

// Minimal mock provider — only used if getBridgeId is called
const mockProvider: ChainInfoProvider = {
  getChainInfo: () => undefined,
  listChains: () => [],
  hasChain: () => false,
}

const mockCreateTransport = (() => ({})) as any

describe('bridge message builders return Message instances', () => {
  const bridge = new OpBridgeInternal(mockProvider, mockCreateTransport)

  it('deposit() should return a Message', () => {
    const msg = bridge.deposit({
      sender: 'init1sender...',
      bridgeId: 1n,
      to: 'init1receiver...',
      amount: new Coin('uinit', '1000000'),
    })

    expect(msg).toBeInstanceOf(Message)
    expect(msg.toAny().typeUrl).toContain('MsgInitiateTokenDeposit')
  })

  it('withdraw() should return a Message', () => {
    const msg = bridge.withdraw({
      sender: 'init1sender...',
      to: 'init1receiver...',
      amount: new Coin('uinit', '500000'),
    })

    expect(msg).toBeInstanceOf(Message)
    expect(msg.toAny().typeUrl).toContain('MsgInitiateTokenWithdrawal')
  })

  it('claim() should return a Message', () => {
    const withdrawal: WithdrawalInfo = {
      bridgeId: 1n,
      outputIndex: 1n,
      sequence: 1n,
      from: 'init1from...',
      to: 'init1to...',
      amount: new Coin('uinit', '100000'),
      txHash: '0'.repeat(64),
      version: '00'.repeat(32),
      storageRoot: '00'.repeat(32),
      lastBlockHash: '00'.repeat(32),
      withdrawalProofs: ['00'.repeat(32)],
      status: { status: 'claimable' },
    }

    const msg = bridge.claim({ sender: 'init1sender...', withdrawal })

    expect(msg).toBeInstanceOf(Message)
    expect(msg.toAny().typeUrl).toContain('MsgFinalizeTokenWithdrawal')
  })
})
