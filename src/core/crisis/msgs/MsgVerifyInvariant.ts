import { JSONSerializable } from '../../../util/json'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgVerifyInvariant as MsgVerifyInvariant_pb } from '@initia/initia.proto/cosmos/crisis/v1beta1/tx'
import { AccAddress } from '../../bech32'

/**
 * MsgVerifyInvariant represents a message to verify a particular invariance.
 */
export class MsgVerifyInvariant extends JSONSerializable<
  MsgVerifyInvariant.Amino,
  MsgVerifyInvariant.Data,
  MsgVerifyInvariant.Proto
> {
  /**
   * @param sender the account address of private key to send coins to fee collector account
   * @param invariant_module_name name of the invariant module
   * @param invariantRoute the msg's invariant route
   */
  constructor(
    public sender: AccAddress,
    public invariant_module_name: string,
    public invariant_route: string
  ) {
    super()
  }

  public static fromAmino(data: MsgVerifyInvariant.Amino): MsgVerifyInvariant {
    const {
      value: { sender, invariant_module_name, invariant_route },
    } = data
    return new MsgVerifyInvariant(
      sender,
      invariant_module_name,
      invariant_route
    )
  }

  public toAmino(): MsgVerifyInvariant.Amino {
    throw new Error('MsgVerifyInvarant is not allowed to send')
  }

  public static fromData(data: MsgVerifyInvariant.Data): MsgVerifyInvariant {
    const { sender, invariant_module_name, invariant_route } = data

    return new MsgVerifyInvariant(
      sender,
      invariant_module_name,
      invariant_route
    )
  }

  public toData(): MsgVerifyInvariant.Data {
    const { sender, invariant_module_name, invariant_route } = this
    return {
      '@type': '/cosmos.crisis.v1beta1.MsgVerifyInvariant',
      sender,
      invariant_module_name,
      invariant_route,
    }
  }

  public static fromProto(proto: MsgVerifyInvariant.Proto): MsgVerifyInvariant {
    return new MsgVerifyInvariant(
      proto.sender,
      proto.invariantModuleName,
      proto.invariantRoute
    )
  }

  public toProto(): MsgVerifyInvariant.Proto {
    throw new Error('MsgVerifyInvarant is not allowed to send')
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.crisis.v1beta1.MsgVerifyInvariant',
      value: MsgVerifyInvariant_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgVerifyInvariant {
    return MsgVerifyInvariant.fromProto(
      MsgVerifyInvariant_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgVerifyInvariant {
  export interface Amino {
    type: 'cosmos-sdk/MsgVerifyInvariant'
    value: {
      sender: AccAddress
      invariant_module_name: string
      invariant_route: string
    }
  }

  export interface Data {
    '@type': '/cosmos.crisis.v1beta1.MsgVerifyInvariant'
    sender: AccAddress
    invariant_module_name: string
    invariant_route: string
  }

  export type Proto = MsgVerifyInvariant_pb
}
