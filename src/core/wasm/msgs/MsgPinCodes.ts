import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgPinCodes as MsgPinCodes_pb } from '@initia/initia.proto/cosmwasm/wasm/v1/tx'

export class MsgPinCodes extends JSONSerializable<
  MsgPinCodes.Amino,
  MsgPinCodes.Data,
  MsgPinCodes.Proto
> {
  /**
   * @param authority the address of the governance account
   * @param code_ids references the new WASM codes
   */
  constructor(
    public authority: AccAddress,
    public code_ids: number[]
  ) {
    super()
  }

  public static fromAmino(data: MsgPinCodes.Amino): MsgPinCodes {
    const {
      value: { authority, code_ids },
    } = data
    return new MsgPinCodes(authority, code_ids.map(parseInt))
  }

  public toAmino(): MsgPinCodes.Amino {
    const { authority, code_ids } = this
    return {
      type: 'wasm/MsgPinCodes',
      value: {
        authority,
        code_ids: code_ids.map((id) => id.toFixed()),
      },
    }
  }

  public static fromData(data: MsgPinCodes.Data): MsgPinCodes {
    const { authority, code_ids } = data
    return new MsgPinCodes(authority, code_ids.map(parseInt))
  }

  public toData(): MsgPinCodes.Data {
    const { authority, code_ids } = this
    return {
      '@type': '/cosmwasm.wasm.v1.MsgPinCodes',
      authority,
      code_ids: code_ids.map((id) => id.toFixed()),
    }
  }

  public static fromProto(data: MsgPinCodes.Proto): MsgPinCodes {
    return new MsgPinCodes(
      data.authority,
      data.codeIds.map((id) => id.toNumber())
    )
  }

  public toProto(): MsgPinCodes.Proto {
    const { authority, code_ids } = this
    return MsgPinCodes_pb.fromPartial({
      authority,
      codeIds: code_ids,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmwasm.wasm.v1.MsgPinCodes',
      value: MsgPinCodes_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgPinCodes {
    return MsgPinCodes.fromProto(MsgPinCodes_pb.decode(msgAny.value))
  }
}

export namespace MsgPinCodes {
  export interface Amino {
    type: 'wasm/MsgPinCodes'
    value: {
      authority: AccAddress
      code_ids: string[]
    }
  }

  export interface Data {
    '@type': '/cosmwasm.wasm.v1.MsgPinCodes'
    authority: AccAddress
    code_ids: string[]
  }

  export type Proto = MsgPinCodes_pb
}
