import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgStoreCodeAdmin as MsgStoreCodeAdmin_pb } from '@initia/initia.proto/miniwasm/wasmextension/v1/tx'
import { AccessConfigExt } from '../AccessConfigExt'

/**
 * MsgStoreCodeAdmin defines a message to submit Wasm code to the system with admin permission.
 */
export class MsgStoreCodeAdmin extends JSONSerializable<
  MsgStoreCodeAdmin.Amino,
  MsgStoreCodeAdmin.Data,
  MsgStoreCodeAdmin.Proto
> {
  /**
   * @param authority the actor that signed the messages
   * @param creator the actor that created the code
   * @param wasm_byte_code can be raw or gzip compressed
   * @param instantiate_permission access control to apply on contract creation, optional
   */
  constructor(
    public authority: AccAddress,
    public creator: AccAddress,
    public wasm_byte_code: string,
    public instantiate_permission?: AccessConfigExt
  ) {
    super()
  }

  public static fromAmino(data: MsgStoreCodeAdmin.Amino): MsgStoreCodeAdmin {
    const {
      value: { authority, creator, wasm_byte_code, instantiate_permission },
    } = data
    return new MsgStoreCodeAdmin(
      authority,
      creator,
      wasm_byte_code,
      instantiate_permission
        ? AccessConfigExt.fromAmino(instantiate_permission)
        : undefined
    )
  }

  public toAmino(): MsgStoreCodeAdmin.Amino {
    const { authority, creator, wasm_byte_code, instantiate_permission } = this
    return {
      type: 'wasmextension/MsgStoreCodeAdmin',
      value: {
        authority,
        creator,
        wasm_byte_code,
        instantiate_permission: instantiate_permission?.toAmino(),
      },
    }
  }

  public static fromData(data: MsgStoreCodeAdmin.Data): MsgStoreCodeAdmin {
    const { authority, creator, wasm_byte_code, instantiate_permission } = data
    return new MsgStoreCodeAdmin(
      authority,
      creator,
      wasm_byte_code,
      instantiate_permission
        ? AccessConfigExt.fromData(instantiate_permission)
        : undefined
    )
  }

  public toData(): MsgStoreCodeAdmin.Data {
    const { authority, creator, wasm_byte_code, instantiate_permission } = this
    return {
      '@type': '/miniwasm.wasmextension.v1.MsgStoreCodeAdmin',
      authority,
      creator,
      wasm_byte_code,
      instantiate_permission: instantiate_permission?.toData(),
    }
  }

  public static fromProto(data: MsgStoreCodeAdmin.Proto): MsgStoreCodeAdmin {
    return new MsgStoreCodeAdmin(
      data.authority,
      data.creator,
      Buffer.from(data.wasmByteCode).toString('base64'),
      data.instantiatePermission
        ? AccessConfigExt.fromProto(data.instantiatePermission)
        : undefined
    )
  }

  public toProto(): MsgStoreCodeAdmin.Proto {
    const { authority, creator, wasm_byte_code, instantiate_permission } = this
    return MsgStoreCodeAdmin_pb.fromPartial({
      authority,
      creator,
      wasmByteCode: Buffer.from(wasm_byte_code, 'base64'),
      instantiatePermission: instantiate_permission?.toProto(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/miniwasm.wasmextension.v1.MsgStoreCodeAdmin',
      value: MsgStoreCodeAdmin_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgStoreCodeAdmin {
    return MsgStoreCodeAdmin.fromProto(
      MsgStoreCodeAdmin_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgStoreCodeAdmin {
  export interface Amino {
    type: 'wasmextension/MsgStoreCodeAdmin'
    value: {
      authority: AccAddress
      creator: AccAddress
      wasm_byte_code: string
      instantiate_permission?: AccessConfigExt.Amino
    }
  }

  export interface Data {
    '@type': '/miniwasm.wasmextension.v1.MsgStoreCodeAdmin'
    authority: AccAddress
    creator: AccAddress
    wasm_byte_code: string
    instantiate_permission?: AccessConfigExt.Data
  }

  export type Proto = MsgStoreCodeAdmin_pb
}
