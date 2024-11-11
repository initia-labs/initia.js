import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgUnpinCodes as MsgUnpinCodes_pb } from '@initia/initia.proto/cosmwasm/wasm/v1/tx'

/**
 * MsgUnpinCodes defines a governance operation for unpinning a set of
 * code ids in the wasmvm cache. The authority is defined in the keeper.
 */
export class MsgUnpinCodes extends JSONSerializable<
  MsgUnpinCodes.Amino,
  MsgUnpinCodes.Data,
  MsgUnpinCodes.Proto
> {
  /**
   * @param authority the address of the governance account
   * @param code_ids references the WASM codes
   */
  constructor(
    public authority: AccAddress,
    public code_ids: number[]
  ) {
    super()
  }

  public static fromAmino(data: MsgUnpinCodes.Amino): MsgUnpinCodes {
    const {
      value: { authority, code_ids },
    } = data
    return new MsgUnpinCodes(authority, code_ids.map(parseInt))
  }

  public toAmino(): MsgUnpinCodes.Amino {
    const { authority, code_ids } = this
    return {
      type: 'wasm/MsgUnpinCodes',
      value: {
        authority,
        code_ids: code_ids.map((id) => id.toFixed()),
      },
    }
  }

  public static fromData(data: MsgUnpinCodes.Data): MsgUnpinCodes {
    const { authority, code_ids } = data
    return new MsgUnpinCodes(authority, code_ids.map(parseInt))
  }

  public toData(): MsgUnpinCodes.Data {
    const { authority, code_ids } = this
    return {
      '@type': '/cosmwasm.wasm.v1.MsgUnpinCodes',
      authority,
      code_ids: code_ids.map((id) => id.toFixed()),
    }
  }

  public static fromProto(data: MsgUnpinCodes.Proto): MsgUnpinCodes {
    return new MsgUnpinCodes(
      data.authority,
      data.codeIds.map((id) => id.toNumber())
    )
  }

  public toProto(): MsgUnpinCodes.Proto {
    const { authority, code_ids } = this
    return MsgUnpinCodes_pb.fromPartial({
      authority,
      codeIds: code_ids,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmwasm.wasm.v1.MsgUnpinCodes',
      value: MsgUnpinCodes_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgUnpinCodes {
    return MsgUnpinCodes.fromProto(MsgUnpinCodes_pb.decode(msgAny.value))
  }
}

export namespace MsgUnpinCodes {
  export interface Amino {
    type: 'wasm/MsgUnpinCodes'
    value: {
      authority: AccAddress
      code_ids: string[]
    }
  }

  export interface Data {
    '@type': '/cosmwasm.wasm.v1.MsgUnpinCodes'
    authority: AccAddress
    code_ids: string[]
  }

  export type Proto = MsgUnpinCodes_pb
}
