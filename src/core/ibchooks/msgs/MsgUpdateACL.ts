import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgUpdateACL as MsgUpdateACL_pb } from '@initia/initia.proto/initia/ibchooks/v1/tx'

/**
 * MsgUpdateACL is the message to update ACL of an address.
 */
export class MsgUpdateACL extends JSONSerializable<
  MsgUpdateACL.Amino,
  MsgUpdateACL.Data,
  MsgUpdateACL.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param address contract address (wasm, evm) or a contract deployer address (move)
   * @param allowed the flag whether this address is allowed to use hook or not
   */
  constructor(
    public authority: AccAddress,
    public address: AccAddress,
    public allowed: boolean
  ) {
    super()
  }

  public static fromAmino(data: MsgUpdateACL.Amino): MsgUpdateACL {
    const {
      value: { authority, address, allowed },
    } = data
    return new MsgUpdateACL(authority, address, allowed)
  }

  public toAmino(): MsgUpdateACL.Amino {
    const { authority, address, allowed } = this
    return {
      type: 'ibchooks/MsgUpdateACL',
      value: {
        authority,
        address,
        allowed,
      },
    }
  }

  public static fromData(data: MsgUpdateACL.Data): MsgUpdateACL {
    const { authority, address, allowed } = data
    return new MsgUpdateACL(authority, address, allowed)
  }

  public toData(): MsgUpdateACL.Data {
    const { authority, address, allowed } = this
    return {
      '@type': '/initia.ibchooks.v1.MsgUpdateACL',
      authority,
      address,
      allowed,
    }
  }

  public static fromProto(data: MsgUpdateACL.Proto): MsgUpdateACL {
    return new MsgUpdateACL(data.authority, data.address, data.allowed)
  }

  public toProto(): MsgUpdateACL.Proto {
    const { authority, address, allowed } = this
    return MsgUpdateACL_pb.fromPartial({
      authority,
      address,
      allowed,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.ibchooks.v1.MsgUpdateACL',
      value: MsgUpdateACL_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgUpdateACL {
    return MsgUpdateACL.fromProto(MsgUpdateACL_pb.decode(msgAny.value))
  }
}

export namespace MsgUpdateACL {
  export interface Amino {
    type: 'ibchooks/MsgUpdateACL'
    value: {
      authority: AccAddress
      address: AccAddress
      allowed: boolean
    }
  }

  export interface Data {
    '@type': '/initia.ibchooks.v1.MsgUpdateACL'
    authority: AccAddress
    address: AccAddress
    allowed: boolean
  }

  export type Proto = MsgUpdateACL_pb
}
