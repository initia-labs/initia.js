import * as secp256k1 from 'secp256k1'
import { JSONSerializable } from '../util/json'
import { sha256, ripemd160, keccak256 } from '../util/hash'
import { LegacyAminoPubKey as LegacyAminoPubKey_pb } from '@initia/initia.proto/cosmos/crypto/multisig/keys'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { PubKey as PubKey_pb } from '@initia/initia.proto/cosmos/crypto/secp256k1/keys'
import { PubKey as ValConsPubKey_pb } from '@initia/initia.proto/cosmos/crypto/ed25519/keys'
import { PubKey as EthPubKey_pb } from '@initia/initia.proto/initia/crypto/v1beta1/ethsecp256k1/keys'
import { bech32 } from 'bech32'

/**
 * As discussed in https://github.com/binance-chain/javascript-sdk/issues/163
 *
 * Prefixes listed here: https://github.com/tendermint/tendermint/blob/d419fffe18531317c28c29a292ad7d253f6cafdf/docs/spec/blockchain/encoding.md#public-key-cryptography
 *
 * Last bytes is varint-encoded length prefix.
 */
const pubkeyAminoPrefixSecp256k1 = Buffer.from(
  'eb5ae987' + '21' /* fixed length */,
  'hex'
)
/**
 * See https://github.com/tendermint/tendermint/commit/38b401657e4ad7a7eeb3c30a3cbf512037df3740
 */
const pubkeyAminoPrefixMultisigThreshold = Buffer.from(
  '22c1f7e2' /* variable length not included */,
  'hex'
)

const encodeUvarint = (value: number | string): number[] => {
  const checked = parseInt(value.toString())
  if (checked > 127) {
    throw new Error(
      'Encoding numbers > 127 is not supported here. Please tell those lazy CosmJS maintainers to port the binary.PutUvarint implementation from the Go standard library and write some tests.'
    )
  }
  return [checked]
}

export type PublicKey =
  | SimplePublicKey
  | LegacyAminoMultisigPublicKey
  | ValConsPublicKey
  | EthPublicKey

export namespace PublicKey {
  export type Amino =
    | SimplePublicKey.Amino
    | LegacyAminoMultisigPublicKey.Amino
    | ValConsPublicKey.Amino
    | EthPublicKey.Amino
  export type Data =
    | SimplePublicKey.Data
    | LegacyAminoMultisigPublicKey.Data
    | ValConsPublicKey.Data
    | EthPublicKey.Data
  export type Proto = Any

  export function fromAmino(data: PublicKey.Amino): PublicKey {
    switch (data.type) {
      case 'tendermint/PubKeySecp256k1':
        return SimplePublicKey.fromAmino(data)
      case 'tendermint/PubKeyMultisigThreshold':
        return LegacyAminoMultisigPublicKey.fromAmino(data)
      case 'tendermint/PubKeyEd25519':
        return ValConsPublicKey.fromAmino(data)
      case 'initia/PubKeyEthSecp256k1':
        return EthPublicKey.fromAmino(data)
    }
  }

  export function fromData(data: PublicKey.Data): PublicKey {
    switch (data['@type']) {
      case '/cosmos.crypto.secp256k1.PubKey':
        return SimplePublicKey.fromData(data)
      case '/cosmos.crypto.multisig.LegacyAminoPubKey':
        return LegacyAminoMultisigPublicKey.fromData(data)
      case '/cosmos.crypto.ed25519.PubKey':
        return ValConsPublicKey.fromData(data)
      case '/initia.crypto.v1beta1.ethsecp256k1.PubKey':
        return EthPublicKey.fromData(data)
    }
  }

