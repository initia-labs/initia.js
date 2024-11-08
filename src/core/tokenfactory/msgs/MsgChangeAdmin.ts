import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgChangeAdmin as MsgChangeAdmin_pb } from '@initia/initia.proto/miniwasm/tokenfactory/v1/tx'

/**
 * MsgChangeAdmin allows an admin account to reassign adminship of a denom to a new account.
 */
export class MsgChangeAdmin extends JSONSerializable<
  MsgChangeAdmin.Amino,
  MsgChangeAdmin.Data,
  MsgChangeAdmin.Proto
> {
  /**
   * @param sender
   * @param denom
   * @param new_admin
   */
  constructor(
    public sender: AccAddress,
    public denom: string,
    public new_admin: AccAddress
  ) {
    super()
  }

  public static fromAmino(data: MsgChangeAdmin.Amino): MsgChangeAdmin {
    const {
      value: { sender, denom, new_admin },
    } = data

    return new MsgChangeAdmin(sender, denom, new_admin)
  }

  public toAmino(): MsgChangeAdmin.Amino {
    const { sender, denom, new_admin } = this
    return {
      type: 'tokenfactory/MsgChangeAdmin',
      value: {
        sender,
        denom,
        new_admin,
      },
    }
  }

  public static fromData(data: MsgChangeAdmin.Data): MsgChangeAdmin {
    const { sender, denom, new_admin } = data
    return new MsgChangeAdmin(sender, denom, new_admin)
  }

  public toData(): MsgChangeAdmin.Data {
    const { sender, denom, new_admin } = this
    return {
      '@type': '/miniwasm.tokenfactory.v1.MsgChangeAdmin',
      sender,
      denom,
      new_admin,
    }
  }

  public static fromProto(data: MsgChangeAdmin.Proto): MsgChangeAdmin {
    return new MsgChangeAdmin(data.sender, data.denom, data.newAdmin)
  }

  public toProto(): MsgChangeAdmin.Proto {
    const { sender, denom, new_admin } = this
    return MsgChangeAdmin_pb.fromPartial({
      sender,
      denom,
      newAdmin: new_admin,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/miniwasm.tokenfactory.v1.MsgChangeAdmin',
      value: MsgChangeAdmin_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgChangeAdmin {
    return MsgChangeAdmin.fromProto(MsgChangeAdmin_pb.decode(msgAny.value))
  }
}

export namespace MsgChangeAdmin {
  export interface Amino {
    type: 'tokenfactory/MsgChangeAdmin'
    value: {
      sender: AccAddress
      denom: string
      new_admin: AccAddress
    }
  }

  export interface Data {
    '@type': '/miniwasm.tokenfactory.v1.MsgChangeAdmin'
    sender: AccAddress
    denom: string
    new_admin: AccAddress
  }

  export type Proto = MsgChangeAdmin_pb
}
