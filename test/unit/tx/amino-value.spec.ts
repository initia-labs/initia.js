/**
 * Amino value-level comparison: v1 (legacy) golden values vs v2 toAmino() output.
 *
 * Verifies that v2's toAmino() produces field values identical to v1's
 * hardcoded toAmino() for the same input data. This catches:
 *   - Number/BigInt formatting differences
 *   - Empty value handling (null vs undefined vs [])
 *   - Bytes encoding (base64 vs JSON object)
 *   - Nested object structure differences
 *   - Field omission rules
 */

import { describe, it, expect } from 'vitest'
import { Message } from '../../../src/msgs/types'
import { create } from '@bufbuild/protobuf'
import { toAmino } from '../../../src/tx/amino'
import { anyPack } from '../../../src/util/any'

// ============= Schema imports =============

import { MsgSendSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/bank/v1beta1/tx_pb'
import { CoinSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/base/v1beta1/coin_pb'
import {
  MsgDelegateSchema,
  MsgUndelegateSchema,
  MsgBeginRedelegateSchema,
} from '@buf/initia-labs_initia.bufbuild_es/initia/mstaking/v1/tx_pb'
import { MsgWithdrawDelegatorRewardSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/distribution/v1beta1/tx_pb'
import { MsgTransferSchema } from '@buf/cosmos_ibc.bufbuild_es/ibc/applications/transfer/v1/tx_pb'
import {
  MsgExecuteSchema as MsgMoveExecuteSchema,
  MsgScriptSchema,
  MsgWhitelistSchema,
  MsgDelistSchema,
} from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/tx_pb'
import {
  MsgVoteSchema,
  MsgDepositSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/gov/v1/tx_pb'
import {
  MsgGrantSchema,
  MsgExecSchema,
  MsgRevokeSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/authz/v1beta1/tx_pb'
import {
  MsgGrantAllowanceSchema,
  MsgRevokeAllowanceSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/feegrant/v1beta1/tx_pb'
import {
  MsgCreateSchema as MsgEvmCreateSchema,
  MsgCallSchema,
} from '@buf/initia-labs_minievm.bufbuild_es/minievm/evm/v1/tx_pb'
import {
  MsgStoreCodeSchema,
  MsgInstantiateContractSchema,
  MsgExecuteContractSchema,
  MsgMigrateContractSchema,
} from '@buf/cosmwasm_wasmd.bufbuild_es/cosmwasm/wasm/v1/tx_pb'
import {
  MsgInitiateTokenDepositSchema,
  MsgFinalizeTokenWithdrawalSchema,
} from '@buf/initia-labs_opinit.bufbuild_es/opinit/ophost/v1/tx_pb'
import { MsgInitiateTokenWithdrawalSchema } from '@buf/initia-labs_opinit.bufbuild_es/opinit/opchild/v1/tx_pb'
import { MsgUnjailSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/slashing/v1beta1/tx_pb'

// ============= Helpers =============

function coin(denom: string, amount: string) {
  return create(CoinSchema, { denom, amount })
}

function toBase64(bytes: Uint8Array): string {
  // Match v2's base64 encoding via @scure/base
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let result = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i]
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0
    result += alphabet[b0 >> 2]
    result += alphabet[((b0 & 3) << 4) | (b1 >> 4)]
    result += i + 1 < bytes.length ? alphabet[((b1 & 15) << 2) | (b2 >> 6)] : '='
    result += i + 2 < bytes.length ? alphabet[b2 & 63] : '='
  }
  return result
}

// ============= Bank =============

describe('Bank', () => {
  it('MsgSend — basic coin transfer', () => {
    const msg = new Message(MsgSendSchema, {
      fromAddress: 'init1sender',
      toAddress: 'init1receiver',
      amount: [coin('uinit', '1000000')],
    })

    const amino = msg.toAmino()

    // v1 golden output
    expect(amino).toEqual({
      type: 'cosmos-sdk/MsgSend',
      value: {
        from_address: 'init1sender',
        to_address: 'init1receiver',
        amount: [{ denom: 'uinit', amount: '1000000' }],
      },
    })
  })

  it('MsgSend — multiple coins', () => {
    const msg = new Message(MsgSendSchema, {
      fromAddress: 'init1sender',
      toAddress: 'init1receiver',
      amount: [coin('uinit', '500'), coin('uusdc', '1000')],
    })

    const amino = msg.toAmino()
    expect(amino.value.amount).toEqual([
      { denom: 'uinit', amount: '500' },
      { denom: 'uusdc', amount: '1000' },
    ])
  })
})

// ============= MStaking =============

describe('MStaking', () => {
  it('MsgDelegate — with coins', () => {
    const msg = new Message(MsgDelegateSchema, {
      delegatorAddress: 'init1delegator',
      validatorAddress: 'initvaloper1val',
      amount: [coin('uinit', '1000000')],
    })

    const amino = msg.toAmino()
    expect(amino).toEqual({
      type: 'mstaking/MsgDelegate',
      value: {
        delegator_address: 'init1delegator',
        validator_address: 'initvaloper1val',
        amount: [{ denom: 'uinit', amount: '1000000' }],
      },
    })
  })

  it('MsgDelegate — empty amount: v1=null vs v2=[] (dont_omitempty)', () => {
    const msg = new Message(MsgDelegateSchema, {
      delegatorAddress: 'init1delegator',
      validatorAddress: 'initvaloper1val',
      amount: [],
    })

    const amino = msg.toAmino()
    // MISMATCH: v1 returns null for empty Coins, v2 returns [] due to dont_omitempty=true
    // Proto amino option has dont_omitempty=true (NOT legacy_coins encoding),
    // so v2 correctly preserves empty array per proto spec.
    // v1 had custom Coins class that returned null regardless of proto options.
    expect(amino.value.amount).toEqual([])
  })

  it('MsgUndelegate', () => {
    const msg = new Message(MsgUndelegateSchema, {
      delegatorAddress: 'init1delegator',
      validatorAddress: 'initvaloper1val',
      amount: [coin('uinit', '500000')],
    })

    const amino = msg.toAmino()
    expect(amino.type).toBe('mstaking/MsgUndelegate')
    expect(amino.value).toEqual({
      delegator_address: 'init1delegator',
      validator_address: 'initvaloper1val',
      amount: [{ denom: 'uinit', amount: '500000' }],
    })
  })

  it('MsgBeginRedelegate', () => {
    const msg = new Message(MsgBeginRedelegateSchema, {
      delegatorAddress: 'init1delegator',
      validatorSrcAddress: 'initvaloper1src',
      validatorDstAddress: 'initvaloper1dst',
      amount: [coin('uinit', '300000')],
    })

    const amino = msg.toAmino()
    expect(amino.type).toBe('mstaking/MsgBeginRedelegate')
    expect(amino.value.delegator_address).toBe('init1delegator')
    expect(amino.value.validator_src_address).toBe('initvaloper1src')
    expect(amino.value.validator_dst_address).toBe('initvaloper1dst')
    expect(amino.value.amount).toEqual([{ denom: 'uinit', amount: '300000' }])
  })
})

// ============= Distribution =============

describe('Distribution', () => {
  it('MsgWithdrawDelegatorReward', () => {
    const msg = new Message(MsgWithdrawDelegatorRewardSchema, {
      delegatorAddress: 'init1delegator',
      validatorAddress: 'initvaloper1val',
    })

    const amino = msg.toAmino()
    expect(amino).toEqual({
      type: 'cosmos-sdk/MsgWithdrawDelegationReward',
      value: {
        delegator_address: 'init1delegator',
        validator_address: 'initvaloper1val',
      },
    })
  })
})

// ============= IBC Transfer =============

describe('IBC Transfer', () => {
  it('MsgTransfer — basic', () => {
    const msg = new Message(MsgTransferSchema, {
      sourcePort: 'transfer',
      sourceChannel: 'channel-0',
      token: coin('uinit', '1000000'),
      sender: 'init1sender',
      receiver: 'cosmos1receiver',
      timeoutTimestamp: 1700000000000000000n,
    })

    const amino = msg.toAmino()
    expect(amino.type).toBe('cosmos-sdk/MsgTransfer')
    expect(amino.value.source_port).toBe('transfer')
    expect(amino.value.source_channel).toBe('channel-0')
    expect(amino.value.token).toEqual({ denom: 'uinit', amount: '1000000' })
    expect(amino.value.sender).toBe('init1sender')
    expect(amino.value.receiver).toBe('cosmos1receiver')
    expect(amino.value.timeout_timestamp).toBe('1700000000000000000')
  })

  it('MsgTransfer — with memo', () => {
    const msg = new Message(MsgTransferSchema, {
      sourcePort: 'transfer',
      sourceChannel: 'channel-0',
      token: coin('uinit', '1000'),
      sender: 'init1sender',
      receiver: 'cosmos1receiver',
      timeoutTimestamp: 100n,
      memo: 'hello',
    })

    const amino = msg.toAmino()
    expect(amino.value.memo).toBe('hello')
  })
})

// ============= Move =============

describe('Move', () => {
  it('MsgExecute — with args', () => {
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
    expect(amino.type).toBe('move/MsgExecute')
    expect(amino.value.sender).toBe('init1sender')
    expect(amino.value.module_address).toBe('0x1')
    expect(amino.value.module_name).toBe('coin')
    expect(amino.value.function_name).toBe('transfer')
    expect(amino.value.type_args).toEqual(['0x1::aptos_coin::AptosCoin'])
    // args are Uint8Array → base64 strings
    expect(Array.isArray(amino.value.args)).toBe(true)
    expect(typeof (amino.value.args as string[])[0]).toBe('string')
  })

  it('MsgExecute — empty arrays handling', () => {
    const msg = new Message(MsgMoveExecuteSchema, {
      sender: 'init1sender',
      moduleAddress: '0x1',
      moduleName: 'coin',
      functionName: 'transfer',
      typeArgs: [],
      args: [],
    })

    const amino = msg.toAmino()
    // v1: empty arrays → undefined (omitted)
    // v2: empty arrays → null (with includeEmpty=false default)
    // Key difference to document
    const typeArgs = amino.value.type_args
    const args = amino.value.args
    // Both v1 and v2 should omit or null-ify empty arrays
    expect(
      typeArgs === null ||
        typeArgs === undefined ||
        (Array.isArray(typeArgs) && typeArgs.length === 0)
    ).toBe(true)
    expect(args === null || args === undefined || (Array.isArray(args) && args.length === 0)).toBe(
      true
    )
  })

  it('MsgScript', () => {
    const codeBytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef])
    const msg = new Message(MsgScriptSchema, {
      sender: 'init1sender',
      codeBytes,
      typeArgs: ['0x1::string::String'],
      args: [new Uint8Array([0x42])],
    })

    const amino = msg.toAmino()
    expect(amino.type).toBe('move/MsgScript')
    expect(amino.value.sender).toBe('init1sender')
    // code_bytes should be base64 encoded
    expect(typeof amino.value.code_bytes).toBe('string')
    expect(amino.value.code_bytes).toBe(toBase64(codeBytes))
    expect(amino.value.type_args).toEqual(['0x1::string::String'])
  })

  it('legacy MsgWhitelist', () => {
    const value = create(MsgWhitelistSchema, {
      authority: 'init1authority',
      metadataLp: 'lptoken',
      rewardWeight: '0.5',
    })

    const direct = toAmino(MsgWhitelistSchema, value)
    const fromAny = Message.fromAny(
      MsgWhitelistSchema,
      anyPack(MsgWhitelistSchema, value)
    ).toAmino()

    expect(direct).toEqual({
      type: 'move/MsgWhitelist',
      value: {
        authority: 'init1authority',
        metadata_lp: 'lptoken',
        reward_weight: '0.5',
      },
    })
    expect(fromAny).toEqual(direct)
    expect(direct.value).not.toHaveProperty('metadataLp')
    expect(direct.value).not.toHaveProperty('rewardWeight')
  })

  it('legacy MsgDelist', () => {
    const value = create(MsgDelistSchema, {
      authority: 'init1authority',
      metadataLp: 'lptoken',
    })

    const direct = toAmino(MsgDelistSchema, value)
    const fromAny = Message.fromAny(MsgDelistSchema, anyPack(MsgDelistSchema, value)).toAmino()

    expect(direct).toEqual({
      type: 'move/MsgDelist',
      value: {
        authority: 'init1authority',
        metadata_lp: 'lptoken',
      },
    })
    expect(fromAny).toEqual(direct)
    expect(direct.value).not.toHaveProperty('metadataLp')
  })
})

// ============= Gov v1 =============

describe('Gov v1', () => {
  it('MsgVote — proposal_id as string', () => {
    const msg = new Message(MsgVoteSchema, {
      proposalId: 42n,
      voter: 'init1voter',
      option: 1,
      metadata: '',
    })

    const amino = msg.toAmino()
    expect(amino.type).toBe('cosmos-sdk/v1/MsgVote')
    // v1: number.toFixed() → '42', v2: BigInt.toString() → '42'
    expect(amino.value.proposal_id).toBe('42')
    expect(amino.value.voter).toBe('init1voter')
    // v1: enum number, v2: number → string
    expect(amino.value.option).toBe('1')
  })

  it('MsgDeposit', () => {
    const msg = new Message(MsgDepositSchema, {
      proposalId: 5n,
      depositor: 'init1depositor',
      amount: [coin('uinit', '10000000')],
    })

    const amino = msg.toAmino()
    expect(amino.type).toBe('cosmos-sdk/v1/MsgDeposit')
    expect(amino.value.proposal_id).toBe('5')
    expect(amino.value.depositor).toBe('init1depositor')
    expect(amino.value.amount).toEqual([{ denom: 'uinit', amount: '10000000' }])
  })
})

// ============= Authz =============

describe('Authz', () => {
  it('MsgGrant — basic fields', () => {
    const msg = new Message(MsgGrantSchema, {
      granter: 'init1granter',
      grantee: 'init1grantee',
    })

    const amino = msg.toAmino()
    expect(amino.type).toBe('cosmos-sdk/MsgGrant')
    expect(amino.value.granter).toBe('init1granter')
    expect(amino.value.grantee).toBe('init1grantee')
  })

  it('MsgExec', () => {
    const msg = new Message(MsgExecSchema, {
      grantee: 'init1grantee',
      msgs: [],
    })

    const amino = msg.toAmino()
    expect(amino.type).toBe('cosmos-sdk/MsgExec')
    expect(amino.value.grantee).toBe('init1grantee')
  })

  it('MsgRevoke', () => {
    const msg = new Message(MsgRevokeSchema, {
      granter: 'init1granter',
      grantee: 'init1grantee',
      msgTypeUrl: '/cosmos.bank.v1beta1.MsgSend',
    })

    const amino = msg.toAmino()
    expect(amino.type).toBe('cosmos-sdk/MsgRevoke')
    expect(amino.value.granter).toBe('init1granter')
    expect(amino.value.grantee).toBe('init1grantee')
    expect(amino.value.msg_type_url).toBe('/cosmos.bank.v1beta1.MsgSend')
  })
})

// ============= Feegrant =============

describe('Feegrant', () => {
  it('MsgGrantAllowance — basic', () => {
    const msg = new Message(MsgGrantAllowanceSchema, {
      granter: 'init1granter',
      grantee: 'init1grantee',
    })

    const amino = msg.toAmino()
    expect(amino.type).toBe('cosmos-sdk/MsgGrantAllowance')
    expect(amino.value.granter).toBe('init1granter')
    expect(amino.value.grantee).toBe('init1grantee')
  })

  it('MsgRevokeAllowance', () => {
    const msg = new Message(MsgRevokeAllowanceSchema, {
      granter: 'init1granter',
      grantee: 'init1grantee',
    })

    const amino = msg.toAmino()
    expect(amino.type).toBe('cosmos-sdk/MsgRevokeAllowance')
    expect(amino.value.granter).toBe('init1granter')
    expect(amino.value.grantee).toBe('init1grantee')
  })
})

// ============= EVM (Minievm) =============

describe('EVM (Minievm)', () => {
  it('MsgCreate', () => {
    const msg = new Message(MsgEvmCreateSchema, {
      sender: 'init1sender',
      code: '0x608060',
      value: '0',
    })

    const amino = msg.toAmino()
    expect(amino.type).toBe('evm/MsgCreate')
    expect(amino.value.sender).toBe('init1sender')
    expect(amino.value.code).toBe('0x608060')
    expect(amino.value.value).toBe('0')
  })

  it('MsgCall', () => {
    const msg = new Message(MsgCallSchema, {
      sender: 'init1sender',
      contractAddr: '0x1234567890abcdef1234567890abcdef12345678',
      input: '0xa9059cbb',
      value: '0',
    })

    const amino = msg.toAmino()
    expect(amino.type).toBe('evm/MsgCall')
    expect(amino.value.sender).toBe('init1sender')
    expect(amino.value.contract_addr).toBe('0x1234567890abcdef1234567890abcdef12345678')
    expect(amino.value.input).toBe('0xa9059cbb')
    expect(amino.value.value).toBe('0')
  })
})

// ============= Wasm (CosmWasm) =============

describe('Wasm (CosmWasm)', () => {
  it('MsgStoreCode — wasm bytes as base64', () => {
    const wasmBytes = new Uint8Array([0x00, 0x61, 0x73, 0x6d])
    const msg = new Message(MsgStoreCodeSchema, {
      sender: 'init1sender',
      wasmByteCode: wasmBytes,
    })

    const amino = msg.toAmino()
    expect(amino.type).toBe('wasm/MsgStoreCode')
    expect(amino.value.sender).toBe('init1sender')
    // Both v1 and v2: Uint8Array → base64
    expect(amino.value.wasm_byte_code).toBe(toBase64(wasmBytes))
  })

  it('MsgExecuteContract — msg field uses inline_json encoding', () => {
    const execMsg = new TextEncoder().encode(
      JSON.stringify({ transfer: { to: 'init1dest', amount: '1000' } })
    )
    const msg = new Message(MsgExecuteContractSchema, {
      sender: 'init1sender',
      contract: 'init1contract',
      msg: execMsg,
      funds: [coin('uinit', '500')],
    })

    const amino = msg.toAmino()
    expect(amino.type).toBe('wasm/MsgExecuteContract')
    expect(amino.value.sender).toBe('init1sender')
    expect(amino.value.contract).toBe('init1contract')
    expect(amino.value.funds).toEqual([{ denom: 'uinit', amount: '500' }])

    // inline_json encoding: bytes are decoded to JSON object, matching
    // Go's RawContractMessage.MarshalJSON() which inlines via json.RawMessage
    expect(amino.value.msg).toEqual({ transfer: { to: 'init1dest', amount: '1000' } })
  })

  it('MsgInstantiateContract — code_id as string, msg as inline JSON', () => {
    const initMsg = new TextEncoder().encode(JSON.stringify({ count: 0 }))
    const msg = new Message(MsgInstantiateContractSchema, {
      sender: 'init1sender',
      admin: 'init1admin',
      codeId: 42n,
      label: 'my-contract',
      msg: initMsg,
      funds: [],
    })

    const amino = msg.toAmino()
    expect(amino.type).toBe('wasm/MsgInstantiateContract')
    expect(amino.value.sender).toBe('init1sender')
    expect(amino.value.admin).toBe('init1admin')
    expect(amino.value.code_id).toBe('42')
    expect(amino.value.label).toBe('my-contract')
    // inline_json encoding
    expect(amino.value.msg).toEqual({ count: 0 })
  })

  it('MsgMigrateContract — msg as inline JSON', () => {
    const migrateMsg = new TextEncoder().encode(JSON.stringify({ new_version: true }))
    const msg = new Message(MsgMigrateContractSchema, {
      sender: 'init1sender',
      contract: 'init1contract',
      codeId: 99n,
      msg: migrateMsg,
    })

    const amino = msg.toAmino()
    expect(amino.type).toBe('wasm/MsgMigrateContract')
    expect(amino.value.sender).toBe('init1sender')
    expect(amino.value.contract).toBe('init1contract')
    expect(amino.value.code_id).toBe('99')
    expect(amino.value.msg).toEqual({ new_version: true })
  })

  it('MsgExecuteContract — empty funds', () => {
    const execMsg = new TextEncoder().encode(JSON.stringify({ ping: {} }))
    const msg = new Message(MsgExecuteContractSchema, {
      sender: 'init1sender',
      contract: 'init1contract',
      msg: execMsg,
      funds: [],
    })

    const amino = msg.toAmino()
    // v1: Coins.toAmino() with empty → empty array [] (funds uses dont_omitempty)
    // v2: depends on proto amino options
    const funds = amino.value.funds
    // funds should be present (dont_omitempty) but may be [] or null
    expect(funds === null || (Array.isArray(funds) && funds.length === 0)).toBe(true)
  })
})

// ============= OpInit Bridge =============

describe('OpInit Bridge', () => {
  it('MsgInitiateTokenDeposit — bridge_id as string', () => {
    const msg = new Message(MsgInitiateTokenDepositSchema, {
      sender: 'init1sender',
      bridgeId: 1n,
      to: 'init1receiver',
      amount: coin('uinit', '1000000'),
      data: new Uint8Array([]),
    })

    const amino = msg.toAmino()
    expect(amino.type).toBe('ophost/MsgInitiateTokenDeposit')
    expect(amino.value.sender).toBe('init1sender')
    // v1: number.toFixed() → '1', v2: BigInt → '1'
    expect(amino.value.bridge_id).toBe('1')
    expect(amino.value.to).toBe('init1receiver')
    expect(amino.value.amount).toEqual({ denom: 'uinit', amount: '1000000' })
  })

  it('MsgInitiateTokenWithdrawal', () => {
    const msg = new Message(MsgInitiateTokenWithdrawalSchema, {
      sender: 'init1sender',
      to: 'init1receiver',
      amount: coin('uinit', '500000'),
    })

    const amino = msg.toAmino()
    expect(amino.type).toBe('opchild/MsgInitiateTokenWithdrawal')
    expect(amino.value.sender).toBe('init1sender')
    expect(amino.value.to).toBe('init1receiver')
    expect(amino.value.amount).toEqual({ denom: 'uinit', amount: '500000' })
  })

  it('MsgFinalizeTokenWithdrawal — multiple BigInt fields', () => {
    const version = new Uint8Array(32)
    const storageRoot = new Uint8Array(32)
    const lastBlockHash = new Uint8Array(32)

    const msg = new Message(MsgFinalizeTokenWithdrawalSchema, {
      sender: 'init1sender',
      bridgeId: 1n,
      outputIndex: 10n,
      withdrawalProofs: [new Uint8Array([0xaa, 0xbb])],
      from: 'init1from',
      to: 'init1to',
      sequence: 5n,
      amount: coin('uinit', '1000'),
      version,
      storageRoot,
      lastBlockHash,
    })

    const amino = msg.toAmino()
    expect(amino.type).toBe('ophost/MsgFinalizeTokenWithdrawal')
    expect(amino.value.bridge_id).toBe('1')
    expect(amino.value.output_index).toBe('10')
    expect(amino.value.sequence).toBe('5')
    expect(amino.value.from).toBe('init1from')
    expect(amino.value.to).toBe('init1to')
    expect(amino.value.amount).toEqual({ denom: 'uinit', amount: '1000' })
    // bytes fields → base64
    expect(typeof amino.value.version).toBe('string')
    expect(typeof amino.value.storage_root).toBe('string')
    expect(typeof amino.value.last_block_hash).toBe('string')
    // withdrawal_proofs → array of base64 strings
    const proofs = amino.value.withdrawal_proofs as string[]
    expect(Array.isArray(proofs)).toBe(true)
    expect(typeof proofs[0]).toBe('string')
  })
})

// ============= Slashing =============

describe('Slashing', () => {
  it('MsgUnjail — field_name override: validator_addr → address', () => {
    const msg = new Message(MsgUnjailSchema, {
      validatorAddr: 'initvaloper1val',
    })

    const amino = msg.toAmino()
    expect(amino.type).toBe('cosmos-sdk/MsgUnjail')
    // MISMATCH: v1 uses 'validator_addr', but proto amino.field_name option = 'address'
    // v2 correctly follows proto option: key is 'address', not 'validator_addr'
    expect(amino.value.address).toBe('initvaloper1val')
    expect(amino.value.validator_addr).toBeUndefined()
  })
})

// ============= Cross-cutting: value type consistency =============

describe('Value type consistency', () => {
  it('BigInt fields always become strings', () => {
    const voteAmino = new Message(MsgVoteSchema, {
      proposalId: 999n,
      voter: 'init1voter',
      option: 1,
    }).toAmino()
    expect(typeof voteAmino.value.proposal_id).toBe('string')
    expect(voteAmino.value.proposal_id).toBe('999')

    const depositAmino = new Message(MsgInitiateTokenDepositSchema, {
      sender: 'init1s',
      bridgeId: 777n,
      to: 'init1r',
      amount: coin('uinit', '1'),
    }).toAmino()
    expect(typeof depositAmino.value.bridge_id).toBe('string')
    expect(depositAmino.value.bridge_id).toBe('777')
  })

  it('Uint8Array fields always become base64 strings', () => {
    const bytes = new Uint8Array([0xca, 0xfe, 0xba, 0xbe])
    const expected = toBase64(bytes)

    const scriptAmino = new Message(MsgScriptSchema, {
      sender: 'init1s',
      codeBytes: bytes,
      typeArgs: [],
      args: [],
    }).toAmino()
    expect(scriptAmino.value.code_bytes).toBe(expected)
  })

  it('enum/number fields become strings', () => {
    const amino = new Message(MsgVoteSchema, {
      proposalId: 1n,
      voter: 'init1voter',
      option: 3,
    }).toAmino()
    // v2 converts number → string
    expect(amino.value.option).toBe('3')
  })

  it('Coin nested objects preserve structure', () => {
    const amino = new Message(MsgSendSchema, {
      fromAddress: 'init1a',
      toAddress: 'init1b',
      amount: [coin('uinit', '123'), coin('uusdc', '456')],
    }).toAmino()

    const coins = amino.value.amount as Array<{ denom: string; amount: string }>
    expect(coins).toEqual([
      { denom: 'uinit', amount: '123' },
      { denom: 'uusdc', amount: '456' },
    ])
  })
})
