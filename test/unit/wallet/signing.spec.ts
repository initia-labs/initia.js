/**
 * Signing tests for ChainContext.sign() method.
 *
 * Covers Phase 5 tasks:
 * - #104: Key + direct regression
 * - #105: Key + amino sign
 * - #106: Key + eip191 signing
 * - #107: External signer + direct (mock signer)
 * - #108: External signer + amino (mock signer, signed override)
 * - #109: signMode auto-determination
 * - #110: Incompatible signer + signMode combo errors
 * - #111: createTx() + sign() separate call path
 */

import { describe, it, expect } from 'vitest'
import { create, fromBinary } from '@bufbuild/protobuf'
import { AnySchema } from '@bufbuild/protobuf/wkt'
import { buildChainContextFactory } from '../../../src/wallet/chain-context'
import { RawKey } from '../../../src/key/raw-key'
import { Message } from '../../../src/msgs/types'
import { MsgSendSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/bank/v1beta1/tx_pb'
import { UnsignedTx } from '../../../src/tx/unsigned-tx'
import type { SignModeType } from '../../../src/client/types'
import type {
  DirectSigner,
  AminoSigner,
  DirectSignDoc,
  AminoSignDoc,
} from '../../../src/signer/types'
import type { Transport } from '@connectrpc/connect'
import { base64 } from '@scure/base'
import {
  TxBodySchema,
  TxRawSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/tx/v1beta1/tx_pb'
import { ExtensionOptionQueuedTx } from '../../../src/tx/extension-options'

// ============= Fixtures =============

const mockChainInfo = {
  chainId: 'test-1',
  chainName: 'Test Chain',
  chainType: 'initia' as const,
  network: 'testnet' as const,
  bech32Prefix: 'init',
}

// Dummy transport — sign() never makes gRPC calls
const mockTransport = {} as Transport

const createChainContext = buildChainContextFactory(
  () => mockTransport,
  () => ({}),
  () => ({}) as never
)

// Deterministic test key (0x00...01)
const testKey = RawKey.fromHex('0000000000000000000000000000000000000000000000000000000000000001')

// ============= Helpers =============

function createTestTx(signMode: SignModeType = 'direct'): UnsignedTx {
  return new UnsignedTx({
    msgs: [
      new Message(MsgSendSchema, {
        fromAddress: testKey.address,
        toAddress: 'init1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq5qnc04y',
        amount: [{ denom: 'uinit', amount: '1000000' }],
      }),
    ],
    signMode,
    chainId: 'test-1',
    accountNumber: 1n,
    sequence: 0n,
    fee: [{ denom: 'uinit', amount: '1000' }],
    gasLimit: 200000n,
    memo: '',
  })
}

function createMockDirectSigner(): DirectSigner {
  const pubKey = testKey.publicKey
  return {
    algorithm: 'eth_secp256k1',
    getPublicKey: async () => pubKey,
    getAddress: async () => testKey.address,
    signDirect: async (_addr: string, signDoc: DirectSignDoc) => ({
      signed: signDoc,
      signature: {
        pubKey: {
          typeUrl: '/cosmos.crypto.secp256k1.PubKey',
          value: pubKey,
        },
        signature: new Uint8Array(64),
      },
    }),
  }
}

function createMockAminoSigner(feeOverride?: {
  amount: { denom: string; amount: string }[]
  gas: string
}): AminoSigner {
  const pubKey = testKey.publicKey
  return {
    algorithm: 'eth_secp256k1',
    getPublicKey: async () => pubKey,
    getAddress: async () => testKey.address,
    signAmino: async (_addr: string, signDoc: AminoSignDoc) => ({
      signed: feeOverride ? { ...signDoc, fee: feeOverride } : signDoc,
      signature: {
        pub_key: {
          type: 'tendermint/PubKeySecp256k1',
          value: base64.encode(pubKey),
        },
        signature: base64.encode(new Uint8Array(64)),
      },
    }),
  }
}

function createMockOfflineSigner(): DirectSigner & AminoSigner {
  const direct = createMockDirectSigner()
  const amino = createMockAminoSigner()
  return {
    ...direct,
    signAmino: amino.signAmino,
  }
}

// ============= #104: Key + direct regression =============

describe('Key + direct signing (#104)', () => {
  it('should produce valid txBytes', async () => {
    const ctx = createChainContext(mockChainInfo, {
      signer: testKey,
      transport: mockTransport,
    })
    const tx = createTestTx('direct')
    const signed = await ctx.sign(tx)

    expect(signed.txBytes).toBeInstanceOf(Uint8Array)
    expect(signed.txBytes.length).toBeGreaterThan(0)
  })

  it('should produce deterministic output for same input', async () => {
    const ctx = createChainContext(mockChainInfo, {
      signer: testKey,
      transport: mockTransport,
    })
    const tx1 = createTestTx('direct')
    const tx2 = createTestTx('direct')

    const signed1 = await ctx.sign(tx1)
    const signed2 = await ctx.sign(tx2)

    expect(signed1.txBytes).toEqual(signed2.txBytes)
  })
})

// ============= #105: Key + amino signing =============

describe('Key + amino signing (#105)', () => {
  it('should produce valid txBytes', async () => {
    const ctx = createChainContext(mockChainInfo, {
      signer: testKey,
      transport: mockTransport,
    })
    const tx = createTestTx('amino')
    const signed = await ctx.sign(tx)

    expect(signed.txBytes).toBeInstanceOf(Uint8Array)
    expect(signed.txBytes.length).toBeGreaterThan(0)
  })

  it('should produce different txBytes from direct mode', async () => {
    const ctx = createChainContext(mockChainInfo, {
      signer: testKey,
      transport: mockTransport,
    })
    const directSigned = await ctx.sign(createTestTx('direct'))
    const aminoSigned = await ctx.sign(createTestTx('amino'))

    // Different sign modes produce different signatures
    expect(directSigned.txBytes).not.toEqual(aminoSigned.txBytes)
  })
})

// ============= #106: Key + eip191 signing =============

describe('Key + eip191 signing (#106)', () => {
  it('should produce valid txBytes', async () => {
    const ctx = createChainContext(mockChainInfo, {
      signer: testKey,
      transport: mockTransport,
    })
    const tx = createTestTx('eip191')
    const signed = await ctx.sign(tx)

    expect(signed.txBytes).toBeInstanceOf(Uint8Array)
    expect(signed.txBytes.length).toBeGreaterThan(0)
  })

  it('should produce different signature from amino mode', async () => {
    const ctx = createChainContext(mockChainInfo, {
      signer: testKey,
      transport: mockTransport,
    })
    const aminoSigned = await ctx.sign(createTestTx('amino'))
    const eip191Signed = await ctx.sign(createTestTx('eip191'))

    // eip191 uses keccak256 while amino uses sha256 — different signatures
    expect(aminoSigned.txBytes).not.toEqual(eip191Signed.txBytes)
  })
})

// ============= #107: External signer + direct =============

describe('External signer + direct signing (#107)', () => {
  it('should produce valid txBytes via mock DirectSigner', async () => {
    const signer = createMockDirectSigner()
    const ctx = createChainContext(mockChainInfo, {
      signer,
      transport: mockTransport,
    })
    const tx = createTestTx('direct')
    const signed = await ctx.sign(tx)

    expect(signed.txBytes).toBeInstanceOf(Uint8Array)
    expect(signed.txBytes.length).toBeGreaterThan(0)
  })
})

// ============= #108: External signer + amino (with signed override) =============

describe('External signer + amino signing (#108)', () => {
  it('should produce valid txBytes via mock AminoSigner', async () => {
    const signer = createMockAminoSigner()
    const ctx = createChainContext(mockChainInfo, {
      signer,
      transport: mockTransport,
    })
    const tx = createTestTx('amino')
    const signed = await ctx.sign(tx)

    expect(signed.txBytes).toBeInstanceOf(Uint8Array)
    expect(signed.txBytes.length).toBeGreaterThan(0)
  })

  it('should use signer-modified fee (Keplr override)', async () => {
    const overriddenFee = {
      amount: [{ denom: 'uinit', amount: '5000' }],
      gas: '500000',
    }
    const signer = createMockAminoSigner(overriddenFee)
    const ctx = createChainContext(mockChainInfo, {
      signer,
      transport: mockTransport,
    })

    const txOriginal = createTestTx('amino')
    const signed = await ctx.sign(txOriginal)

    // Verify the signing succeeds with overridden fee
    expect(signed.txBytes).toBeInstanceOf(Uint8Array)
    expect(signed.txBytes.length).toBeGreaterThan(0)

    // Compare with non-overridden: the txBytes should differ
    // because AuthInfo contains the overridden fee
    const signerNoOverride = createMockAminoSigner()
    const ctxNoOverride = createChainContext(mockChainInfo, {
      signer: signerNoOverride,
      transport: mockTransport,
    })
    const signedNoOverride = await ctxNoOverride.sign(createTestTx('amino'))

    expect(signed.txBytes).not.toEqual(signedNoOverride.txBytes)
  })

  it('preserves TxBody extension options and timeout height in final tx bytes', async () => {
    const signer = createMockAminoSigner()
    const originalSignAmino = signer.signAmino
    let capturedSignDoc: AminoSignDoc | undefined
    signer.signAmino = async (addr, signDoc) => {
      capturedSignDoc = signDoc
      return originalSignAmino(addr, signDoc)
    }
    const ctx = createChainContext(mockChainInfo, {
      signer,
      transport: mockTransport,
    })
    const nonCritical = create(AnySchema, {
      typeUrl: '/example.NonCritical',
      value: new Uint8Array([4, 5, 6]),
    })
    const tx = new UnsignedTx({
      msgs: [
        new Message(MsgSendSchema, {
          fromAddress: testKey.address,
          toAddress: 'init1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq5qnc04y',
          amount: [{ denom: 'uinit', amount: '1000000' }],
        }),
      ],
      signMode: 'amino',
      chainId: 'test-1',
      accountNumber: 1n,
      sequence: 0n,
      fee: [{ denom: 'uinit', amount: '1000' }],
      gasLimit: 200000n,
      memo: 'amino-extension',
      timeoutHeight: 99n,
      extensionOptions: [ExtensionOptionQueuedTx.packAny()],
      nonCriticalExtensionOptions: [nonCritical],
    })

    const signed = await ctx.sign(tx)
    const txRaw = fromBinary(TxRawSchema, signed.txBytes)
    const body = fromBinary(TxBodySchema, txRaw.bodyBytes)

    expect(capturedSignDoc?.chain_id).toBe('test-1')
    expect(capturedSignDoc?.account_number).toBe('1')
    expect(capturedSignDoc?.sequence).toBe('0')
    expect(capturedSignDoc?.memo).toBe('amino-extension')
    expect(capturedSignDoc?.timeout_height).toBe('99')
    expect(capturedSignDoc?.fee).toEqual({
      amount: [{ denom: 'uinit', amount: '1000' }],
      gas: '200000',
    })
    expect(capturedSignDoc?.msgs[0].type).toBe('cosmos-sdk/MsgSend')
    expect(body.timeoutHeight).toBe(99n)
    expect(body.extensionOptions.map(o => o.typeUrl)).toEqual([
      '/initia.tx.v1.ExtensionOptionQueuedTx',
    ])
    expect(body.nonCriticalExtensionOptions.map(o => o.typeUrl)).toEqual(['/example.NonCritical'])
  })

  it('uses signer-modified timeout height in final tx bytes', async () => {
    const signer = createMockAminoSigner()
    const originalSignAmino = signer.signAmino
    signer.signAmino = async (addr, signDoc) => {
      const response = await originalSignAmino(addr, signDoc)
      return {
        ...response,
        signed: {
          ...response.signed,
          timeout_height: '123',
        },
      }
    }
    const ctx = createChainContext(mockChainInfo, {
      signer,
      transport: mockTransport,
    })
    const tx = createTestTx('amino')

    const signed = await ctx.sign(tx)
    const txRaw = fromBinary(TxRawSchema, signed.txBytes)
    const body = fromBinary(TxBodySchema, txRaw.bodyBytes)

    expect(body.timeoutHeight).toBe(123n)
  })
})

// ============= #109: signMode auto-determination =============

describe('signMode auto-determination (#109)', () => {
  it('Key defaults to direct — sign succeeds with direct', async () => {
    const ctx = createChainContext(mockChainInfo, {
      signer: testKey,
      transport: mockTransport,
    })
    const signed = await ctx.sign(createTestTx('direct'))
    expect(signed.txBytes.length).toBeGreaterThan(0)
  })

  it('AminoSigner-only context works with amino signMode', async () => {
    const signer = createMockAminoSigner()
    const ctx = createChainContext(mockChainInfo, {
      signer,
      transport: mockTransport,
    })
    const signed = await ctx.sign(createTestTx('amino'))
    expect(signed.txBytes.length).toBeGreaterThan(0)
  })

  it('DirectSigner-only context works with direct signMode', async () => {
    const signer = createMockDirectSigner()
    const ctx = createChainContext(mockChainInfo, {
      signer,
      transport: mockTransport,
    })
    const signed = await ctx.sign(createTestTx('direct'))
    expect(signed.txBytes.length).toBeGreaterThan(0)
  })

  it('OfflineSigner context works with both direct and amino', async () => {
    const signer = createMockOfflineSigner()
    const ctx = createChainContext(mockChainInfo, {
      signer,
      transport: mockTransport,
    })

    const directSigned = await ctx.sign(createTestTx('direct'))
    expect(directSigned.txBytes.length).toBeGreaterThan(0)

    const aminoSigned = await ctx.sign(createTestTx('amino'))
    expect(aminoSigned.txBytes.length).toBeGreaterThan(0)
  })
})

// ============= #110: Incompatible signer + signMode combo errors =============

describe('Incompatible signer + signMode combo errors (#110)', () => {
  it('should throw when AminoSigner-only used with direct signMode', async () => {
    const signer = createMockAminoSigner()
    const ctx = createChainContext(mockChainInfo, {
      signer,
      transport: mockTransport,
    })
    await expect(ctx.sign(createTestTx('direct'))).rejects.toThrow(
      'does not support direct signing'
    )
  })

  it('should throw when DirectSigner-only used with amino signMode', async () => {
    const signer = createMockDirectSigner()
    const ctx = createChainContext(mockChainInfo, {
      signer,
      transport: mockTransport,
    })
    await expect(ctx.sign(createTestTx('amino'))).rejects.toThrow('does not support amino signing')
  })

  it('should throw when external signer used with eip191 signMode', async () => {
    const signer = createMockDirectSigner()
    const ctx = createChainContext(mockChainInfo, {
      signer,
      transport: mockTransport,
    })
    await expect(ctx.sign(createTestTx('eip191'))).rejects.toThrow(
      'does not support EIP-191 signing'
    )
  })

  it('should throw when no signer provided', async () => {
    const ctx = createChainContext(mockChainInfo, { transport: mockTransport })
    await expect(ctx.sign(createTestTx('direct'))).rejects.toThrow('Cannot sign')
  })
})

// ============= #111: createTx() + sign() separate call path =============

describe('createTx() + sign() separate call path (#111)', () => {
  it('should sign a manually constructed UnsignedTx (simulates createTx output)', async () => {
    const ctx = createChainContext(mockChainInfo, {
      signer: testKey,
      transport: mockTransport,
    })

    // Simulate createTx() output with all fields populated
    const unsignedTx = new UnsignedTx({
      msgs: [
        new Message(MsgSendSchema, {
          fromAddress: testKey.address,
          toAddress: 'init1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq5qnc04y',
          amount: [{ denom: 'uinit', amount: '500000' }],
        }),
      ],
      signMode: 'amino',
      chainId: 'test-1',
      accountNumber: 42n,
      sequence: 7n,
      fee: [{ denom: 'uinit', amount: '2500' }],
      gasLimit: 300000n,
      memo: 'test memo',
    })

    const signed = await ctx.sign(unsignedTx)
    expect(signed.txBytes).toBeInstanceOf(Uint8Array)
    expect(signed.txBytes.length).toBeGreaterThan(0)
  })

  it('should work with one-time signer override', async () => {
    const ctx = createChainContext(mockChainInfo, { transport: mockTransport })

    const unsignedTx = createTestTx('direct')
    const signed = await ctx.sign(unsignedTx, { signer: testKey })
    expect(signed.txBytes).toBeInstanceOf(Uint8Array)
    expect(signed.txBytes.length).toBeGreaterThan(0)
  })
})