  export function fromProto(pubkeyAny: PublicKey.Proto): PublicKey {
    const typeUrl = pubkeyAny.typeUrl
    if (typeUrl === '/cosmos.crypto.secp256k1.PubKey') {
      return SimplePublicKey.unpackAny(pubkeyAny)
    } else if (typeUrl === '/cosmos.crypto.multisig.LegacyAminoPubKey') {
      return LegacyAminoMultisigPublicKey.unpackAny(pubkeyAny)
    } else if (typeUrl === '/cosmos.crypto.ed25519.PubKey') {
      return ValConsPublicKey.unpackAny(pubkeyAny)
    } else if (typeUrl === '/initia.crypto.v1beta1.ethsecp256k1.PubKey') {
      return EthPublicKey.unpackAny(pubkeyAny)
    }

    throw new Error(`Pubkey type ${typeUrl} not recognized`)
  }
}

/**
 * SimplePublicKey defines a secp256k1 public key.
 * Key is the compressed form of the pubkey. The first byte depends is a 0x02 byte
 * if the y-coordinate is the lexicographically largest of the two associated with
 * the x-coordinate. Otherwise the first byte is a 0x03.
 * This prefix is followed with the x-coordinate.
 */
export class SimplePublicKey extends JSONSerializable<
  SimplePublicKey.Amino,
  SimplePublicKey.Data,
  SimplePublicKey.Proto
