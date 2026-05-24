import { describe, expect, it } from 'vitest'
import { create } from '@bufbuild/protobuf'
import { AnySchema } from '@bufbuild/protobuf/wkt'
import { fromBinary } from '@bufbuild/protobuf'
import type { Transport } from '@connectrpc/connect'
import {
  TxBodySchema,
  TxRawSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/tx/v1beta1/tx_pb'
import {
  BroadcastTxResponseSchema,
  Service as TxService,
  SimulateResponseSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/tx/v1beta1/service_pb'
import {
  GasInfoSchema,
  TxResponseSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/base/abci/v1beta1/abci_pb'
import {
  Query as AuthQuery,
  QueryAccountResponseSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/auth/v1beta1/query_pb'
import { BaseAccountSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/auth/v1beta1/auth_pb'
import { MsgSendSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/bank/v1beta1/tx_pb'
import { buildChainContextFactory } from '../../../src/wallet/chain-context'
import { RawKey } from '../../../src/key/raw-key'
import { Message } from '../../../src/msgs'
import { ExtensionOptionQueuedTx } from '../../../src/tx/extension-options'
import { anyPack } from '../../../src/util/any'

const testKey = RawKey.fromHex('0000000000000000000000000000000000000000000000000000000000000001')

const chainInfo = {
  chainId: 'test-1',
  chainName: 'Test Chain',
  chainType: 'initia' as const,
  network: 'testnet' as const,
  bech32Prefix: 'init',
}

const emptyTransport = {} as Transport
const createLocalContext = buildChainContextFactory(
  () => emptyTransport,
  () => ({}),
  () => ({}) as never
)

function sendMsg(): Message<typeof MsgSendSchema> {
  return new Message(MsgSendSchema, {
    fromAddress: testKey.address,
    toAddress: 'init1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq5qnc04y',
    amount: [{ denom: 'uinit', amount: '1000' }],
  })
}

function nonCriticalAny() {
  return create(AnySchema, {
    typeUrl: '/example.NonCritical',
    value: new Uint8Array([4, 5, 6]),
  })
}

function decodeBody(txBytes: Uint8Array) {
  const txRaw = fromBinary(TxRawSchema, txBytes)
  return fromBinary(TxBodySchema, txRaw.bodyBytes)
}

describe('ChainContext.createTx extension options', () => {
  it('stores timeout height and both extension option arrays', async () => {
    const ctx = createLocalContext(chainInfo, { signer: testKey, transport: emptyTransport })
    const extensionOptions = [ExtensionOptionQueuedTx.packAny()]
    const nonCriticalExtensionOptions = [nonCriticalAny()]

    const tx = await ctx.createTx([sendMsg()], {
      accountNumber: 1n,
      sequence: 2n,
      timeoutHeight: 55n,
      extensionOptions,
      nonCriticalExtensionOptions,
    })

    expect(tx.timeoutHeight).toBe(55n)
    expect(tx.extensionOptions.map(o => o.typeUrl)).toEqual([
      '/initia.tx.v1.ExtensionOptionQueuedTx',
    ])
    expect(tx.nonCriticalExtensionOptions.map(o => o.typeUrl)).toEqual(['/example.NonCritical'])
  })

  it('defaults both extension option arrays to empty arrays', async () => {
    const ctx = createLocalContext(chainInfo, { signer: testKey, transport: emptyTransport })

    const tx = await ctx.createTx([sendMsg()], {
      accountNumber: 1n,
      sequence: 2n,
    })

    expect(tx.extensionOptions).toEqual([])
    expect(tx.nonCriticalExtensionOptions).toEqual([])
  })

  it('defensively copies extension option arrays', async () => {
    const ctx = createLocalContext(chainInfo, { signer: testKey, transport: emptyTransport })
    const extensionOptions = [ExtensionOptionQueuedTx.packAny()]
    const nonCriticalExtensionOptions = [nonCriticalAny()]

    const tx = await ctx.createTx([sendMsg()], {
      accountNumber: 1n,
      sequence: 2n,
      extensionOptions,
      nonCriticalExtensionOptions,
    })
    extensionOptions.push(nonCriticalAny())
    nonCriticalExtensionOptions.push(ExtensionOptionQueuedTx.packAny())

    expect(tx.extensionOptions.map(o => o.typeUrl)).toEqual([
      '/initia.tx.v1.ExtensionOptionQueuedTx',
    ])
    expect(tx.nonCriticalExtensionOptions.map(o => o.typeUrl)).toEqual(['/example.NonCritical'])
  })
})

describe('ChainContext.sign extension options', () => {
  it('preserves extension options in direct signing body bytes', async () => {
    const ctx = createLocalContext(chainInfo, { signer: testKey, transport: emptyTransport })
    const tx = await ctx.createTx([sendMsg()], {
      accountNumber: 1n,
      sequence: 2n,
      fee: [{ denom: 'uinit', amount: '1' }],
      gasLimit: 200000n,
      signMode: 'direct',
      timeoutHeight: 66n,
      extensionOptions: [ExtensionOptionQueuedTx.packAny()],
      nonCriticalExtensionOptions: [nonCriticalAny()],
    })

    const signed = await ctx.sign(tx)
    const body = decodeBody(signed.txBytes)

    expect(body.timeoutHeight).toBe(66n)
    expect(body.extensionOptions.map(o => o.typeUrl)).toEqual([
      '/initia.tx.v1.ExtensionOptionQueuedTx',
    ])
    expect(body.nonCriticalExtensionOptions.map(o => o.typeUrl)).toEqual(['/example.NonCritical'])
  })

  it('preserves extension options in EIP-191 final body bytes', async () => {
    let capturedPersonalBytes: Uint8Array | undefined
    const signer = {
      algorithm: 'eth_secp256k1' as const,
      getPublicKey: async () => testKey.publicKey,
      getAddress: async () => testKey.address,
      signDirect: async () => {
        throw new Error('signDirect should not be called')
      },
      signPersonal: async (data: Uint8Array) => {
        capturedPersonalBytes = data
        return new Uint8Array(64)
      },
    }
    const ctx = createLocalContext(chainInfo, { signer, transport: emptyTransport })
    const tx = await ctx.createTx([sendMsg()], {
      accountNumber: 1n,
      sequence: 2n,
      fee: [{ denom: 'uinit', amount: '1' }],
      gasLimit: 200000n,
      signMode: 'eip191',
      timeoutHeight: 77n,
      extensionOptions: [ExtensionOptionQueuedTx.packAny()],
      nonCriticalExtensionOptions: [nonCriticalAny()],
    })

    const signed = await ctx.sign(tx)
    const body = decodeBody(signed.txBytes)
    const signedJson = JSON.parse(new TextDecoder().decode(capturedPersonalBytes)) as {
      timeout_height?: string
    }

    expect(signedJson.timeout_height).toBe('77')
    expect(body.timeoutHeight).toBe(77n)
    expect(body.extensionOptions.map(o => o.typeUrl)).toEqual([
      '/initia.tx.v1.ExtensionOptionQueuedTx',
    ])
    expect(body.nonCriticalExtensionOptions.map(o => o.typeUrl)).toEqual(['/example.NonCritical'])
  })
})

describe('ChainContext.signAndBroadcast extension options', () => {
  it('preserves timeout height and extension options when explicit fee skips auto gas', async () => {
    let capturedBroadcastTxBytes: Uint8Array | undefined
    const transport = {
      async unary(method, _signal, _timeoutMs, _header, input) {
        if (method.localName === 'account') {
          return {
            stream: false,
            service: method.parent,
            method,
            header: new Headers(),
            trailer: new Headers(),
            message: create(QueryAccountResponseSchema, {
              account: anyPack(
                BaseAccountSchema,
                create(BaseAccountSchema, {
                  address: testKey.address,
                  accountNumber: 1n,
                  sequence: 2n,
                })
              ),
            }),
          }
        }
        if (method.localName === 'simulate') {
          throw new Error('simulate should not be called when fee is explicit')
        }
        if (method.localName === 'broadcastTx') {
          capturedBroadcastTxBytes = (input as { txBytes: Uint8Array }).txBytes
          return {
            stream: false,
            service: method.parent,
            method,
            header: new Headers(),
            trailer: new Headers(),
            message: create(BroadcastTxResponseSchema, {
              txResponse: create(TxResponseSchema, {
                txhash: 'ABC123',
                code: 0,
                gasUsed: 100000n,
                rawLog: '',
              }),
            }),
          }
        }
        throw new Error(`unexpected method ${method.localName}`)
      },
      async stream() {
        throw new Error('stream should not be called')
      },
    } as Transport
    const createContext = buildChainContextFactory(
      () => transport,
      () => ({ auth: AuthQuery, tx: TxService }),
      () => ({}) as never
    )
    const ctx = createContext(chainInfo, { signer: testKey, transport })

    await ctx.signAndBroadcast([sendMsg()], {
      fee: [{ denom: 'uinit', amount: '1500' }],
      gasLimit: 200000n,
      timeoutHeight: 87n,
      extensionOptions: [ExtensionOptionQueuedTx.packAny()],
      nonCriticalExtensionOptions: [nonCriticalAny()],
    })

    expect(capturedBroadcastTxBytes).toBeInstanceOf(Uint8Array)
    const broadcastBody = decodeBody(capturedBroadcastTxBytes!)
    expect(broadcastBody.timeoutHeight).toBe(87n)
    expect(broadcastBody.extensionOptions.map(o => o.typeUrl)).toEqual([
      '/initia.tx.v1.ExtensionOptionQueuedTx',
    ])
    expect(broadcastBody.nonCriticalExtensionOptions.map(o => o.typeUrl)).toEqual([
      '/example.NonCritical',
    ])
  })

  it('forwards timeout height and extension options into auto gas simulation', async () => {
    let capturedSimulateInput: unknown
    let capturedBroadcastTxBytes: Uint8Array | undefined
    const transport = {
      async unary(method, _signal, _timeoutMs, _header, input) {
        if (method.localName === 'account') {
          return {
            stream: false,
            service: method.parent,
            method,
            header: new Headers(),
            trailer: new Headers(),
            message: create(QueryAccountResponseSchema, {
              account: anyPack(
                BaseAccountSchema,
                create(BaseAccountSchema, {
                  address: testKey.address,
                  accountNumber: 1n,
                  sequence: 2n,
                })
              ),
            }),
          }
        }
        if (method.localName === 'simulate') {
          capturedSimulateInput = input
          return {
            stream: false,
            service: method.parent,
            method,
            header: new Headers(),
            trailer: new Headers(),
            message: create(SimulateResponseSchema, {
              gasInfo: create(GasInfoSchema, { gasUsed: 100000n, gasWanted: 100000n }),
            }),
          }
        }
        if (method.localName === 'broadcastTx') {
          capturedBroadcastTxBytes = (input as { txBytes: Uint8Array }).txBytes
          return {
            stream: false,
            service: method.parent,
            method,
            header: new Headers(),
            trailer: new Headers(),
            message: create(BroadcastTxResponseSchema, {
              txResponse: create(TxResponseSchema, {
                txhash: 'ABC123',
                code: 0,
                gasUsed: 100000n,
                rawLog: '',
              }),
            }),
          }
        }
        throw new Error(`unexpected method ${method.localName}`)
      },
      async stream() {
        throw new Error('stream should not be called')
      },
    } as Transport
    const createContext = buildChainContextFactory(
      () => transport,
      () => ({ auth: AuthQuery, tx: TxService }),
      () => ({}) as never
    )
    const ctx = createContext(chainInfo, { signer: testKey, transport })

    await ctx.signAndBroadcast([sendMsg()], {
      gasPrice: '0.015uinit',
      timeoutHeight: 88n,
      extensionOptions: [ExtensionOptionQueuedTx.packAny()],
      nonCriticalExtensionOptions: [nonCriticalAny()],
    })

    const simulatedTx = (capturedSimulateInput as { tx?: { body?: unknown } }).tx
    const body = simulatedTx?.body as {
      timeoutHeight?: bigint
      extensionOptions?: Array<{ typeUrl: string }>
      nonCriticalExtensionOptions?: Array<{ typeUrl: string }>
    }
    expect(body.timeoutHeight).toBe(88n)
    expect(body.extensionOptions?.map(o => o.typeUrl)).toEqual([
      '/initia.tx.v1.ExtensionOptionQueuedTx',
    ])
    expect(body.nonCriticalExtensionOptions?.map(o => o.typeUrl)).toEqual(['/example.NonCritical'])

    expect(capturedBroadcastTxBytes).toBeInstanceOf(Uint8Array)
    const broadcastBody = decodeBody(capturedBroadcastTxBytes!)
    expect(broadcastBody.timeoutHeight).toBe(88n)
    expect(broadcastBody.extensionOptions.map(o => o.typeUrl)).toEqual([
      '/initia.tx.v1.ExtensionOptionQueuedTx',
    ])
    expect(broadcastBody.nonCriticalExtensionOptions.map(o => o.typeUrl)).toEqual([
      '/example.NonCritical',
    ])
  })
})
