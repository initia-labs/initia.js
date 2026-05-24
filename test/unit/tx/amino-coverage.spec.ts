/**
 * toAmino() message type coverage verification.
 *
 * Covers #103: Verify toAmino() msg type coverage per proto-amino-conversion-rules.md.
 *
 * Verifies that:
 * 1. getAminoType(schema) returns valid amino type strings for all SDK message schemas
 * 2. toAmino() produces correct { type, value } output
 * 3. Exception types from Section 1.2 (e.g., MsgWithdrawDelegatorReward) map correctly
 * 4. Field name conversion (camelCase → snake_case) and value conversions work
 * 5. Empty array handling (legacy_coins → null) works
 * 6. Bytes → base64, BigInt → string conversions work
 *
 * Known limitations:
 * - authzGrant, authzExec, grantAllowance contain Any fields that are not auto-unpacked.
 *   These messages need custom amino overrides for correct amino signing.
 */

import { describe, it, expect } from 'vitest'
import type { DescMessage } from '@bufbuild/protobuf'
import { Message } from '../../../src/msgs/types'
import {
  getAminoType,
  getAminoFieldName,
  getAminoEncoding,
  shouldIncludeEmpty,
  camelToSnake,
  valueToAmino,
  sortObject,
} from '../../../src/tx/amino'

// ============= Schema imports (all schemas used by SDK msg builders) =============

