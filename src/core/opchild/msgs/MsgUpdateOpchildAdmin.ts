import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgUpdateAdmin as MsgUpdateAdmin_pb } from '@initia/opinit.proto/opinit/opchild/v1/tx'

/**
 * MsgUpdateOpchildAdmin is a message to update the opchild admin address.
 */
export class MsgUpdateOpchildAdmin extends JSONSerializable<
  MsgUpdateOpchildAdmin.Amino,
  MsgUpdateOpchildAdmin.Data,
  MsgUpdateOpchildAdmin.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param new_admin
   */
  constructor(
    public authority: AccAddress,
    public new_admin: AccAddress
  ) {
    super()
  }

  public static fromAmino(
    data: MsgUpdateOpchildAdmin.Amino
  ): MsgUpdateOpchildAdmin {
    const {
      value: { authority, new_admin },
    } = data
    return new MsgUpdateOpchildAdmin(authority, new_admin)
  }

  public toAmino(): MsgUpdateOpchildAdmin.Amino {
    const { authority, new_admin } = this
    return {
      type: 'opchild/MsgUpdateAdmin',
      value: {
        authority,
        new_admin,
      },
    }
  }

  public static fromData(
    data: MsgUpdateOpchildAdmin.Data
  ): MsgUpdateOpchildAdmin {
    const { authority, new_admin } = data
    return new MsgUpdateOpchildAdmin(authority, new_admin)
  }

  public toData(): MsgUpdateOpchildAdmin.Data {
    const { authority, new_admin } = this
    return {
      '@type': '/opinit.opchild.v1.MsgUpdateAdmin',
      authority,
      new_admin,
    }
  }

  public static fromProto(
    data: MsgUpdateOpchildAdmin.Proto
  ): MsgUpdateOpchildAdmin {
    return new MsgUpdateOpchildAdmin(data.authority, data.newAdmin)
  }

  public toProto(): MsgUpdateOpchildAdmin.Proto {
    const { authority, new_admin } = this
    return MsgUpdateAdmin_pb.fromPartial({
      authority,
      newAdmin: new_admin,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.opchild.v1.MsgUpdateAdmin',
      value: MsgUpdateAdmin_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgUpdateOpchildAdmin {
    return MsgUpdateOpchildAdmin.fromProto(
      MsgUpdateAdmin_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgUpdateOpchildAdmin {
  export interface Amino {
    type: 'opchild/MsgUpdateAdmin'
    value: {
      authority: AccAddress
      new_admin: AccAddress
    }
  }

  export interface Data {
    '@type': '/opinit.opchild.v1.MsgUpdateAdmin'
    authority: AccAddress
    new_admin: AccAddress
  }

  export type Proto = MsgUpdateAdmin_pb
}
