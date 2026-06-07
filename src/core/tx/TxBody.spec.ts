import { describe, expect, it } from 'vitest'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { TxBody as TxBody_pb } from '@initia/initia.proto/cosmos/tx/v1beta1/tx'
import { Tx, TxBody, ExtensionOptionQueuedTx } from './index'

describe('TxBody extension options', () => {
  it('preserves extension options from proto to proto', () => {
    const extensionOption = ExtensionOptionQueuedTx.packAny()
    const proto = TxBody_pb.fromPartial({
      memo: 'queued',
      messages: [],
      extensionOptions: [extensionOption],
    })

    const txBody = TxBody.fromProto(proto)
    const roundtrip = txBody.toProto()

    expect(roundtrip.extensionOptions).toHaveLength(1)
    expect(roundtrip.extensionOptions[0].typeUrl).toBe(
      '/initia.tx.v1.ExtensionOptionQueuedTx'
    )
  })

  it('preserves non-critical extension options from proto to proto', () => {
    const extensionOption = Any.fromPartial({
      typeUrl: '/example.NonCritical',
      value: new Uint8Array([1, 2, 3]),
    })
    const proto = TxBody_pb.fromPartial({
      memo: 'non-critical',
      messages: [],
      nonCriticalExtensionOptions: [extensionOption],
    })

    const txBody = TxBody.fromProto(proto)
    const roundtrip = txBody.toProto()

    expect(roundtrip.nonCriticalExtensionOptions).toHaveLength(1)
    expect(roundtrip.nonCriticalExtensionOptions[0].typeUrl).toBe(
      '/example.NonCritical'
    )
    expect([...roundtrip.nonCriticalExtensionOptions[0].value]).toEqual([
      1, 2, 3,
    ])
  })
})

describe('TxBody timeout_height parsing', () => {
  it('TxBody.fromData defaults a missing timeout_height to 0 (not NaN)', () => {
    const data = { messages: [], memo: 'x' } as unknown as TxBody.Data
    expect(TxBody.fromData(data).toData().timeout_height).toBe('0')
  })

  it('Tx.fromAmino defaults a missing timeout_height to 0 (not NaN)', () => {
    const amino = {
      type: 'cosmos-sdk/StdTx',
      value: { msg: [], fee: { gas: '0', amount: [] }, signatures: [], memo: '' },
    } as unknown as Tx.Amino
    expect(Tx.fromAmino(amino).body.toData().timeout_height).toBe('0')
  })
})
