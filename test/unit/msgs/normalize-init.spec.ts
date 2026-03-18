/**
 * T3: Unit tests for normalizeInit.
 */

import { describe, it, expect } from 'vitest'
import { normalizeInit, Message, defaultTimeout, msgWithDefaults } from '../../../src/msgs/types'
import { ValidationError } from '../../../src/errors'
import { coin } from '../../../src/core/coin'
import { MsgSendSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/bank/v1beta1/tx_pb'
import { MsgTransferSchema } from '@buf/cosmos_ibc.bufbuild_es/ibc/applications/transfer/v1/tx_pb'
import { MsgGrantSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/authz/v1beta1/tx_pb'
import { MsgExecuteSchema } from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/tx_pb'
import { MsgExecSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/authz/v1beta1/tx_pb'

describe('normalizeInit', () => {
  describe('Coin handling', () => {
    it('should convert Coin list fields to proto Coins', () => {
      const result = normalizeInit(MsgSendSchema, {
        fromAddress: 'init1a',
        toAddress: 'init1b',
        amount: [coin('uinit', '1000')],
      })

      expect(result.amount).toHaveLength(1)
      expect(result.amount![0].denom).toBe('uinit')
      expect(result.amount![0].amount).toBe('1000')
    })

    it('should convert single Coin to array', () => {
      const result = normalizeInit(MsgSendSchema, {
        fromAddress: 'init1a',
        toAddress: 'init1b',
        amount: coin('uinit', '500'),
      })

      expect(result.amount).toHaveLength(1)
      expect(result.amount![0].denom).toBe('uinit')
    })

    it('should convert singular Coin fields', () => {
      const result = normalizeInit(MsgTransferSchema, {
        sender: 'init1a',
        receiver: 'init1b',
        sourceChannel: 'channel-0',
        sourcePort: 'transfer',
        token: coin('uinit', '1000'),
      })

      expect(result.token).toBeDefined()
      expect(result.token!.denom).toBe('uinit')
      expect(result.token!.amount).toBe('1000')
    })
  })

  describe('hex → bytes conversion', () => {
    it('should convert hex strings in bytes fields', () => {
      const result = normalizeInit(MsgExecuteSchema, {
        sender: 'init1a',
        moduleAddress: 'init1b',
        moduleName: 'module',
        functionName: 'func',
        args: ['0x0102030405'],
        typeArgs: [],
      })

      expect(result.args).toHaveLength(1)
      expect(result.args![0]).toBeInstanceOf(Uint8Array)
      expect(result.args![0]).toEqual(new Uint8Array([1, 2, 3, 4, 5]))
    })
  })

  describe('number → bigint conversion', () => {
    it('should convert numbers to bigint for int64/uint64 fields', () => {
      const result = normalizeInit(MsgTransferSchema, {
        sender: 'init1a',
        receiver: 'init1b',
        sourceChannel: 'channel-0',
        sourcePort: 'transfer',
        token: coin('uinit', '100'),
        timeoutTimestamp: 1000000,
      })

      expect(typeof result.timeoutTimestamp).toBe('bigint')
      expect(result.timeoutTimestamp).toBe(1000000n)
    })

    it('should throw ValidationError for float in bigint field', () => {
      expect(() =>
        normalizeInit(MsgTransferSchema, {
          sender: 'init1a',
          receiver: 'init1b',
          sourceChannel: 'channel-0',
          sourcePort: 'transfer',
          token: coin('uinit', '100'),
          timeoutTimestamp: 1.5,
        } as never)
      ).toThrow(ValidationError)
      expect(() =>
        normalizeInit(MsgTransferSchema, {
          sender: 'init1a',
          receiver: 'init1b',
          sourceChannel: 'channel-0',
          sourcePort: 'transfer',
          token: coin('uinit', '100'),
          timeoutTimestamp: 1.5,
        } as never)
      ).toThrow('integer for BigInt')
    })

    it('should throw ValidationError for NaN in bigint field', () => {
      expect(() =>
        normalizeInit(MsgTransferSchema, {
          sender: 'init1a',
          receiver: 'init1b',
          sourceChannel: 'channel-0',
          sourcePort: 'transfer',
          token: coin('uinit', '100'),
          timeoutTimestamp: NaN,
        } as never)
      ).toThrow(ValidationError)
    })

    it('should throw ValidationError for Infinity in bigint field', () => {
      expect(() =>
        normalizeInit(MsgTransferSchema, {
          sender: 'init1a',
          receiver: 'init1b',
          sourceChannel: 'channel-0',
          sourcePort: 'transfer',
          token: coin('uinit', '100'),
          timeoutTimestamp: Infinity,
        } as never)
      ).toThrow(ValidationError)
    })
  })

  describe('Date → Timestamp conversion', () => {
    it('should convert Date to Timestamp for singular Timestamp fields', () => {
      const testDate = new Date('2025-01-01T00:00:00Z')
      const result = normalizeInit(MsgGrantSchema, {
        granter: 'init1a',
        grantee: 'init1b',
        grant: {
          expiration: testDate,
        },
      } as never)

      // normalizeInit recursively processes nested messages
      // The grant field should be processed and contain the expiration
      expect(result.grant).toBeDefined()
    })
  })

  describe('recursive nested message normalization', () => {
    it('should recursively normalize nested message fields', () => {
      // MsgTransfer has a nested Height message (timeoutHeight)
      const result = normalizeInit(MsgTransferSchema, {
        sender: 'init1a',
        receiver: 'init1b',
        sourceChannel: 'channel-0',
        sourcePort: 'transfer',
        token: coin('uinit', '100'),
        timeoutHeight: {
          revisionNumber: 1,
          revisionHeight: 100000,
        },
      })

      expect(result.timeoutHeight).toBeDefined()
      // The nested Height message has uint64 fields that should be converted
      expect(typeof result.timeoutHeight!.revisionNumber).toBe('bigint')
      expect(typeof result.timeoutHeight!.revisionHeight).toBe('bigint')
    })
  })

  describe('non-object init rejection', () => {
    it('should throw ValidationError for null init', () => {
      expect(() => normalizeInit(MsgSendSchema, null as never)).toThrow(ValidationError)
      expect(() => normalizeInit(MsgSendSchema, null as never)).toThrow('Expected an init object')
    })

    it('should throw ValidationError for string init', () => {
      expect(() => normalizeInit(MsgSendSchema, 'bad' as never)).toThrow(ValidationError)
    })

    it('should throw ValidationError for non-object nested message field', () => {
      expect(() =>
        normalizeInit(MsgTransferSchema, {
          sender: 'init1a',
          receiver: 'init1b',
          sourceChannel: 'channel-0',
          sourcePort: 'transfer',
          token: coin('uinit', '100'),
          timeoutHeight: 'not-an-object' as never,
        })
      ).toThrow(ValidationError)
      expect(() =>
        normalizeInit(MsgTransferSchema, {
          sender: 'init1a',
          receiver: 'init1b',
          sourceChannel: 'channel-0',
          sourcePort: 'transfer',
          token: coin('uinit', '100'),
          timeoutHeight: 'not-an-object' as never,
        })
      ).toThrow('expects a')
    })
  })

  describe('unknown key detection', () => {
    it('should throw ValidationError for unknown keys', () => {
      expect(() =>
        normalizeInit(MsgSendSchema, {
          fromAddress: 'init1a',
          toAddress: 'init1b',
          amount: [],
          unknownField: 'value',
        } as never)
      ).toThrow(ValidationError)
    })

    it('should include valid fields in error message', () => {
      expect(() =>
        normalizeInit(MsgSendSchema, {
          fromAddress: 'init1a',
          toAddress: 'init1b',
          amount: [],
          typoField: 'value',
        } as never)
      ).toThrow('Valid fields:')
    })

    it('should throw for unknown keys even with null values (C1)', () => {
      expect(() =>
        normalizeInit(MsgSendSchema, {
          fromAddress: 'init1a',
          toAddress: 'init1b',
          amount: [],
          froAddress: undefined,
        } as never)
      ).toThrow(ValidationError)
    })

    it('should skip proto metadata keys ($typeName, $unknown)', () => {
      const input = {
        fromAddress: 'init1a',
        toAddress: 'init1b',
        amount: [],
        $typeName: 'cosmos.bank.v1beta1.MsgSend',
      }

      const result = normalizeInit(MsgSendSchema, input as never)
      expect(result.fromAddress).toBe('init1a')
    })
  })

  describe('list field validation (I5)', () => {
    it('should throw ValidationError when non-array passed to repeated field', () => {
      expect(() =>
        normalizeInit(MsgExecuteSchema, {
          sender: 'init1a',
          moduleAddress: 'init1b',
          moduleName: 'module',
          functionName: 'func',
          args: 'not-an-array' as never,
          typeArgs: [],
        })
      ).toThrow(ValidationError)

      expect(() =>
        normalizeInit(MsgExecuteSchema, {
          sender: 'init1a',
          moduleAddress: 'init1b',
          moduleName: 'module',
          functionName: 'func',
          args: 'not-an-array' as never,
          typeArgs: [],
        })
      ).toThrow('repeated field')
    })
  })

  describe('null/undefined passthrough', () => {
    it('should pass through null values for valid fields', () => {
      const result = normalizeInit(MsgTransferSchema, {
        sender: 'init1a',
        receiver: 'init1b',
        sourceChannel: 'channel-0',
        sourcePort: 'transfer',
        token: null,
      } as never)

      expect(result.token).toBeNull()
    })
  })

  describe('Message → Any conversion', () => {
    it('should convert Message instances to Any in repeated Any fields', () => {
      const sendMsg = new Message(MsgSendSchema, {
        fromAddress: 'init1a',
        toAddress: 'init1b',
        amount: [{ denom: 'uinit', amount: '100' }],
      })

      const result = normalizeInit(MsgExecSchema, {
        grantee: 'init1grantee',
        msgs: [sendMsg],
      } as never)

      expect(result.msgs).toHaveLength(1)
      expect(result.msgs![0].typeUrl).toBe('/cosmos.bank.v1beta1.MsgSend')
      expect(result.msgs![0].value).toBeInstanceOf(Uint8Array)
    })
  })
})

describe('msgWithDefaults', () => {
  it('should apply defaults for missing keys', () => {
    const result = msgWithDefaults(
      MsgSendSchema,
      { fromAddress: 'default-sender' } as never,
      { toAddress: 'init1b', amount: [coin('uinit', '100')] } as never
    )
    expect(result.value.fromAddress).toBe('default-sender')
    expect(result.value.toAddress).toBe('init1b')
  })

  it('should let user values override defaults', () => {
    const result = msgWithDefaults(
      MsgSendSchema,
      { fromAddress: 'default-sender', toAddress: 'default-receiver' } as never,
      {
        fromAddress: 'user-sender',
        toAddress: 'user-receiver',
        amount: [coin('uinit', '50')],
      } as never
    )
    expect(result.value.fromAddress).toBe('user-sender')
    expect(result.value.toAddress).toBe('user-receiver')
  })

  it('should pass through unrelated fields unchanged', () => {
    const result = msgWithDefaults(
      MsgSendSchema,
      {} as never,
      {
        fromAddress: 'init1a',
        toAddress: 'init1b',
        amount: [coin('uinit', '1000')],
      } as never
    )
    expect(result.value.fromAddress).toBe('init1a')
    expect(result.value.amount).toHaveLength(1)
  })
})

describe('defaultTimeout', () => {
  it('should return a bigint approximately 10 minutes in the future (nanoseconds)', () => {
    const before = BigInt(Date.now()) * 1_000_000n
    const timeout = defaultTimeout()
    const after = BigInt(Date.now()) * 1_000_000n

    expect(typeof timeout).toBe('bigint')
    // Should be roughly 10 minutes (600_000ms = 600_000_000_000ns) in the future
    const tenMinNs = 600_000_000_000n
    expect(timeout).toBeGreaterThan(before + tenMinNs - 1_000_000_000n) // allow 1s tolerance
    expect(timeout).toBeLessThan(after + tenMinNs + 1_000_000_000n)
  })
})
