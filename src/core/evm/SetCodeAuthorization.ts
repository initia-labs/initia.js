import { JSONSerializable } from '../../util/json'
import { SetCodeAuthorization as SetCodeAuthorization_pb } from '@initia/initia.proto/minievm/evm/v1/types'

/**
 * SetCodeAuthorization is an authorization from an account to deploy code at its address.
 */
export class SetCodeAuthorization extends JSONSerializable<
  SetCodeAuthorization.Amino,
  SetCodeAuthorization.Data,
  SetCodeAuthorization.Proto
> {
  /**
   * @param chain_id
   * @param address
   * @param nonce
   * @param signature
   */
  constructor(
    public chain_id: string,
    public address: string,
    public nonce: number,
    public signature: string
  ) {
    super()
  }

  public static fromAmino(
    data: SetCodeAuthorization.Amino
  ): SetCodeAuthorization {
    const { chain_id, address, nonce, signature } = data
    return new SetCodeAuthorization(
      chain_id,
      address,
      parseInt(nonce),
      signature
    )
  }

  public toAmino(): SetCodeAuthorization.Amino {
    const { chain_id, address, nonce, signature } = this
    return {
      chain_id,
      address,
      nonce: nonce.toFixed(),
      signature,
    }
  }

  public static fromData(
    data: SetCodeAuthorization.Data
  ): SetCodeAuthorization {
    const { chain_id, address, nonce, signature } = data
    return new SetCodeAuthorization(
      chain_id,
      address,
      parseInt(nonce),
      signature
    )
  }

  public toData(): SetCodeAuthorization.Data {
    const { chain_id, address, nonce, signature } = this
    return {
      chain_id,
      address,
      nonce: nonce.toFixed(),
      signature,
    }
  }

  public static fromProto(
    data: SetCodeAuthorization.Proto
  ): SetCodeAuthorization {
    return new SetCodeAuthorization(
      data.chainId,
      data.address,
      Number(data.nonce),
      Buffer.from(data.signature).toString('base64')
    )
  }

  public toProto(): SetCodeAuthorization.Proto {
    const { chain_id, address, nonce, signature } = this
    return SetCodeAuthorization_pb.fromPartial({
      chainId: chain_id,
      address,
      nonce: BigInt(nonce),
      signature: Buffer.from(signature, 'base64'),
    })
  }
}

export namespace SetCodeAuthorization {
  export interface Amino {
    chain_id: string
    address: string
    nonce: string
    signature: string
  }

  export interface Data {
    chain_id: string
    address: string
    nonce: string
    signature: string
  }

  export type Proto = SetCodeAuthorization_pb
}
