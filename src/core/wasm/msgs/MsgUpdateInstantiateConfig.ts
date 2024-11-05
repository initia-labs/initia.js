import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgUpdateInstantiateConfig as MsgUpdateInstantiateConfig_pb } from '@initia/initia.proto/cosmwasm/wasm/v1/tx'
import { AccessConfig } from '../AccessConfig'
import Long from 'long'

export class MsgUpdateInstantiateConfig extends JSONSerializable<
  MsgUpdateInstantiateConfig.Amino,
  MsgUpdateInstantiateConfig.Data,
  MsgUpdateInstantiateConfig.Proto
> {
  /**
   * @param sender the actor that signed the messages
   * @param code_id references the stored WASM code
   * @param new_instantiate_permission the new access control
   */
  constructor(
    public sender: AccAddress,
    public code_id: number,
    public new_instantiate_permission: AccessConfig
  ) {
    super()
  }

  public static fromAmino(
    data: MsgUpdateInstantiateConfig.Amino
  ): MsgUpdateInstantiateConfig {
    const {
      value: { sender, code_id, new_instantiate_permission },
    } = data
    return new MsgUpdateInstantiateConfig(
      sender,
      parseInt(code_id),
      AccessConfig.fromAmino(new_instantiate_permission)
    )
  }

  public toAmino(): MsgUpdateInstantiateConfig.Amino {
    const { sender, code_id, new_instantiate_permission } = this
    return {
      type: 'wasm/MsgUpdateInstantiateConfig',
      value: {
        sender,
        code_id: code_id.toString(),
        new_instantiate_permission: new_instantiate_permission.toAmino(),
      },
    }
  }

  public static fromData(
    data: MsgUpdateInstantiateConfig.Data
  ): MsgUpdateInstantiateConfig {
    const { sender, code_id, new_instantiate_permission } = data
    return new MsgUpdateInstantiateConfig(
      sender,
      parseInt(code_id),
      AccessConfig.fromData(new_instantiate_permission)
    )
  }

  public toData(): MsgUpdateInstantiateConfig.Data {
    const { sender, code_id, new_instantiate_permission } = this
    return {
      '@type': '/cosmwasm.wasm.v1.MsgUpdateInstantiateConfig',
      sender,
      code_id: code_id.toString(),
      new_instantiate_permission: new_instantiate_permission.toData(),
    }
  }

  public static fromProto(
    data: MsgUpdateInstantiateConfig.Proto
  ): MsgUpdateInstantiateConfig {
    return new MsgUpdateInstantiateConfig(
      data.sender,
      data.codeId.toNumber(),
      AccessConfig.fromProto(
        data.newInstantiatePermission as AccessConfig.Proto
      )
    )
  }

  public toProto(): MsgUpdateInstantiateConfig.Proto {
    const { sender, code_id, new_instantiate_permission } = this
    return MsgUpdateInstantiateConfig_pb.fromPartial({
      sender,
      codeId: Long.fromNumber(code_id),
      newInstantiatePermission: new_instantiate_permission.toProto(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmwasm.wasm.v1.MsgUpdateInstantiateConfig',
      value: MsgUpdateInstantiateConfig_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgUpdateInstantiateConfig {
    return MsgUpdateInstantiateConfig.fromProto(
      MsgUpdateInstantiateConfig_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgUpdateInstantiateConfig {
  export interface Amino {
    type: 'wasm/MsgUpdateInstantiateConfig'
    value: {
      sender: AccAddress
      code_id: string
      new_instantiate_permission: AccessConfig.Amino
    }
  }

  export interface Data {
    '@type': '/cosmwasm.wasm.v1.MsgUpdateInstantiateConfig'
    sender: AccAddress
    code_id: string
    new_instantiate_permission: AccessConfig.Data
  }

  export type Proto = MsgUpdateInstantiateConfig_pb
}