> {
  constructor(public key: string) {
    super()
  }

  public static fromAmino(data: SimplePublicKey.Amino): SimplePublicKey {
    return new SimplePublicKey(data.value)
  }

  public toAmino(): SimplePublicKey.Amino {
    return {
      type: 'tendermint/PubKeySecp256k1',
      value: this.key,
    }
  }

  public static fromData(data: SimplePublicKey.Data): SimplePublicKey {
    return new SimplePublicKey(data.key)
  }

  public toData(): SimplePublicKey.Data {
    return {
      '@type': '/cosmos.crypto.secp256k1.PubKey',
      key: this.key,
    }
  }

  public static fromProto(pubkeyProto: SimplePublicKey.Proto): SimplePublicKey {
    return new SimplePublicKey(Buffer.from(pubkeyProto.key).toString('base64'))
  }

  public toProto(): SimplePublicKey.Proto {
    return PubKey_pb.fromPartial({
      key: Buffer.from(this.key, 'base64'),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.crypto.secp256k1.PubKey',
      value: PubKey_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(pubkeyAny: Any): SimplePublicKey {
    return SimplePublicKey.fromProto(PubKey_pb.decode(pubkeyAny.value))
  }

  public encodeAminoPubkey(): Uint8Array {
    return Buffer.concat([
      pubkeyAminoPrefixSecp256k1,
      Buffer.from(this.key, 'base64'),
    ])
  }

  public rawAddress(): Uint8Array {
    const pubkeyData = Buffer.from(this.key, 'base64')
    return ripemd160(sha256(pubkeyData))
  }

  public address(): string {
    return bech32.encode('init', bech32.toWords(this.rawAddress()))
  }
}

export namespace SimplePublicKey {
  export interface Amino {
    type: 'tendermint/PubKeySecp256k1'
    value: string
  }

  export interface Data {
    '@type': '/cosmos.crypto.secp256k1.PubKey'
    key: string
  }

  export type Proto = PubKey_pb
}

/**
 * LegacyAminoMultisigPublicKey specifies a public key type
 * which nests multiple public keys and a threshold.
 * It uses legacy amino address rules.
 */
export class LegacyAminoMultisigPublicKey extends JSONSerializable<
  LegacyAminoMultisigPublicKey.Amino,
  LegacyAminoMultisigPublicKey.Data,
  LegacyAminoMultisigPublicKey.Proto
> {
  constructor(
    public threshold: number,
    public pubkeys: SimplePublicKey[]
  ) {
    super()
  }

  public encodeAminoPubkey(): Uint8Array {
    const out = Array.from(pubkeyAminoPrefixMultisigThreshold)
    out.push(0x08)
    out.push(...encodeUvarint(this.threshold))
    for (const pubkeyData of this.pubkeys.map((p) => p.encodeAminoPubkey())) {
      out.push(0x12)
      out.push(...encodeUvarint(pubkeyData.length))
      out.push(...Array.from(pubkeyData))
    }

    return new Uint8Array(out)
  }

  public rawAddress(): Uint8Array {
    const pubkeyData = this.encodeAminoPubkey()
    return sha256(pubkeyData).slice(0, 20)
  }

  public address(): string {
    return bech32.encode('init', bech32.toWords(this.rawAddress()))
  }

  public static fromAmino(
    data: LegacyAminoMultisigPublicKey.Amino
  ): LegacyAminoMultisigPublicKey {
    return new LegacyAminoMultisigPublicKey(
      parseInt(data.value.threshold),
      data.value.pubkeys.map((p) => SimplePublicKey.fromAmino(p))
    )
  }

  public toAmino(): LegacyAminoMultisigPublicKey.Amino {
    return {
      type: 'tendermint/PubKeyMultisigThreshold',
      value: {
        threshold: this.threshold.toFixed(),
        pubkeys: this.pubkeys.map((p) => p.toAmino()),
      },
    }
  }

  public static fromData(
    data: LegacyAminoMultisigPublicKey.Data
  ): LegacyAminoMultisigPublicKey {
    return new LegacyAminoMultisigPublicKey(
      parseInt(data.threshold),
      data.public_keys.map((v) => SimplePublicKey.fromData(v))
    )
  }

  public toData(): LegacyAminoMultisigPublicKey.Data {
    return {
      '@type': '/cosmos.crypto.multisig.LegacyAminoPubKey',
      threshold: this.threshold.toFixed(),
      public_keys: this.pubkeys.map((p) => p.toData()),
    }
  }

  public static fromProto(
    pubkeyProto: LegacyAminoMultisigPublicKey.Proto
  ): LegacyAminoMultisigPublicKey {
    return new LegacyAminoMultisigPublicKey(
      pubkeyProto.threshold,
      pubkeyProto.publicKeys.map((v) => SimplePublicKey.unpackAny(v))
    )
  }

  public toProto(): LegacyAminoMultisigPublicKey.Proto {
    return LegacyAminoPubKey_pb.fromPartial({
      threshold: this.threshold,
      publicKeys: this.pubkeys.map((v) => v.packAny()),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.crypto.multisig.LegacyAminoPubKey',
      value: LegacyAminoPubKey_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(pubkeyAny: Any): LegacyAminoMultisigPublicKey {
    return LegacyAminoMultisigPublicKey.fromProto(
      LegacyAminoPubKey_pb.decode(pubkeyAny.value)
    )
  }
}

export namespace LegacyAminoMultisigPublicKey {
  export interface Amino {
    type: 'tendermint/PubKeyMultisigThreshold'
    value: {
      threshold: string
      pubkeys: SimplePublicKey.Amino[]
    }
  }

  export interface Data {
    '@type': '/cosmos.crypto.multisig.LegacyAminoPubKey'
    threshold: string
    public_keys: SimplePublicKey.Data[]
  }

  export type Proto = LegacyAminoPubKey_pb
}

/**
 * ValConsPublicKey is an ed25519 public key for handling Tendermint keys in SDK.
 * It's needed for Any serialization and SDK compatibility.
 * It must not be used in a non Tendermint key context because it doesn't implement
 * ADR-28. Nevertheless, you will like to use ed25519 in app user level
 * then you must create a new proto message and follow ADR-28 for Address construction.
 */
export class ValConsPublicKey extends JSONSerializable<
  ValConsPublicKey.Amino,
  ValConsPublicKey.Data,
  ValConsPublicKey.Proto
> {
  constructor(public key: string) {
    super()
  }

  public static fromAmino(data: ValConsPublicKey.Amino): ValConsPublicKey {
    return new ValConsPublicKey(data.value)
  }

  public toAmino(): ValConsPublicKey.Amino {
    return {
      type: 'tendermint/PubKeyEd25519',
      value: this.key,
    }
  }

  public static fromData(data: ValConsPublicKey.Data): ValConsPublicKey {
    return new ValConsPublicKey(data.key)
  }

  public toData(): ValConsPublicKey.Data {
    return {
      '@type': '/cosmos.crypto.ed25519.PubKey',
      key: this.key,
    }
  }

  public static fromProto(
    pubkeyProto: ValConsPublicKey.Proto
  ): ValConsPublicKey {
    return new ValConsPublicKey(Buffer.from(pubkeyProto.key).toString('base64'))
  }

  public toProto(): ValConsPublicKey.Proto {
    return ValConsPubKey_pb.fromPartial({
      key: Buffer.from(this.key, 'base64'),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.crypto.ed25519.PubKey',
      value: ValConsPubKey_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(pubkeyAny: Any): ValConsPublicKey {
    return ValConsPublicKey.fromProto(ValConsPubKey_pb.decode(pubkeyAny.value))
  }

  public rawAddress(): Uint8Array {
    const pubkeyData = Buffer.from(this.key, 'base64')
    return sha256(pubkeyData).slice(0, 20)
  }

  public address(): string {
    return bech32.encode('initvalcons', bech32.toWords(this.rawAddress()))
  }
}

export namespace ValConsPublicKey {
  export interface Amino {
    type: 'tendermint/PubKeyEd25519'
    value: string
  }

  export interface Data {
    '@type': '/cosmos.crypto.ed25519.PubKey'
    key: string
  }

  export type Proto = ValConsPubKey_pb
}

/**
 * EthPublicKey defines a type alias for an ecdsa.PublicKey that implements Tendermint's PubKey interface.
 * It represents the 33-byte compressed public key format.
 */
export class EthPublicKey extends JSONSerializable<
  EthPublicKey.Amino,
  EthPublicKey.Data,
  EthPublicKey.Proto
> {
  constructor(public key: string) {
    super()
  }

  public static fromAmino(data: EthPublicKey.Amino): EthPublicKey {
    return new EthPublicKey(data.value)
  }

  public toAmino(): EthPublicKey.Amino {
    return {
      type: 'initia/PubKeyEthSecp256k1',
      value: this.key,
    }
  }

  public static fromData(data: EthPublicKey.Data): EthPublicKey {
    return new EthPublicKey(data.key)
  }

  public toData(): EthPublicKey.Data {
    return {
      '@type': '/initia.crypto.v1beta1.ethsecp256k1.PubKey',
      key: this.key,
    }
  }

  public static fromProto(pubkeyProto: EthPublicKey.Proto): EthPublicKey {
    return new EthPublicKey(Buffer.from(pubkeyProto.key).toString('base64'))
  }

  public toProto(): EthPublicKey.Proto {
    return EthPubKey_pb.fromPartial({
      key: Buffer.from(this.key, 'base64'),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.crypto.v1beta1.ethsecp256k1.PubKey',
      value: EthPubKey_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(pubkeyAny: Any): EthPublicKey {
    return EthPublicKey.fromProto(EthPubKey_pb.decode(pubkeyAny.value))
  }

  public rawAddress(): Uint8Array {
    const verified = secp256k1.publicKeyVerify(Buffer.from(this.key, 'base64'))
    if (!verified) {
      throw new Error('Invalid public key')
    }

    // Serialize the public key in uncompressed format (65 bytes)
    const pubBytes = secp256k1.publicKeyConvert(
      Buffer.from(this.key, 'base64'),
      false
    )

    return keccak256(pubBytes.slice(1)).slice(12)
  }

  public address(): string {
    return bech32.encode('init', bech32.toWords(this.rawAddress()))
  }
}

export namespace EthPublicKey {
  export interface Amino {
    type: 'initia/PubKeyEthSecp256k1'
    value: string
  }

  export interface Data {
    '@type': '/initia.crypto.v1beta1.ethsecp256k1.PubKey'
    key: string
  }

  export type Proto = EthPubKey_pb
}
