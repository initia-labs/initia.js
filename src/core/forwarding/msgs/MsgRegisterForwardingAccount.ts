import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgRegisterAccount as MsgRegisterAccount_pb } from '@initia/initia.proto/noble/forwarding/v1/tx'

export class MsgRegisterForwardingAccount extends JSONSerializable<
  MsgRegisterForwardingAccount.Amino,
  MsgRegisterForwardingAccount.Data,
  MsgRegisterForwardingAccount.Proto
> {
  /**
   * @param signer
   * @param recipient
   * @param channel
   */
  constructor(
    public signer: AccAddress,
    public recipient: string,
    public channel: string
  ) {
    super()
  }

  public static fromAmino(
    data: MsgRegisterForwardingAccount.Amino
  ): MsgRegisterForwardingAccount {
    const {
      value: { signer, recipient, channel },
    } = data
    return new MsgRegisterForwardingAccount(signer, recipient, channel)
  }

  public toAmino(): MsgRegisterForwardingAccount.Amino {
    const { signer, recipient, channel } = this
    return {
      type: 'noble/forwarding/RegisterAccount',
      value: {
        signer,
        recipient,
        channel,
      },
    }
  }

  public static fromData(
    data: MsgRegisterForwardingAccount.Data
  ): MsgRegisterForwardingAccount {
    const { signer, recipient, channel } = data
    return new MsgRegisterForwardingAccount(signer, recipient, channel)
  }

  public toData(): MsgRegisterForwardingAccount.Data {
    const { signer, recipient, channel } = this
    return {
      '@type': '/noble.forwarding.v1.MsgRegisterAccount',
      signer,
      recipient,
      channel,
    }
  }

  public static fromProto(
    data: MsgRegisterForwardingAccount.Proto
  ): MsgRegisterForwardingAccount {
    return new MsgRegisterForwardingAccount(
      data.signer,
      data.recipient,
      data.channel
    )
  }

  public toProto(): MsgRegisterForwardingAccount.Proto {
    const { signer, recipient, channel } = this
    return MsgRegisterAccount_pb.fromPartial({
      signer,
      recipient,
      channel,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/noble.forwarding.v1.MsgRegisterAccount',
      value: MsgRegisterAccount_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgRegisterForwardingAccount {
    return MsgRegisterForwardingAccount.fromProto(
      MsgRegisterAccount_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgRegisterForwardingAccount {
  export interface Amino {
    type: 'noble/forwarding/RegisterAccount'
    value: {
      signer: AccAddress
      recipient: string
      channel: string
    }
  }

  export interface Data {
    '@type': '/noble.forwarding.v1.MsgRegisterAccount'
    signer: AccAddress
    recipient: string
    channel: string
  }

  export type Proto = MsgRegisterAccount_pb
}
