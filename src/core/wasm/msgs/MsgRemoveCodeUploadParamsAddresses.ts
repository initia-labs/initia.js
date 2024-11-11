import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgRemoveCodeUploadParamsAddresses as MsgRemoveCodeUploadParamsAddresses_pb } from '@initia/initia.proto/cosmwasm/wasm/v1/tx'

/**
 * MsgRemoveCodeUploadParamsAddresses defines a governance operation for
 * removing addresses from code upload params.
 * The authority is defined in the keeper.
 */
export class MsgRemoveCodeUploadParamsAddresses extends JSONSerializable<
  MsgRemoveCodeUploadParamsAddresses.Amino,
  MsgRemoveCodeUploadParamsAddresses.Data,
  MsgRemoveCodeUploadParamsAddresses.Proto
> {
  /**
   * @param authority the address of the governance account
   * @param addresses
   */
  constructor(
    public authority: AccAddress,
    public addresses: AccAddress[]
  ) {
    super()
  }

  public static fromAmino(
    data: MsgRemoveCodeUploadParamsAddresses.Amino
  ): MsgRemoveCodeUploadParamsAddresses {
    const {
      value: { authority, addresses },
    } = data
    return new MsgRemoveCodeUploadParamsAddresses(authority, addresses)
  }

  public toAmino(): MsgRemoveCodeUploadParamsAddresses.Amino {
    const { authority, addresses } = this
    return {
      type: 'wasm/MsgRemoveCodeUploadParamsAddresses',
      value: {
        authority,
        addresses,
      },
    }
  }

  public static fromData(
    data: MsgRemoveCodeUploadParamsAddresses.Data
  ): MsgRemoveCodeUploadParamsAddresses {
    const { authority, addresses } = data
    return new MsgRemoveCodeUploadParamsAddresses(authority, addresses)
  }

  public toData(): MsgRemoveCodeUploadParamsAddresses.Data {
    const { authority, addresses } = this
    return {
      '@type': '/cosmwasm.wasm.v1.MsgRemoveCodeUploadParamsAddresses',
      authority,
      addresses,
    }
  }

  public static fromProto(
    data: MsgRemoveCodeUploadParamsAddresses.Proto
  ): MsgRemoveCodeUploadParamsAddresses {
    return new MsgRemoveCodeUploadParamsAddresses(
      data.authority,
      data.addresses
    )
  }

  public toProto(): MsgRemoveCodeUploadParamsAddresses.Proto {
    const { authority, addresses } = this
    return MsgRemoveCodeUploadParamsAddresses_pb.fromPartial({
      authority,
      addresses,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmwasm.wasm.v1.MsgRemoveCodeUploadParamsAddresses',
      value: MsgRemoveCodeUploadParamsAddresses_pb.encode(
        this.toProto()
      ).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgRemoveCodeUploadParamsAddresses {
    return MsgRemoveCodeUploadParamsAddresses.fromProto(
      MsgRemoveCodeUploadParamsAddresses_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgRemoveCodeUploadParamsAddresses {
  export interface Amino {
    type: 'wasm/MsgRemoveCodeUploadParamsAddresses'
    value: {
      authority: AccAddress
      addresses: AccAddress[]
    }
  }

  export interface Data {
    '@type': '/cosmwasm.wasm.v1.MsgRemoveCodeUploadParamsAddresses'
    authority: AccAddress
    addresses: AccAddress[]
  }

  export type Proto = MsgRemoveCodeUploadParamsAddresses_pb
}
