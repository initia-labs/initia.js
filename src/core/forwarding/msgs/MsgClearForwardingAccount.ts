import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgClearAccount as MsgClearAccount_pb } from '@initia/initia.proto/noble/forwarding/v1/tx'

export class MsgClearForwardingAccount extends JSONSerializable<
  MsgClearForwardingAccount.Amino,
  MsgClearForwardingAccount.Data,
  MsgClearForwardingAccount.Proto
> {
  /**
   * @param signer
   * @param address
   */
  constructor(
    public signer: AccAddress,
    public address: string
  ) {
    super()
  }

  public static fromAmino(
    data: MsgClearForwardingAccount.Amino
  ): MsgClearForwardingAccount {
    const {
      value: { signer, address },
    } = data
    return new MsgClearForwardingAccount(signer, address)
  }

  public toAmino(): MsgClearForwardingAccount.Amino {
    const { signer, address } = this
    return {
      type: 'noble/forwarding/ClearAccount',
      value: {
        signer,
        address,
      },
    }
  }

  public static fromData(
    data: MsgClearForwardingAccount.Data
  ): MsgClearForwardingAccount {
    const { signer, address } = data
    return new MsgClearForwardingAccount(signer, address)
  }

  public toData(): MsgClearForwardingAccount.Data {
    const { signer, address } = this
    return {
      '@type': '/noble.forwarding.v1.MsgClearAccount',
      signer,
      address,
    }
  }

  public static fromProto(
    data: MsgClearForwardingAccount.Proto
  ): MsgClearForwardingAccount {
    return new MsgClearForwardingAccount(data.signer, data.address)
  }

  public toProto(): MsgClearForwardingAccount.Proto {
    const { signer, address } = this
    return MsgClearAccount_pb.fromPartial({
      signer,
      address,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/noble.forwarding.v1.MsgClearAccount',
      value: MsgClearAccount_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgClearForwardingAccount {
    return MsgClearForwardingAccount.fromProto(
      MsgClearAccount_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgClearForwardingAccount {
  export interface Amino {
    type: 'noble/forwarding/ClearAccount'
    value: {
      signer: AccAddress
      address: string
    }
  }

  export interface Data {
    '@type': '/noble.forwarding.v1.MsgClearAccount'
    signer: AccAddress
    address: string
  }

  export type Proto = MsgClearAccount_pb
}