// Bank
import { MsgSendSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/bank/v1beta1/tx_pb'
import { CoinSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/base/v1beta1/coin_pb'

// IBC
import { MsgTransferSchema } from '@buf/cosmos_ibc.bufbuild_es/ibc/applications/transfer/v1/tx_pb'

// Initia mstaking
import {
  MsgDelegateSchema,
  MsgUndelegateSchema,
  MsgBeginRedelegateSchema,
} from '@buf/initia-labs_initia.bufbuild_es/initia/mstaking/v1/tx_pb'

// Distribution
import { MsgWithdrawDelegatorRewardSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/distribution/v1beta1/tx_pb'

// Move
import {
  MsgExecuteSchema as MsgMoveExecuteSchema,
  MsgScriptSchema,
  MsgWhitelistSchema,
  MsgDelistSchema,
} from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/tx_pb'

// Gov v1
import {
  MsgVoteSchema,
  MsgDepositSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/gov/v1/tx_pb'

// Authz
import {
  MsgGrantSchema,
  MsgExecSchema,
  MsgRevokeSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/authz/v1beta1/tx_pb'

// Feegrant
import {
  MsgGrantAllowanceSchema,
  MsgRevokeAllowanceSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/feegrant/v1beta1/tx_pb'

// Group
import {
  MsgCreateGroupSchema,
  MsgVoteSchema as MsgGroupVoteSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/group/v1/tx_pb'

// Minievm
import {
  MsgCreateSchema as MsgEvmCreateSchema,
  MsgCallSchema,
} from '@buf/initia-labs_minievm.bufbuild_es/minievm/evm/v1/tx_pb'

// Miniwasm (CosmWasm)
import {
  MsgStoreCodeSchema,
  MsgInstantiateContractSchema,
  MsgExecuteContractSchema,
  MsgMigrateContractSchema,
} from '@buf/cosmwasm_wasmd.bufbuild_es/cosmwasm/wasm/v1/tx_pb'

// OpInit bridge
import {
  MsgInitiateTokenDepositSchema,
  MsgFinalizeTokenWithdrawalSchema,
} from '@buf/initia-labs_opinit.bufbuild_es/opinit/ophost/v1/tx_pb'
import { MsgInitiateTokenWithdrawalSchema } from '@buf/initia-labs_opinit.bufbuild_es/opinit/opchild/v1/tx_pb'

import { create } from '@bufbuild/protobuf'
import { AnySchema } from '@bufbuild/protobuf/wkt'

// ============= Section 1: Amino type string coverage =============

describe('getAminoType() returns valid type strings for all SDK schemas (#103)', () => {
  const schemaEntries: [string, DescMessage][] = [
    // Bank
    ['MsgSend', MsgSendSchema],

    // IBC
    ['MsgTransfer', MsgTransferSchema],

    // Initia mstaking
    ['MsgDelegate', MsgDelegateSchema],
    ['MsgUndelegate', MsgUndelegateSchema],
    ['MsgBeginRedelegate', MsgBeginRedelegateSchema],

    // Distribution
    ['MsgWithdrawDelegatorReward', MsgWithdrawDelegatorRewardSchema],

    // Move
    ['MsgExecute (move)', MsgMoveExecuteSchema],
    ['MsgScript', MsgScriptSchema],

    // Gov v1
    ['MsgVote', MsgVoteSchema],
    ['MsgDeposit', MsgDepositSchema],

    // Authz
    ['MsgGrant', MsgGrantSchema],
    ['MsgExec', MsgExecSchema],
    ['MsgRevoke', MsgRevokeSchema],

    // Feegrant
    ['MsgGrantAllowance', MsgGrantAllowanceSchema],
    ['MsgRevokeAllowance', MsgRevokeAllowanceSchema],

    // Group
    ['MsgCreateGroup', MsgCreateGroupSchema],
    ['MsgGroupVote', MsgGroupVoteSchema],

    // Minievm
    ['MsgCreate (evm)', MsgEvmCreateSchema],
    ['MsgCall (evm)', MsgCallSchema],

    // Miniwasm
    ['MsgStoreCode', MsgStoreCodeSchema],
    ['MsgInstantiateContract', MsgInstantiateContractSchema],
    ['MsgExecuteContract', MsgExecuteContractSchema],
    ['MsgMigrateContract', MsgMigrateContractSchema],

    // OpInit bridge
    ['MsgInitiateTokenDeposit', MsgInitiateTokenDepositSchema],
    ['MsgInitiateTokenWithdrawal', MsgInitiateTokenWithdrawalSchema],
    ['MsgFinalizeTokenWithdrawal', MsgFinalizeTokenWithdrawalSchema],
  ]

  it.each(schemaEntries)('%s should have a valid amino type', (name, schema) => {
    const aminoType = getAminoType(schema)
    expect(aminoType, `${name} should have amino.name option defined`).toBeDefined()
    expect(aminoType!.length).toBeGreaterThan(0)
    expect(typeof aminoType).toBe('string')
  })
})

// ============= Section 1.2: Exception type mappings =============

describe('Exception type mappings (proto-amino-conversion-rules.md §1.2)', () => {
  it('MsgWithdrawDelegatorReward → cosmos-sdk/MsgWithdrawDelegationReward', () => {
    // Delegator → Delegation name mismatch
    const aminoType = getAminoType(MsgWithdrawDelegatorRewardSchema)
    expect(aminoType).toBe('cosmos-sdk/MsgWithdrawDelegationReward')
  })

  it('standard Cosmos SDK pattern: MsgSend → cosmos-sdk/MsgSend', () => {
    expect(getAminoType(MsgSendSchema)).toBe('cosmos-sdk/MsgSend')
  })

  it('IBC pattern: MsgTransfer → cosmos-sdk/MsgTransfer', () => {
    expect(getAminoType(MsgTransferSchema)).toBe('cosmos-sdk/MsgTransfer')
  })

  it('Initia pattern: mstaking/MsgDelegate', () => {
    expect(getAminoType(MsgDelegateSchema)).toBe('mstaking/MsgDelegate')
  })

  it('CosmWasm pattern: wasm/MsgExecuteContract', () => {
    expect(getAminoType(MsgExecuteContractSchema)).toBe('wasm/MsgExecuteContract')
  })

  it('Gov v1 pattern: cosmos-sdk/v1/MsgVote', () => {
    expect(getAminoType(MsgVoteSchema)).toBe('cosmos-sdk/v1/MsgVote')
  })

  it('OpInit pattern: ophost/MsgInitiateTokenDeposit', () => {
    expect(getAminoType(MsgInitiateTokenDepositSchema)).toBe('ophost/MsgInitiateTokenDeposit')
  })

  it('legacy Move whitelist/delist patterns', () => {
    expect(getAminoType(MsgWhitelistSchema)).toBe('move/MsgWhitelist')
    expect(getAminoType(MsgDelistSchema)).toBe('move/MsgDelist')
  })
})

// ============= Section 2: Field name conversion =============

describe('Field name conversion (§2)', () => {
  describe('camelToSnake standard conversion (§2.1)', () => {
    it('delegatorAddress → delegator_address', () => {
      expect(camelToSnake('delegatorAddress')).toBe('delegator_address')
    })

    it('validatorAddress → validator_address', () => {
      expect(camelToSnake('validatorAddress')).toBe('validator_address')
    })

    it('timeoutHeight → timeout_height', () => {
      expect(camelToSnake('timeoutHeight')).toBe('timeout_height')
    })

    it('fromAddress → from_address', () => {
      expect(camelToSnake('fromAddress')).toBe('from_address')
    })
  })

  describe('field name options from proto schemas (§2.2)', () => {
    it('MsgSend fields use snake_case from proto options', () => {
      for (const field of MsgSendSchema.fields) {
        const aminoFieldName = getAminoFieldName(field)
        // Should be snake_case (no uppercase letters)
        expect(aminoFieldName).toMatch(/^[a-z0-9_]+$/)
      }
    })
  })
})

// ============= Section 3: Value type conversions =============

describe('Value type conversions (§3)', () => {
  it('BigInt → string (§3.1)', () => {
    expect(valueToAmino(100000n)).toBe('100000')
    expect(valueToAmino(0n)).toBe('0')
  })

  it('number → string (§3.1)', () => {
    expect(valueToAmino(200000)).toBe('200000')
    expect(valueToAmino(0)).toBe('0')
  })

  it('Uint8Array → base64 string (§3.2)', () => {
    const bytes = new Uint8Array([0, 1, 2, 3])
    const result = valueToAmino(bytes) as string
    expect(typeof result).toBe('string')
    // Verify it's valid base64
    expect(result).toMatch(/^[A-Za-z0-9+/]*={0,2}$/)
  })

  it('Date → ISO 8601 string (§3.3)', () => {
    const date = new Date('2024-01-01T00:00:00.000Z')
    expect(valueToAmino(date)).toBe('2024-01-01T00:00:00.000Z')
  })

  it('null/undefined → undefined', () => {
    expect(valueToAmino(null)).toBeUndefined()
    expect(valueToAmino(undefined)).toBeUndefined()
  })

  it('string passes through', () => {
    expect(valueToAmino('init1abc...')).toBe('init1abc...')
  })

  it('boolean passes through', () => {
    expect(valueToAmino(true)).toBe(true)
    expect(valueToAmino(false)).toBe(false)
  })
})

// ============= Section 4: Empty value handling =============

describe('Empty value handling (§4)', () => {
  it('empty array → undefined (omit) when includeEmpty=false (§4.1)', () => {
    expect(valueToAmino([], false)).toBeUndefined()
  })

  it('empty array → [] when includeEmpty=true (§4.1)', () => {
    expect(valueToAmino([], true)).toEqual([])
  })

  it('legacy_coins: empty array → null (§4.1)', () => {
    expect(valueToAmino([], false, 'legacy_coins')).toBeNull()
  })

  it('legacy_coins: non-empty array maps elements', () => {
    const coins = [{ denom: 'uinit', amount: '1000' }]
    const result = valueToAmino(coins, false, 'legacy_coins') as Array<{
      denom: string
      amount: string
    }>
    expect(result).toHaveLength(1)
    expect(result[0].denom).toBe('uinit')
    expect(result[0].amount).toBe('1000')
  })
})

// ============= Section 6: Message wrapper structure =============

describe('Message wrapper { type, value } structure (§6)', () => {
  it('MsgSend produces correct amino structure', () => {
    const msg = new Message(MsgSendSchema, {
      fromAddress: 'init1sender',
      toAddress: 'init1receiver',
      amount: [create(CoinSchema, { denom: 'uinit', amount: '1000000' })],
    })

    const amino = msg.toAmino()
    expect(amino.type).toBe('cosmos-sdk/MsgSend')
    expect(amino.value).toBeDefined()
    expect(amino.value.from_address).toBe('init1sender')
    expect(amino.value.to_address).toBe('init1receiver')
    expect(amino.value.amount).toEqual([{ denom: 'uinit', amount: '1000000' }])
  })

  it('MsgDelegate (mstaking) produces correct amino structure', () => {
    const msg = new Message(MsgDelegateSchema, {
      delegatorAddress: 'init1delegator',
      validatorAddress: 'initvaloper1validator',
      amount: [create(CoinSchema, { denom: 'uinit', amount: '500000' })],
    })

    const amino = msg.toAmino()
    expect(amino.type).toBe('mstaking/MsgDelegate')
    expect(amino.value.delegator_address).toBe('init1delegator')
    expect(amino.value.validator_address).toBe('initvaloper1validator')
  })

  it('MsgWithdrawDelegatorReward uses exception amino type', () => {
    const msg = new Message(MsgWithdrawDelegatorRewardSchema, {
      delegatorAddress: 'init1delegator',
      validatorAddress: 'initvaloper1validator',
    })

    const amino = msg.toAmino()
    // Section 1.2: Delegator → Delegation exception
    expect(amino.type).toBe('cosmos-sdk/MsgWithdrawDelegationReward')
    expect(amino.value.delegator_address).toBe('init1delegator')
    expect(amino.value.validator_address).toBe('initvaloper1validator')
  })

  it('Move MsgExecute produces correct amino structure', () => {
    const testArgs = new Uint8Array([0x01, 0x02, 0x03])
    const msg = new Message(MsgMoveExecuteSchema, {
      sender: 'init1sender',
      moduleAddress: '0x1',
      moduleName: 'coin',
      functionName: 'transfer',
      typeArgs: ['0x1::aptos_coin::AptosCoin'],
      args: [testArgs],
    })

    const amino = msg.toAmino()
    expect(amino.type).toBeDefined()
    expect(amino.value.sender).toBe('init1sender')
    expect(amino.value.module_address).toBe('0x1')
    expect(amino.value.module_name).toBe('coin')
    expect(amino.value.function_name).toBe('transfer')
    expect(amino.value.type_args).toEqual(['0x1::aptos_coin::AptosCoin'])
    // args are Uint8Array → base64
    expect(Array.isArray(amino.value.args)).toBe(true)
    const argsArray = amino.value.args as string[]
    expect(typeof argsArray[0]).toBe('string') // base64 encoded
  })

  it('MsgVote (gov v1) produces correct amino structure', () => {
    const msg = new Message(MsgVoteSchema, {
      proposalId: 42n,
      voter: 'init1voter',
      option: 1,
      metadata: '',
    })

    const amino = msg.toAmino()
    expect(amino.type).toBe('cosmos-sdk/v1/MsgVote')
    expect(amino.value.proposal_id).toBe('42')
    expect(amino.value.voter).toBe('init1voter')
    expect(amino.value.option).toBe('1')
  })

  it('Wasm MsgExecuteContract produces correct amino structure', () => {
    const execMsg = new TextEncoder().encode(JSON.stringify({ transfer: { to: 'init1...' } }))
    const msg = new Message(MsgExecuteContractSchema, {
      sender: 'init1sender',
      contract: 'init1contract',
      msg: execMsg,
      funds: [create(CoinSchema, { denom: 'uinit', amount: '1000' })],
    })

    const amino = msg.toAmino()
    expect(amino.type).toBe('wasm/MsgExecuteContract')
    expect(amino.value.sender).toBe('init1sender')
    expect(amino.value.contract).toBe('init1contract')
    // msg field uses inline_json encoding: bytes → parsed JSON object
    expect(amino.value.msg).toEqual({ transfer: { to: 'init1...' } })
  })
})

// ============= Section 7: Canonical JSON sorting =============

describe('Canonical JSON sorting (§7)', () => {
  it('sortObject sorts keys alphabetically', () => {
    const input = { z: 1, a: 2, m: 3 }
    const sorted = sortObject(input) as Record<string, number>
    const keys = Object.keys(sorted)
    expect(keys).toEqual(['a', 'm', 'z'])
  })

  it('sortObject handles nested objects', () => {
    const input = { b: { z: 1, a: 2 }, a: 1 }
    const sorted = sortObject(input) as Record<string, unknown>
    expect(Object.keys(sorted)).toEqual(['a', 'b'])
    expect(Object.keys(sorted.b as Record<string, unknown>)).toEqual(['a', 'z'])
  })

  it('sortObject handles arrays', () => {
    const input = [
      { b: 1, a: 2 },
      { d: 3, c: 4 },
    ]
    const sorted = sortObject(input) as unknown as Array<Record<string, number>>
    expect(Object.keys(sorted[0])).toEqual(['a', 'b'])
    expect(Object.keys(sorted[1])).toEqual(['c', 'd'])
  })
})

// ============= Section 10: Comprehensive toAmino() call for all msg types =============

describe('toAmino() produces valid output for all SDK message types (#103)', () => {
  it('MsgSend', () => {
    const msg = new Message(MsgSendSchema, {
      fromAddress: 'init1sender',
      toAddress: 'init1receiver',
      amount: [create(CoinSchema, { denom: 'uinit', amount: '1000' })],
    })
    const amino = msg.toAmino()
    expect(amino.type).toBeTruthy()
    expect(amino.value).toBeDefined()
  })

  it('MsgTransfer', () => {
    const msg = new Message(MsgTransferSchema, {
      sourcePort: 'transfer',
      sourceChannel: 'channel-0',
      token: create(CoinSchema, { denom: 'uinit', amount: '1000' }),
      sender: 'init1sender',
      receiver: 'cosmos1receiver',
      timeoutTimestamp: 1000000000n,
    })
    const amino = msg.toAmino()
    expect(amino.type).toBe('cosmos-sdk/MsgTransfer')
  })

  it('MsgDelegate (mstaking)', () => {
    const msg = new Message(MsgDelegateSchema, {
      delegatorAddress: 'init1delegator',
      validatorAddress: 'initvaloper1val',
      amount: [create(CoinSchema, { denom: 'uinit', amount: '1000' })],
    })
    const amino = msg.toAmino()
    expect(amino.type).toBe('mstaking/MsgDelegate')
  })

  it('MsgUndelegate (mstaking)', () => {
    const msg = new Message(MsgUndelegateSchema, {
      delegatorAddress: 'init1delegator',
      validatorAddress: 'initvaloper1val',
      amount: [create(CoinSchema, { denom: 'uinit', amount: '1000' })],
    })
    const amino = msg.toAmino()
    expect(amino.type).toBe('mstaking/MsgUndelegate')
  })

  it('MsgBeginRedelegate (mstaking)', () => {
    const msg = new Message(MsgBeginRedelegateSchema, {
      delegatorAddress: 'init1delegator',
      validatorSrcAddress: 'initvaloper1src',
      validatorDstAddress: 'initvaloper1dst',
      amount: [create(CoinSchema, { denom: 'uinit', amount: '1000' })],
    })
    const amino = msg.toAmino()
    expect(amino.type).toBe('mstaking/MsgBeginRedelegate')
  })

  it('MsgWithdrawDelegatorReward', () => {
    const msg = new Message(MsgWithdrawDelegatorRewardSchema, {
      delegatorAddress: 'init1delegator',
      validatorAddress: 'initvaloper1val',
    })
    const amino = msg.toAmino()
    expect(amino.type).toBe('cosmos-sdk/MsgWithdrawDelegationReward')
  })

  it('MsgExecute (move)', () => {
    const msg = new Message(MsgMoveExecuteSchema, {
      sender: 'init1sender',
      moduleAddress: '0x1',
      moduleName: 'coin',
      functionName: 'transfer',
      typeArgs: [],
      args: [],
    })
    const amino = msg.toAmino()
    expect(amino.type).toBeTruthy()
  })

  it('MsgScript', () => {
    const msg = new Message(MsgScriptSchema, {
      sender: 'init1sender',
      codeBytes: new Uint8Array([0x01]),
      typeArgs: [],
      args: [],
    })
    const amino = msg.toAmino()
    expect(amino.type).toBeTruthy()
  })

  it('MsgVote (gov v1)', () => {
    const msg = new Message(MsgVoteSchema, {
      proposalId: 1n,
      voter: 'init1voter',
      option: 1,
    })
    const amino = msg.toAmino()
    expect(amino.type).toBe('cosmos-sdk/v1/MsgVote')
  })

  it('MsgDeposit (gov v1)', () => {
    const msg = new Message(MsgDepositSchema, {
      proposalId: 1n,
      depositor: 'init1depositor',
      amount: [create(CoinSchema, { denom: 'uinit', amount: '1000' })],
    })
    const amino = msg.toAmino()
    expect(amino.type).toBe('cosmos-sdk/v1/MsgDeposit')
  })

  it('MsgGrant (authz)', () => {
    const msg = new Message(MsgGrantSchema, {
      granter: 'init1granter',
      grantee: 'init1grantee',
    })
    const amino = msg.toAmino()
    expect(amino.type).toBe('cosmos-sdk/MsgGrant')
  })

  it('MsgExec (authz)', () => {
    const msg = new Message(MsgExecSchema, {
      grantee: 'init1grantee',
      msgs: [],
    })
    const amino = msg.toAmino()
    expect(amino.type).toBe('cosmos-sdk/MsgExec')
  })

  it('MsgRevoke (authz)', () => {
    const msg = new Message(MsgRevokeSchema, {
      granter: 'init1granter',
      grantee: 'init1grantee',
      msgTypeUrl: '/cosmos.bank.v1beta1.MsgSend',
    })
    const amino = msg.toAmino()
    expect(amino.type).toBe('cosmos-sdk/MsgRevoke')
  })

  it('MsgGrantAllowance (feegrant)', () => {
    const msg = new Message(MsgGrantAllowanceSchema, {
      granter: 'init1granter',
      grantee: 'init1grantee',
    })
    const amino = msg.toAmino()
    expect(amino.type).toBe('cosmos-sdk/MsgGrantAllowance')
  })

  it('MsgRevokeAllowance (feegrant)', () => {
    const msg = new Message(MsgRevokeAllowanceSchema, {
      granter: 'init1granter',
      grantee: 'init1grantee',
    })
    const amino = msg.toAmino()
    expect(amino.type).toBe('cosmos-sdk/MsgRevokeAllowance')
  })

  it('MsgCreateGroup', () => {
    const msg = new Message(MsgCreateGroupSchema, {
      admin: 'init1admin',
      members: [],
    })
    const amino = msg.toAmino()
    expect(amino.type).toBe('cosmos-sdk/MsgCreateGroup')
  })

  it('MsgGroupVote', () => {
    const msg = new Message(MsgGroupVoteSchema, {
      proposalId: 1n,
      voter: 'init1voter',
      option: 1,
    })
    const amino = msg.toAmino()
    expect(amino.type).toBeTruthy()
  })

  it('MsgCreate (evm)', () => {
    const msg = new Message(MsgEvmCreateSchema, {
      sender: 'init1sender',
      code: '0x00',
      value: '0',
    })
    const amino = msg.toAmino()
    expect(amino.type).toBeTruthy()
  })

  it('MsgCall (evm)', () => {
    const msg = new Message(MsgCallSchema, {
      sender: 'init1sender',
      contractAddr: '0x1234567890abcdef1234567890abcdef12345678',
      input: '0x00',
      value: '0',
    })
    const amino = msg.toAmino()
    expect(amino.type).toBeTruthy()
  })

  it('MsgStoreCode (wasm)', () => {
    const msg = new Message(MsgStoreCodeSchema, {
      sender: 'init1sender',
      wasmByteCode: new Uint8Array([0x00, 0x61]),
    })
    const amino = msg.toAmino()
    expect(amino.type).toBe('wasm/MsgStoreCode')
  })

  it('MsgInstantiateContract (wasm)', () => {
    const msg = new Message(MsgInstantiateContractSchema, {
      sender: 'init1sender',
      admin: '',
      codeId: 1n,
      label: 'test',
      msg: new Uint8Array([0x7b, 0x7d]), // {}
      funds: [],
    })
    const amino = msg.toAmino()
    expect(amino.type).toBe('wasm/MsgInstantiateContract')
  })

  it('MsgExecuteContract (wasm)', () => {
    const msg = new Message(MsgExecuteContractSchema, {
      sender: 'init1sender',
      contract: 'init1contract',
      msg: new Uint8Array([0x7b, 0x7d]),
      funds: [],
    })
    const amino = msg.toAmino()
    expect(amino.type).toBe('wasm/MsgExecuteContract')
  })

  it('MsgMigrateContract (wasm)', () => {
    const msg = new Message(MsgMigrateContractSchema, {
      sender: 'init1sender',
      contract: 'init1contract',
      codeId: 2n,
      msg: new Uint8Array([0x7b, 0x7d]),
    })
    const amino = msg.toAmino()
    expect(amino.type).toBe('wasm/MsgMigrateContract')
  })

  it('MsgInitiateTokenDeposit (ophost)', () => {
    const msg = new Message(MsgInitiateTokenDepositSchema, {
      sender: 'init1sender',
      bridgeId: 1n,
      to: 'init1receiver',
      amount: create(CoinSchema, { denom: 'uinit', amount: '1000' }),
    })
    const amino = msg.toAmino()
    expect(amino.type).toBe('ophost/MsgInitiateTokenDeposit')
  })

  it('MsgInitiateTokenWithdrawal (opchild)', () => {
    const msg = new Message(MsgInitiateTokenWithdrawalSchema, {
      sender: 'init1sender',
      to: 'init1receiver',
      amount: create(CoinSchema, { denom: 'uinit', amount: '1000' }),
    })
    const amino = msg.toAmino()
    expect(amino.type).toBe('opchild/MsgInitiateTokenWithdrawal')
  })

  it('MsgFinalizeTokenWithdrawal (ophost)', () => {
    const msg = new Message(MsgFinalizeTokenWithdrawalSchema, {
      sender: 'init1sender',
      bridgeId: 1n,
      outputIndex: 1n,
      withdrawalProofs: [],
      from: 'init1from',
      to: 'init1receiver',
      sequence: 1n,
      amount: create(CoinSchema, { denom: 'uinit', amount: '1000' }),
      version: new Uint8Array(32),
      storageRoot: new Uint8Array(32),
      lastBlockHash: new Uint8Array(32),
    })
    const amino = msg.toAmino()
    expect(amino.type).toBe('ophost/MsgFinalizeTokenWithdrawal')
  })
})

// ============= Proto options runtime verification =============

describe('Proto amino options are readable at runtime (§12)', () => {
  it('amino.encoding is available for Coin fields', () => {
    // The amount field in MsgDelegate should have legacy_coins encoding or dont_omitempty
    let hasAminoOptions = false
    for (const field of MsgDelegateSchema.fields) {
      const enc = getAminoEncoding(field)
      const dontOmit = shouldIncludeEmpty(field)
      if (enc || dontOmit) {
        hasAminoOptions = true
      }
    }
    // At least one field should have amino options
    expect(hasAminoOptions).toBe(true)
  })

  it('amino.field_name overrides are available', () => {
    // Check that proto schemas provide field_name overrides where needed
    for (const field of MsgSendSchema.fields) {
      const name = getAminoFieldName(field)
      // Should return a valid snake_case name
      expect(name).toMatch(/^[a-z0-9_]+$/)
    }
  })
})

// ============= Known limitations documentation =============

describe('Known limitations for amino conversion', () => {
  it('Message.fromAny() cannot convert to amino (throws)', () => {
    const anyMsg = create(AnySchema, {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: new Uint8Array([10, 5]),
    })
    const msg = Message.fromAny(anyMsg)
    expect(() => msg.toAmino()).toThrow('Cannot convert to Amino on a pre-packed Any')
  })

  it('Custom amino override allows manual conversion', () => {
    const msg = new Message(
      MsgGrantSchema,
      {
        granter: 'init1granter',
        grantee: 'init1grantee',
      },
      {
        toAmino: value => ({
          type: 'cosmos-sdk/MsgGrant',
          value: {
            granter: (value as Record<string, unknown>).granter,
            grantee: (value as Record<string, unknown>).grantee,
            grant: {
              authorization: {
                type: 'cosmos-sdk/GenericAuthorization',
                value: { msg: '/cosmos.bank.v1beta1.MsgSend' },
              },
            },
          },
        }),
      }
    )
    const amino = msg.toAmino()
    expect(amino.type).toBe('cosmos-sdk/MsgGrant')
    const grant = amino.value.grant as Record<string, unknown>
    const authorization = grant.authorization as Record<string, unknown>
    expect(authorization.type).toBe('cosmos-sdk/GenericAuthorization')
  })
})
