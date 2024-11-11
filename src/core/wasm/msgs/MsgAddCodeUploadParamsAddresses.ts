import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgAddCodeUploadParamsAddresses as MsgAddCodeUploadParamsAddresses_pb } from '@initia/initia.proto/cosmwasm/wasm/v1/tx'

/**
 * MsgAddCodeUploadParamsAddresses defines a governance operation for
 * adding addresses to code upload params.
 * The authority is defined in the keeper.
 */
export class MsgAddCodeUploadParamsAddresses extends JSONSerializable<
  MsgAddCodeUploadParamsAddresses.Amino,
  MsgAddCodeUploadParamsAddresses.Data,
  MsgAddCodeUploadParamsAddresses.Proto
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
    data: MsgAddCodeUploadParamsAddresses.Amino
  ): MsgAddCodeUploadParamsAddresses {
    const {
      value: { authority, addresses },
    } = data
    return new MsgAddCodeUploadParamsAddresses(authority, addresses)
  }

  public toAmino(): MsgAddCodeUploadParamsAddresses.Amino {
    const { authority, addresses } = this
    return {
      type: 'wasm/MsgAddCodeUploadParamsAddresses',
      value: {
        authority,
        addresses,
      },
    }
  }

  public static fromData(
    data: MsgAddCodeUploadParamsAddresses.Data
  ): MsgAddCodeUploadParamsAddresses {
    const { authority, addresses } = data
    return new MsgAddCodeUploadParamsAddresses(authority, addresses)
  }

  public toData(): MsgAddCodeUploadParamsAddresses.Data {
    const { authority, addresses } = this
    return {
      '@type': '/cosmwasm.wasm.v1.MsgAddCodeUploadParamsAddresses',
      authority,
      addresses,
    }
  }

  public static fromProto(
    data: MsgAddCodeUploadParamsAddresses.Proto
  ): MsgAddCodeUploadParamsAddresses {
    return new MsgAddCodeUploadParamsAddresses(data.authority, data.addresses)
  }

  public toProto(): MsgAddCodeUploadParamsAddresses.Proto {
    const { authority, addresses } = this
    return MsgAddCodeUploadParamsAddresses_pb.fromPartial({
      authority,
      addresses,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmwasm.wasm.v1.MsgAddCodeUploadParamsAddresses',
      value: MsgAddCodeUploadParamsAddresses_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgAddCodeUploadParamsAddresses {
    return MsgAddCodeUploadParamsAddresses.fromProto(
      MsgAddCodeUploadParamsAddresses_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgAddCodeUploadParamsAddresses {
  export interface Amino {
    type: 'wasm/MsgAddCodeUploadParamsAddresses'
    value: {
      authority: AccAddress
      addresses: AccAddress[]
    }
  }

  export interface Data {
    '@type': '/cosmwasm.wasm.v1.MsgAddCodeUploadParamsAddresses'
    authority: AccAddress
    addresses: AccAddress[]
  }

  export type Proto = MsgAddCodeUploadParamsAddresses_pb
}
