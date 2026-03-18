/**
 * Tests for parseEventAttrs and parseMoveEventData using real transaction data.
 *
 * Source txs:
 * - L1 IBC transfer: 26AF9B9271571074930A6214E75ED908B2A04B2FCB5C92737FEB11511BC367D1 (initiation-2)
 * - L2 multi-hop:    F6B16FC1569F3BEE4602D99F8C35478DB4661222ABAA5532C1B5AA3BC62DD9F9 (move-1)
 */
import { describe, it, expect } from 'vitest'
import { parseEventAttrs, parseMoveEventData, type CosmosEvent } from '../../../src/client/events'

// ---------------------------------------------------------------------------
// Real event data from L1 IBC transfer tx (initiation-2, height 21218409)
// ---------------------------------------------------------------------------

const L1_IBC_EVENTS: CosmosEvent[] = [
  {
    type: 'transfer',
    attributes: [
      { key: 'recipient', value: 'init17xpfvakm2amg962yls6f84z3kell8c5l70rnql' },
      { key: 'sender', value: 'init1m02xm8z6thsxjgp5rhsqgvg0afl4jt8055yq0s' },
      { key: 'amount', value: '3159uinit' },
    ],
  },
  {
    type: 'transfer',
    attributes: [
      { key: 'recipient', value: 'init1e97gv9hkvy3xq8cz85pspea8pyvjp9e72r90fx' },
      { key: 'sender', value: 'init1m02xm8z6thsxjgp5rhsqgvg0afl4jt8055yq0s' },
      { key: 'amount', value: '1000000uinit' },
      { key: 'msg_index', value: '0' },
    ],
  },
  {
    type: 'ibc_transfer',
    attributes: [
      { key: 'sender', value: 'init1m02xm8z6thsxjgp5rhsqgvg0afl4jt8055yq0s' },
      { key: 'receiver', value: 'init1m02xm8z6thsxjgp5rhsqgvg0afl4jt8055yq0s' },
      { key: 'amount', value: '1000000' },
      { key: 'denom', value: 'uinit' },
      { key: 'memo', value: '' },
      { key: 'msg_index', value: '0' },
    ],
  },
  {
    type: 'send_packet',
    attributes: [
      {
        key: 'packet_data',
        value:
          '{"amount":"1000000","denom":"uinit","receiver":"init1m02xm8z6thsxjgp5rhsqgvg0afl4jt8055yq0s","sender":"init1m02xm8z6thsxjgp5rhsqgvg0afl4jt8055yq0s"}',
      },
      { key: 'packet_sequence', value: '166' },
      { key: 'packet_src_port', value: 'transfer' },
      { key: 'packet_src_channel', value: 'channel-3075' },
      { key: 'packet_dst_port', value: 'transfer' },
      { key: 'packet_dst_channel', value: 'channel-0' },
      { key: 'msg_index', value: '0' },
    ],
  },
  {
    type: 'move',
    attributes: [
      { key: 'type_tag', value: '0x1::fungible_asset::WithdrawEvent' },
      {
        key: 'data',
        value:
          '{"store_addr":"0xe3dc74d34c08f4a53d7db5f2927352b89a59afd598c90e8a3bc6cdfd44b74530","metadata_addr":"0x8e4733bdabcf7d4afc3d14f0dd46c9bf52fb0fce9e4b996c939e195b8bc891d9","amount":"1000000"}',
      },
      { key: 'amount', value: '1000000' },
      {
        key: 'metadata_addr',
        value: '0x8e4733bdabcf7d4afc3d14f0dd46c9bf52fb0fce9e4b996c939e195b8bc891d9',
      },
      {
        key: 'store_addr',
        value: '0xe3dc74d34c08f4a53d7db5f2927352b89a59afd598c90e8a3bc6cdfd44b74530',
      },
      { key: 'msg_index', value: '0' },
    ],
  },
  {
    type: 'move',
    attributes: [
      { key: 'type_tag', value: '0x1::fungible_asset::DepositEvent' },
      {
        key: 'data',
        value:
          '{"store_addr":"0x93cb4457860dfb64bac1d0bcba86f91cbedb65d7187db1bd0d95d75c2f49de8d","metadata_addr":"0x8e4733bdabcf7d4afc3d14f0dd46c9bf52fb0fce9e4b996c939e195b8bc891d9","amount":"1000000"}',
      },
      { key: 'amount', value: '1000000' },
      {
        key: 'metadata_addr',
        value: '0x8e4733bdabcf7d4afc3d14f0dd46c9bf52fb0fce9e4b996c939e195b8bc891d9',
      },
      {
        key: 'store_addr',
        value: '0x93cb4457860dfb64bac1d0bcba86f91cbedb65d7187db1bd0d95d75c2f49de8d',
      },
      { key: 'msg_index', value: '0' },
    ],
  },
  {
    type: 'move',
    attributes: [
      { key: 'type_tag', value: '0x1::fungible_asset::WithdrawOwnerEvent' },
      { key: 'data', value: '{"owner":"0xdbd46d9c5a5de06920341de004310fea7f592cef"}' },
      { key: 'owner', value: '0xdbd46d9c5a5de06920341de004310fea7f592cef' },
      { key: 'msg_index', value: '0' },
    ],
  },
  {
    type: 'move',
    attributes: [
      { key: 'type_tag', value: '0x1::fungible_asset::DepositOwnerEvent' },
      { key: 'data', value: '{"owner":"0xc97c8616f66122601f023d0300e7a7091920973e"}' },
      { key: 'owner', value: '0xc97c8616f66122601f023d0300e7a7091920973e' },
      { key: 'msg_index', value: '0' },
    ],
  },
]

