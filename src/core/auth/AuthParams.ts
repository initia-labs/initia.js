import { JSONSerializable } from '../../util/json'
import { Params as Params_pb } from '@initia/initia.proto/cosmos/auth/v1beta1/auth'
import Long from 'long'

export class AuthParams extends JSONSerializable<
  AuthParams.Amino,
  AuthParams.Data,
  AuthParams.Proto
> {
  /**
   * @param max_memo_characters
   * @param tx_sig_limit
   * @param tx_size_cost_per_byte
   * @param sig_verify_cost_ed25519
   * @param sig_verify_cost_secp256k1
   */
  constructor(
    public max_memo_characters: number,
    public tx_sig_limit: number,
    public tx_size_cost_per_byte: number,
    public sig_verify_cost_ed25519: number,
    public sig_verify_cost_secp256k1: number
  ) {
    super()
  }

  public static fromAmino(data: AuthParams.Amino): AuthParams {
    const {
      value: {
        max_memo_characters,
        tx_sig_limit,
        tx_size_cost_per_byte,
        sig_verify_cost_ed25519,
        sig_verify_cost_secp256k1,
      },
    } = data

    return new AuthParams(
      Number.parseInt(max_memo_characters),
      Number.parseInt(tx_sig_limit),
      Number.parseInt(tx_size_cost_per_byte),
      Number.parseInt(sig_verify_cost_ed25519),
      Number.parseInt(sig_verify_cost_secp256k1)
    )
  }

  public toAmino(): AuthParams.Amino {
    const {
      max_memo_characters,
      tx_sig_limit,
      tx_size_cost_per_byte,
      sig_verify_cost_ed25519,
      sig_verify_cost_secp256k1,
    } = this

    return {
      type: 'cosmos-sdk/x/auth/Params',
      value: {
        max_memo_characters: max_memo_characters.toString(),
        tx_sig_limit: tx_sig_limit.toString(),
        tx_size_cost_per_byte: tx_size_cost_per_byte.toString(),
        sig_verify_cost_ed25519: sig_verify_cost_ed25519.toString(),
        sig_verify_cost_secp256k1: sig_verify_cost_secp256k1.toString(),
      },
    }
  }

  public static fromData(data: AuthParams.Data): AuthParams {
    const {
      max_memo_characters,
      tx_sig_limit,
      tx_size_cost_per_byte,
      sig_verify_cost_ed25519,
      sig_verify_cost_secp256k1,
    } = data

    return new AuthParams(
      Number.parseInt(max_memo_characters),
      Number.parseInt(tx_sig_limit),
      Number.parseInt(tx_size_cost_per_byte),
      Number.parseInt(sig_verify_cost_ed25519),
      Number.parseInt(sig_verify_cost_secp256k1)
    )
  }

  public toData(): AuthParams.Data {
    const {
      max_memo_characters,
      tx_sig_limit,
      tx_size_cost_per_byte,
      sig_verify_cost_ed25519,
      sig_verify_cost_secp256k1,
    } = this

    return {
      '@type': '/cosmos.auth.v1beta1.Params',
      max_memo_characters: max_memo_characters.toString(),
      tx_sig_limit: tx_sig_limit.toString(),
      tx_size_cost_per_byte: tx_size_cost_per_byte.toString(),
      sig_verify_cost_ed25519: sig_verify_cost_ed25519.toString(),
      sig_verify_cost_secp256k1: sig_verify_cost_secp256k1.toString(),
    }
  }

  public static fromProto(data: AuthParams.Proto): AuthParams {
    return new AuthParams(
      data.maxMemoCharacters.toNumber(),
      data.txSigLimit.toNumber(),
      data.txSizeCostPerByte.toNumber(),
      data.sigVerifyCostEd25519.toNumber(),
      data.sigVerifyCostSecp256k1.toNumber()
    )
  }

  public toProto(): AuthParams.Proto {
    const {
      max_memo_characters,
      tx_sig_limit,
      tx_size_cost_per_byte,
      sig_verify_cost_ed25519,
      sig_verify_cost_secp256k1,
    } = this

    return Params_pb.fromPartial({
      maxMemoCharacters: Long.fromNumber(max_memo_characters),
      txSigLimit: Long.fromNumber(tx_sig_limit),
      txSizeCostPerByte: Long.fromNumber(tx_size_cost_per_byte),
      sigVerifyCostEd25519: Long.fromNumber(sig_verify_cost_ed25519),
      sigVerifyCostSecp256k1: Long.fromNumber(sig_verify_cost_secp256k1),
    })
  }
}

export namespace AuthParams {
  export interface Amino {
    type: 'cosmos-sdk/x/auth/Params'
    value: {
      max_memo_characters: string
      tx_sig_limit: string
      tx_size_cost_per_byte: string
      sig_verify_cost_ed25519: string
      sig_verify_cost_secp256k1: string
    }
  }

  export interface Data {
    '@type': '/cosmos.auth.v1beta1.Params'
    max_memo_characters: string
    tx_sig_limit: string
    tx_size_cost_per_byte: string
    sig_verify_cost_ed25519: string
    sig_verify_cost_secp256k1: string
  }

  export type Proto = Params_pb
}
