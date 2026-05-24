import { describe, expect, it } from 'vitest'
import { create, fromBinary } from '@bufbuild/protobuf'
import { AnySchema } from '@bufbuild/protobuf/wkt'
import { TxBodySchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/tx/v1beta1/tx_pb'
import { ExtensionOptionQueuedTxSchema } from '@buf/initia-labs_initia.bufbuild_es/initia/tx/v1/tx_pb'
import { Message } from '../../../src/msgs'
import { UnsignedTx } from '../../../src/tx/unsigned-tx'
import { encodeTxDirect } from '../../../src/tx/sign'
import { ExtensionOptionQueuedTx } from '../../../src/tx/extension-options'
import { ExtensionOptionQueuedTx as TxExportedExtensionOptionQueuedTx } from '../../../src/tx'
import { ExtensionOptionQueuedTx as RootExportedExtensionOptionQueuedTx } from '../../../src'

describe('ExtensionOptionQueuedTx', () => {
  it('packs the generated queued tx extension option as a Cosmos Any', () => {
    const any = ExtensionOptionQueuedTx.packAny()

    expect(any.typeUrl).toBe('/initia.tx.v1.ExtensionOptionQueuedTx')
    expect(fromBinary(ExtensionOptionQueuedTxSchema, any.value).$typeName).toBe(
      'initia.tx.v1.ExtensionOptionQueuedTx'
    )
  })

  it('is exported from root and tx entry surfaces', () => {
    expect(ExtensionOptionQueuedTx.TYPE_URL).toBe('/initia.tx.v1.ExtensionOptionQueuedTx')
    expect(TxExportedExtensionOptionQueuedTx.TYPE_URL).toBe(ExtensionOptionQueuedTx.TYPE_URL)
    expect(RootExportedExtensionOptionQueuedTx.packAny().typeUrl).toBe(
      ExtensionOptionQueuedTx.TYPE_URL
    )
  })
})

describe('encodeTxDirect', () => {
  it('preserves TxBody timeout height and both extension option arrays', () => {
    const opaqueMsg = Message.fromAny(
      create(AnySchema, {
        typeUrl: '/example.Msg',
        value: new Uint8Array([1, 2, 3]),
      })
    )
    const nonCritical = create(AnySchema, {
      typeUrl: '/example.NonCritical',
      value: new Uint8Array([4, 5, 6]),
    })
    const tx = new UnsignedTx({
      msgs: [opaqueMsg],
      signMode: 'direct',
      chainId: 'initiation-2',
      accountNumber: 7n,
      sequence: 8n,
      fee: [],
      gasLimit: 200000n,
      memo: 'queued',
      timeoutHeight: 99n,
      extensionOptions: [ExtensionOptionQueuedTx.packAny()],
      nonCriticalExtensionOptions: [nonCritical],
    })

    const { bodyBytes } = encodeTxDirect(tx, new Uint8Array(33).fill(2), 'secp256k1')
    const body = fromBinary(TxBodySchema, bodyBytes)

    expect(body.timeoutHeight).toBe(99n)
    expect(body.extensionOptions.map(o => o.typeUrl)).toEqual([
      '/initia.tx.v1.ExtensionOptionQueuedTx',
    ])
    expect(body.nonCriticalExtensionOptions.map(o => o.typeUrl)).toEqual(['/example.NonCritical'])
  })
})
