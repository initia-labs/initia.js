import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgCreateDenom as MsgCreateDenom_pb } from '@initia/initia.proto/miniwasm/tokenfactory/v1/tx'

/**
 * MsgCreateDenom allows an account to create a new denom. It requires a sender
 * address and a sub denomination. The (sender_address, sub_denomination) tuple
 * must be unique and cannot be re-used.
 *
 * The resulting denom created is defined as
 * <factory/{creatorAddress}/{subdenom}>. The resulting denom's admin is
 * originally set to be the creator, but this can be changed later. The token
 * denom does not indicate the current admin.
 */
export class MsgCreateDenom extends JSONSerializable<
  MsgCreateDenom.Amino,
  MsgCreateDenom.Data,
  MsgCreateDenom.Proto
> {
  /**
   * @param sender the actor that signed the messages
   * @param subdenom can be up to 44 "alphanumeric" characters long
   */
  constructor(
    public sender: AccAddress,
    public subdenom: string
  ) {
    super()
  }

  public static fromAmino(data: MsgCreateDenom.Amino): MsgCreateDenom {
    const {
      value: { sender, subdenom },
    } = data

    return new MsgCreateDenom(sender, subdenom)
  }

  public toAmino(): MsgCreateDenom.Amino {
    const { sender, subdenom } = this
    return {
      type: 'tokenfactory/MsgCreateDenom',
      value: {
        sender,
        subdenom,
      },
    }
  }

  public static fromData(data: MsgCreateDenom.Data): MsgCreateDenom {
    const { sender, subdenom } = data
    return new MsgCreateDenom(sender, subdenom)
  }

  public toData(): MsgCreateDenom.Data {
    const { sender, subdenom } = this
    return {
      '@type': '/miniwasm.tokenfactory.v1.MsgCreateDenom',
      sender,
      subdenom,
    }
  }

  public static fromProto(data: MsgCreateDenom.Proto): MsgCreateDenom {
    return new MsgCreateDenom(data.sender, data.subdenom)
  }

  public toProto(): MsgCreateDenom.Proto {
    const { sender, subdenom } = this
    return MsgCreateDenom_pb.fromPartial({
      sender,
      subdenom,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/miniwasm.tokenfactory.v1.MsgCreateDenom',
      value: MsgCreateDenom_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgCreateDenom {
    return MsgCreateDenom.fromProto(MsgCreateDenom_pb.decode(msgAny.value))
  }
}

export namespace MsgCreateDenom {
  export interface Amino {
    type: 'tokenfactory/MsgCreateDenom'
    value: {
      sender: AccAddress
      subdenom: string
    }
  }

  export interface Data {
    '@type': '/miniwasm.tokenfactory.v1.MsgCreateDenom'
    sender: AccAddress
    subdenom: string
  }

  export type Proto = MsgCreateDenom_pb
}