// ---------------------------------------------------------------------------
// parseEventAttrs — Cosmos typed attribute extraction
// ---------------------------------------------------------------------------

describe('parseEventAttrs', () => {
  it('should extract multiple transfer events with typed attributes', () => {
    const transfers = parseEventAttrs(L1_IBC_EVENTS, 'transfer', ['recipient', 'sender', 'amount'])
    expect(transfers).toHaveLength(2)
    expect(transfers[0]).toEqual({
      recipient: 'init17xpfvakm2amg962yls6f84z3kell8c5l70rnql',
      sender: 'init1m02xm8z6thsxjgp5rhsqgvg0afl4jt8055yq0s',
      amount: '3159uinit',
    })
    expect(transfers[1].amount).toBe('1000000uinit')
  })

  it('should extract IBC transfer details', () => {
    const ibcTransfers = parseEventAttrs(L1_IBC_EVENTS, 'ibc_transfer', [
      'sender',
      'receiver',
      'amount',
      'denom',
    ])
    expect(ibcTransfers).toHaveLength(1)
    expect(ibcTransfers[0]).toEqual({
      sender: 'init1m02xm8z6thsxjgp5rhsqgvg0afl4jt8055yq0s',
      receiver: 'init1m02xm8z6thsxjgp5rhsqgvg0afl4jt8055yq0s',
      amount: '1000000',
      denom: 'uinit',
    })
  })

  it('should extract send_packet routing info', () => {
    const packets = parseEventAttrs(L1_IBC_EVENTS, 'send_packet', [
      'packet_src_channel',
      'packet_dst_channel',
      'packet_sequence',
    ])
    expect(packets).toHaveLength(1)
    expect(packets[0]).toEqual({
      packet_src_channel: 'channel-3075',
      packet_dst_channel: 'channel-0',
      packet_sequence: '166',
    })
  })

  it('should return empty string for missing attributes', () => {
    const result = parseEventAttrs(L1_IBC_EVENTS, 'ibc_transfer', ['sender', 'nonexistent'])
    expect(result[0].nonexistent).toBe('')
  })

  it('should return empty array for non-matching event type', () => {
    expect(parseEventAttrs(L1_IBC_EVENTS, 'governance_vote', ['voter'])).toEqual([])
  })

  it('should support [0] for single-event access', () => {
    const ibc = parseEventAttrs(L1_IBC_EVENTS, 'ibc_transfer', ['denom'])[0]
    expect(ibc.denom).toBe('uinit')
  })
})

// ---------------------------------------------------------------------------
// parseMoveEventData — Move JSON auto-parse
// ---------------------------------------------------------------------------

describe('parseMoveEventData', () => {
  it('should parse WithdrawEvent data from real tx', () => {
    const withdraws = parseMoveEventData(L1_IBC_EVENTS, '0x1::fungible_asset::WithdrawEvent')
    expect(withdraws).toHaveLength(1)
    expect(withdraws[0]).toEqual({
      store_addr: '0xe3dc74d34c08f4a53d7db5f2927352b89a59afd598c90e8a3bc6cdfd44b74530',
      metadata_addr: '0x8e4733bdabcf7d4afc3d14f0dd46c9bf52fb0fce9e4b996c939e195b8bc891d9',
      amount: '1000000',
    })
  })

  it('should parse DepositEvent data', () => {
    const deposits = parseMoveEventData(L1_IBC_EVENTS, '0x1::fungible_asset::DepositEvent')
    expect(deposits).toHaveLength(1)
    expect(deposits[0].store_addr).toBe(
      '0x93cb4457860dfb64bac1d0bcba86f91cbedb65d7187db1bd0d95d75c2f49de8d'
    )
    expect(deposits[0].amount).toBe('1000000')
  })

  it('should parse owner events', () => {
    const withdrawOwners = parseMoveEventData(
      L1_IBC_EVENTS,
      '0x1::fungible_asset::WithdrawOwnerEvent'
    )
    expect(withdrawOwners).toHaveLength(1)
    expect(withdrawOwners[0].owner).toBe('0xdbd46d9c5a5de06920341de004310fea7f592cef')

    const depositOwners = parseMoveEventData(
      L1_IBC_EVENTS,
      '0x1::fungible_asset::DepositOwnerEvent'
    )
    expect(depositOwners).toHaveLength(1)
    expect(depositOwners[0].owner).toBe('0xc97c8616f66122601f023d0300e7a7091920973e')
  })

  it('should return empty array for non-matching type_tag', () => {
    expect(parseMoveEventData(L1_IBC_EVENTS, '0x1::staking::StakeEvent')).toEqual([])
  })

  it('should handle invalid JSON gracefully', () => {
    const badEvents: CosmosEvent[] = [
      {
        type: 'move',
        attributes: [
          { key: 'type_tag', value: '0x1::test::Event' },
          { key: 'data', value: 'not-json' },
        ],
      },
    ]
    const result = parseMoveEventData(badEvents, '0x1::test::Event')
    expect(result).toHaveLength(1)
    expect(result[0]._raw).toBe('not-json')
  })

  it('should handle missing data attribute', () => {
    const noData: CosmosEvent[] = [
      {
        type: 'move',
        attributes: [{ key: 'type_tag', value: '0x1::test::Event' }],
      },
    ]
    const result = parseMoveEventData(noData, '0x1::test::Event')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({})
  })
})

