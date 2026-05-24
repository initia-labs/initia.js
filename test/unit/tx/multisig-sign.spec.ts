import { describe, it, expect } from 'vitest'
import { Coin } from '../../../src/core/coin'
import { createSignedTx, makeSignBytes } from '../../../src/tx/sign'
import { MultisigPublicKey, MultiSignature } from '../../../src/key/multisig'
import { RawKey } from '../../../src/key/raw-key'
import { UnsignedTx } from '../../../src/tx/unsigned-tx'
import { create, fromBinary, toBinary } from '@bufbuild/protobuf'
import { AnySchema } from '@bufbuild/protobuf/wkt'
import {
  TxBodySchema,
  AuthInfoSchema,
  FeeSchema,
  SignDocSchema,
  TxRawSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/tx/v1beta1/tx_pb'
import { MultiSignatureSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/crypto/multisig/v1beta1/multisig_pb'
import { ExtensionOptionQueuedTx } from '../../../src/tx/extension-options'

describe('createSignedTx', () => {
  it('should create TxRaw from multisig components', () => {
    const keys = [
      RawKey.fromHex('0x0000000000000000000000000000000000000000000000000000000000000001'),
      RawKey.fromHex('0x0000000000000000000000000000000000000000000000000000000000000002'),
      RawKey.fromHex('0x0000000000000000000000000000000000000000000000000000000000000003'),
    ]
    const pubKeys = keys.map(k => k.publicKey)
    const mpk = new MultisigPublicKey(2, pubKeys)

    const body = create(TxBodySchema, { messages: [], memo: 'multisig-test' })
    const fee = create(FeeSchema, { amount: [], gasLimit: 200000n })
    const authInfo = create(AuthInfoSchema, { signerInfos: [], fee })

    const ms = new MultiSignature(mpk)
    ms.appendSignature(0, new Uint8Array(64))
    ms.appendSignature(1, new Uint8Array(64))

    const txRaw = createSignedTx(body, authInfo, mpk, ms, 0)
    expect(txRaw.bodyBytes).toBeInstanceOf(Uint8Array)
    expect(txRaw.authInfoBytes).toBeInstanceOf(Uint8Array)
    expect(txRaw.signatures).toHaveLength(1) // single multisig signature blob
    expect(txRaw.bodyBytes.length).toBeGreaterThan(0)
    expect(txRaw.authInfoBytes.length).toBeGreaterThan(0)
  })

  it('should not mutate the input authInfo', () => {
    const keys = [
      RawKey.fromHex('0x0000000000000000000000000000000000000000000000000000000000000001'),
      RawKey.fromHex('0x0000000000000000000000000000000000000000000000000000000000000002'),
    ]
    const pubKeys = keys.map(k => k.publicKey)
    const mpk = new MultisigPublicKey(2, pubKeys)

    const fee = create(FeeSchema, { amount: [], gasLimit: 100000n })
    const authInfo = create(AuthInfoSchema, { signerInfos: [], fee })

    const ms = new MultiSignature(mpk)
    ms.appendSignature(0, new Uint8Array(64))
    ms.appendSignature(1, new Uint8Array(64))

    createSignedTx(create(TxBodySchema, {}), authInfo, mpk, ms, 0)

    // Original authInfo should still have empty signerInfos
    expect(authInfo.signerInfos).toHaveLength(0)
  })

  it('should include one SignerInfo with the multisig public key in authInfoBytes', () => {
    const keys = [
      RawKey.fromHex('0x0000000000000000000000000000000000000000000000000000000000000001'),
      RawKey.fromHex('0x0000000000000000000000000000000000000000000000000000000000000002'),
    ]
    const pubKeys = keys.map(k => k.publicKey)
    const mpk = new MultisigPublicKey(2, pubKeys)

    const body = create(TxBodySchema, { messages: [], memo: 'hello' })
    const fee = create(FeeSchema, { amount: [], gasLimit: 100000n })
    const authInfo = create(AuthInfoSchema, { signerInfos: [], fee })

    const ms = new MultiSignature(mpk)
    ms.appendSignature(0, new Uint8Array(64))
    ms.appendSignature(1, new Uint8Array(64))

    const txRaw = createSignedTx(body, authInfo, mpk, ms, 0)

    // Decode the authInfoBytes and verify it contains exactly one SignerInfo
    const decodedAuthInfo = fromBinary(AuthInfoSchema, txRaw.authInfoBytes)
    expect(decodedAuthInfo.signerInfos).toHaveLength(1)
    expect(decodedAuthInfo.signerInfos[0].publicKey?.typeUrl).toBe(
      '/cosmos.crypto.multisig.LegacyAminoPubKey'
    )
  })

  it('should produce non-empty signature bytes from MultiSignature', () => {
    const keys = [
      RawKey.fromHex('0x0000000000000000000000000000000000000000000000000000000000000001'),
      RawKey.fromHex('0x0000000000000000000000000000000000000000000000000000000000000002'),
    ]
    const pubKeys = keys.map(k => k.publicKey)
    const mpk = new MultisigPublicKey(2, pubKeys)

    const body = create(TxBodySchema, {})
    const authInfo = create(AuthInfoSchema, {
      fee: create(FeeSchema, { gasLimit: 50000n }),
    })

    const ms = new MultiSignature(mpk)
    ms.appendSignature(0, new Uint8Array(64).fill(0xab))
    ms.appendSignature(1, new Uint8Array(64).fill(0xcd))

    const txRaw = createSignedTx(body, authInfo, mpk, ms, 0)
    expect(txRaw.signatures[0].length).toBeGreaterThan(0)
  })
})

describe('createSignedTx fee preservation', () => {
  it('should preserve fee in authInfoBytes', () => {
    const keys = [
      RawKey.fromHex('0x0000000000000000000000000000000000000000000000000000000000000001'),
      RawKey.fromHex('0x0000000000000000000000000000000000000000000000000000000000000002'),
    ]
    const pubKeys = keys.map(k => k.publicKey)
    const mpk = new MultisigPublicKey(2, pubKeys)
    const fee = create(FeeSchema, { amount: [], gasLimit: 200000n })
    const authInfo = create(AuthInfoSchema, { signerInfos: [], fee })
    const ms = new MultiSignature(mpk)
    ms.appendSignature(0, new Uint8Array(64))
    ms.appendSignature(1, new Uint8Array(64))

    const txRaw = createSignedTx(create(TxBodySchema, { memo: 'test' }), authInfo, mpk, ms, 0)
    const decoded = fromBinary(AuthInfoSchema, txRaw.authInfoBytes)
    expect(decoded.fee?.gasLimit).toBe(200000n)
  })
})

describe('multisig e2e signing', () => {
  it('should produce valid signatures that verify against signBytes', async () => {
    // 1. Setup keys
    const key1 = RawKey.fromHex(
      '0x0000000000000000000000000000000000000000000000000000000000000001'
    )
    const key2 = RawKey.fromHex(
      '0x0000000000000000000000000000000000000000000000000000000000000002'
    )
    const key3 = RawKey.fromHex(
      '0x0000000000000000000000000000000000000000000000000000000000000003'
    )
    const pubKeys = [key1.publicKey, key2.publicKey, key3.publicKey]
    const mpk = new MultisigPublicKey(2, pubKeys)

    // 2. Create tx body and auth info
    const body = create(TxBodySchema, { messages: [], memo: 'multisig-e2e-test' })
    const fee = create(FeeSchema, { amount: [], gasLimit: 200000n })
    const authInfo = create(AuthInfoSchema, { signerInfos: [], fee })

    // 3. Create signBytes (what each signer signs)
    const bodyBytes = toBinary(TxBodySchema, body)
    const authInfoBytes = toBinary(AuthInfoSchema, authInfo)
    const signBytes = makeSignBytes(bodyBytes, authInfoBytes, 'test-chain', 0n)

    // 4. Sign with key1 and key2
    const sig1 = await key1.sign(signBytes)
    const sig2 = await key2.sign(signBytes)

    // 5. Collect into MultiSignature
    const ms = new MultiSignature(mpk)
    ms.appendSignature(0, sig1)
    ms.appendSignature(1, sig2)

    // 6. Assemble tx
    const txRaw = createSignedTx(body, authInfo, mpk, ms, 0)

    // 7. Verify: decode the multisig proto and verify each individual signature
    const multiSigBytes = txRaw.signatures[0]
    const decoded = fromBinary(MultiSignatureSchema, multiSigBytes)
    expect(decoded.signatures).toHaveLength(2)

    // Each decoded signature should verify against signBytes with the corresponding key
    expect(key1.verify(signBytes, decoded.signatures[0])).toBe(true)
    expect(key2.verify(signBytes, decoded.signatures[1])).toBe(true)

    // key3 did NOT sign — verify a random signature does NOT verify
    expect(key3.verify(signBytes, decoded.signatures[0])).toBe(false)
  })
})

describe('key.sign(tx) overloads', () => {
  const keys = [
    RawKey.fromHex('0x0000000000000000000000000000000000000000000000000000000000000001'),
    RawKey.fromHex('0x0000000000000000000000000000000000000000000000000000000000000002'),
    RawKey.fromHex('0x0000000000000000000000000000000000000000000000000000000000000003'),
  ]

  it('sign(tx) returns Uint8Array for single key direct mode', async () => {
    const tx = new UnsignedTx({
      msgs: [],
      signMode: 'direct',
      chainId: 'test-1',
      accountNumber: 0n,
      sequence: 0n,
      fee: [],
      gasLimit: 200000n,
      memo: 'sign-tx-test',
    })
    const sig = await keys[0].sign(tx)
    expect(sig).toBeInstanceOf(Uint8Array)
    expect(sig.length).toBe(64)
  })

  it('sign(tx, mpk) auto-detects signer index', async () => {
    const mpk = new MultisigPublicKey(
      2,
      keys.map(k => k.publicKey)
    )
    const tx = new UnsignedTx({
      msgs: [],
      signMode: 'direct',
      chainId: 'test-1',
      accountNumber: 0n,
      sequence: 0n,
      fee: [],
      gasLimit: 200000n,
      memo: 'multisig-test',
    })

    const sig0 = await keys[0].sign(tx, mpk)
    expect(sig0.index).toBe(0)
    expect(sig0.signature).toBeInstanceOf(Uint8Array)

    const sig2 = await keys[2].sign(tx, mpk)
    expect(sig2.index).toBe(2)
  })

  it('getMultisigSignBytes preserves timeout and both extension option arrays', () => {
    const mpk = new MultisigPublicKey(
      2,
      keys.map(k => k.publicKey)
    )
    const nonCritical = create(AnySchema, {
      typeUrl: '/example.NonCritical',
      value: new Uint8Array([4, 5, 6]),
    })
    const tx = new UnsignedTx({
      msgs: [],
      signMode: 'direct',
      chainId: 'test-1',
      accountNumber: 0n,
      sequence: 0n,
      fee: [],
      gasLimit: 200000n,
      memo: 'multisig-extension',
      timeoutHeight: 44n,
      extensionOptions: [ExtensionOptionQueuedTx.packAny()],
      nonCriticalExtensionOptions: [nonCritical],
    })

    const signBytes = tx.getMultisigSignBytes(mpk)
    const signDoc = fromBinary(SignDocSchema, signBytes)
    const body = fromBinary(TxBodySchema, signDoc.bodyBytes)

    expect(body.timeoutHeight).toBe(44n)
    expect(body.extensionOptions.map(o => o.typeUrl)).toEqual([
      '/initia.tx.v1.ExtensionOptionQueuedTx',
    ])
    expect(body.nonCriticalExtensionOptions.map(o => o.typeUrl)).toEqual(['/example.NonCritical'])
  })

  it('sign(tx, mpk) throws if key not member', async () => {
    const mpk = new MultisigPublicKey(
      2,
      keys.slice(0, 2).map(k => k.publicKey)
    )
    const tx = new UnsignedTx({
      msgs: [],
      signMode: 'direct',
      chainId: 'test-1',
      accountNumber: 0n,
      sequence: 0n,
      fee: [],
      gasLimit: 200000n,
      memo: '',
    })
    await expect(keys[2].sign(tx, mpk)).rejects.toThrow('not a member')
  })

  it('full multisig e2e with new API', async () => {
    const mpk = new MultisigPublicKey(
      2,
      keys.map(k => k.publicKey)
    )
    const tx = new UnsignedTx({
      msgs: [],
      signMode: 'direct',
      chainId: 'test-1',
      accountNumber: 0n,
      sequence: 0n,
      fee: [],
      gasLimit: 200000n,
      memo: 'e2e-new-api',
    })

    const sig1 = await keys[0].sign(tx, mpk)
    const sig2 = await keys[1].sign(tx, mpk)
    const signedTx = tx.assembleMultisig(mpk, [sig1, sig2])

    expect(signedTx.txBytes).toBeInstanceOf(Uint8Array)
    expect(signedTx.txBytes.length).toBeGreaterThan(0)
  })

  it('assembleMultisig preserves timeout and both extension option arrays in final TxRaw', async () => {
    const mpk = new MultisigPublicKey(
      2,
      keys.map(k => k.publicKey)
    )
    const nonCritical = create(AnySchema, {
      typeUrl: '/example.NonCritical',
      value: new Uint8Array([4, 5, 6]),
    })
    const tx = new UnsignedTx({
      msgs: [],
      signMode: 'direct',
      chainId: 'test-1',
      accountNumber: 0n,
      sequence: 0n,
      fee: [],
      gasLimit: 200000n,
      memo: 'e2e-extension',
      timeoutHeight: 45n,
      extensionOptions: [ExtensionOptionQueuedTx.packAny()],
      nonCriticalExtensionOptions: [nonCritical],
    })

    const sig1 = await keys[0].sign(tx, mpk)
    const sig2 = await keys[1].sign(tx, mpk)
    const signedTx = tx.assembleMultisig(mpk, [sig1, sig2])
    const txRaw = fromBinary(TxRawSchema, signedTx.txBytes)
    const body = fromBinary(TxBodySchema, txRaw.bodyBytes)

    expect(body.timeoutHeight).toBe(45n)
    expect(body.extensionOptions.map(o => o.typeUrl)).toEqual([
      '/initia.tx.v1.ExtensionOptionQueuedTx',
    ])
    expect(body.nonCriticalExtensionOptions.map(o => o.typeUrl)).toEqual(['/example.NonCritical'])
  })

  it('assembleMultisig throws when threshold not met', async () => {
    const mpk = new MultisigPublicKey(
      2,
      keys.map(k => k.publicKey)
    )
    const tx = new UnsignedTx({
      msgs: [],
      signMode: 'direct',
      chainId: 'test-1',
      accountNumber: 0n,
      sequence: 0n,
      fee: [],
      gasLimit: 200000n,
      memo: '',
    })
    const sig1 = await keys[0].sign(tx, mpk)
    // Only 1 signature but threshold is 2
    expect(() => tx.assembleMultisig(mpk, [sig1])).toThrow('threshold not met')
  })

  it('assembleMultisig throws with zero signatures', () => {
    const mpk = new MultisigPublicKey(
      2,
      keys.map(k => k.publicKey)
    )
    const tx = new UnsignedTx({
      msgs: [],
      signMode: 'direct',
      chainId: 'test-1',
      accountNumber: 0n,
      sequence: 0n,
      fee: [],
      gasLimit: 200000n,
      memo: '',
    })
    expect(() => tx.assembleMultisig(mpk, [])).toThrow('threshold not met')
  })

  it('sign(bytes) still works (backward compat)', async () => {
    const sig = await keys[0].sign(new Uint8Array([1, 2, 3]))
    expect(sig).toBeInstanceOf(Uint8Array)
    expect(sig.length).toBe(64)
  })

  it('sign(tx) with amino mode produces valid signature', async () => {
    const tx = new UnsignedTx({
      msgs: [],
      signMode: 'amino',
      chainId: 'test-1',
      accountNumber: 0n,
      sequence: 0n,
      fee: [],
      gasLimit: 200000n,
      memo: 'amino-test',
    })
    const sig = await keys[0].sign(tx)
    expect(sig).toBeInstanceOf(Uint8Array)
    expect(sig.length).toBe(64)
  })

  it('sign(tx) with eip191 mode produces valid signature', async () => {
    const tx = new UnsignedTx({
      msgs: [],
      signMode: 'eip191',
      chainId: 'test-1',
      accountNumber: 0n,
      sequence: 0n,
      fee: [],
      gasLimit: 200000n,
      memo: 'eip191-test',
    })
    const sig = await keys[0].sign(tx)
    expect(sig).toBeInstanceOf(Uint8Array)
    expect(sig.length).toBe(64)
  })

  it('sign(tx) produces different signatures for different signModes', async () => {
    const base = {
      msgs: [],
      chainId: 'test-1',
      accountNumber: 0n,
      sequence: 0n,
      fee: [],
      gasLimit: 200000n,
      memo: '',
    }
    const directSig = await keys[0].sign(new UnsignedTx({ ...base, signMode: 'direct' }))
    const aminoSig = await keys[0].sign(new UnsignedTx({ ...base, signMode: 'amino' }))
    const eip191Sig = await keys[0].sign(new UnsignedTx({ ...base, signMode: 'eip191' }))

    // All different because they sign different bytes
    expect(directSig).not.toEqual(aminoSig)
    expect(directSig).not.toEqual(eip191Sig)
    expect(aminoSig).not.toEqual(eip191Sig)
  })

  it('UnsignedTx converts plain CoinLike fee to Coin instances', () => {
    const tx = new UnsignedTx({
      msgs: [],
      signMode: 'direct',
      chainId: 'test-1',
      accountNumber: 0n,
      sequence: 0n,
      fee: [{ denom: 'uinit', amount: '1000' }],
      gasLimit: 200000n,
      memo: '',
    })
    expect(tx.fee[0]).toBeInstanceOf(Coin)
    expect(tx.fee[0].denom).toBe('uinit')
    expect(tx.fee[0].amount).toBe('1000')
    expect(tx.fee[0].toProto()).toBeDefined()
    expect(tx.fee[0].toAmino()).toEqual({ denom: 'uinit', amount: '1000' })
  })
})