// ---------------------------------------------------------------------------
// parseEventLogs (viem re-export) — EVM typed log parsing
// Real data from evm-1 testnet: ERC-20 Transfer + Approval logs
// Contract: 0x2eE7007DF876084d4C74685e90bB7f4cd7c86e22 (INIT on evm-1)
// Tx: 0x3fc281bb529e620ccbb75aa231b5197bcca765e1fec702d7a9094cff8db68e97
// ---------------------------------------------------------------------------

import { parseEventLogs } from '../../../src/contracts/evm'

const ERC20_ABI = [
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Approval',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'spender', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
] as const

const EVM_LOGS = [
  {
    address: '0x2ee7007df876084d4c74685e90bb7f4cd7c86e22' as const,
    topics: [
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      '0x0000000000000000000000007de1724bfeb8fb6fcd755d7ca07a0b20e98b5ac9',
      '0x000000000000000000000000f1829676db577682e944fc3493d451b67ff3e29f',
    ] as [`0x${string}`, ...`0x${string}`[]],
    data: '0x00000000000000000000000000000000000000000000000002f5e2f52bd1c800' as `0x${string}`,
    blockNumber: 0xe0c47fn,
    transactionHash:
      '0x3fc281bb529e620ccbb75aa231b5197bcca765e1fec702d7a9094cff8db68e97' as `0x${string}`,
    transactionIndex: 1,
    blockHash:
      '0x33797346bfd77e999e1f339c1dc939719759832b9a7dfb74c38ac1b83709e64a' as `0x${string}`,
    logIndex: 0,
    removed: false,
  },
  {
    address: '0x2ee7007df876084d4c74685e90bb7f4cd7c86e22' as const,
    topics: [
      '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925',
      '0x0000000000000000000000007de1724bfeb8fb6fcd755d7ca07a0b20e98b5ac9',
      '0x0000000000000000000000007fd385d69908247436f49de2a1aff6438d75c3c0',
    ] as [`0x${string}`, ...`0x${string}`[]],
    data: '0x00000000000000000000000000000000000000000000001043561a8829300000' as `0x${string}`,
    blockNumber: 0xe0c47fn,
    transactionHash:
      '0x3fc281bb529e620ccbb75aa231b5197bcca765e1fec702d7a9094cff8db68e97' as `0x${string}`,
    transactionIndex: 1,
    blockHash:
      '0x33797346bfd77e999e1f339c1dc939719759832b9a7dfb74c38ac1b83709e64a' as `0x${string}`,
    logIndex: 1,
    removed: false,
  },
]

describe('parseEventLogs (EVM)', () => {
  it('should decode ERC-20 Transfer events from real logs', () => {
    const transfers = parseEventLogs({
      abi: ERC20_ABI,
      eventName: 'Transfer',
      logs: EVM_LOGS,
    })
    expect(transfers).toHaveLength(1)
    expect(transfers[0].eventName).toBe('Transfer')
    expect(transfers[0].args.from).toBe('0x7De1724BFEb8Fb6fcd755d7CA07a0B20e98B5Ac9')
    expect(transfers[0].args.to).toBe('0xf1829676DB577682E944fc3493d451B67Ff3E29F')
    expect(transfers[0].args.value).toBe(213326100000000000n)
  })

  it('should decode ERC-20 Approval events from real logs', () => {
    const approvals = parseEventLogs({
      abi: ERC20_ABI,
      eventName: 'Approval',
      logs: EVM_LOGS,
    })
    expect(approvals).toHaveLength(1)
    expect(approvals[0].eventName).toBe('Approval')
    expect(approvals[0].args.owner).toBe('0x7De1724BFEb8Fb6fcd755d7CA07a0B20e98B5Ac9')
    expect(approvals[0].args.spender).toBe('0x7FD385d69908247436f49de2A1AFf6438d75C3c0')
  })

  it('should decode all events when eventName is omitted', () => {
    const all = parseEventLogs({
      abi: ERC20_ABI,
      logs: EVM_LOGS,
    })
    expect(all).toHaveLength(2)
    expect(all.map(l => l.eventName)).toEqual(['Transfer', 'Approval'])
  })

  it('should return empty array for non-matching eventName', () => {
    const result = parseEventLogs({
      abi: [{ type: 'event', name: 'Mint', inputs: [] }] as const,
      logs: EVM_LOGS,
    })
    expect(result).toEqual([])
  })
})
