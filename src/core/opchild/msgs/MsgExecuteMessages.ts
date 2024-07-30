import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Msg } from '../../Msg'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgExecuteMessages as MsgExecuteMessages_pb } from '@initia/opinit.proto/opinit/opchild/v1/tx'

export class MsgExecuteMessages extends JSONSerializable<
  MsgExecuteMessages.Amino,
  MsgExecuteMessages.Data,
  MsgExecuteMessages.Proto
> {
  /**
   * @param sender the actor that signed the messages
   * @param messages the arbitrary messages to be executed
   */
  constructor(
    public sender: AccAddress,
    public messages: Msg[]
  ) {
    super()
  }

  public static fromAmino(data: MsgExecuteMessages.Amino): MsgExecuteMessages {
    const {
      value: { sender, messages },
    } = data
    return new MsgExecuteMessages(sender, messages.map(Msg.fromAmino))
  }

  public toAmino(): MsgExecuteMessages.Amino {
    const { sender, messages } = this
    return {
      type: 'opchild/MsgExecuteMessages',
      value: {
        sender,
        messages: messages.map((msg) => msg.toAmino()),
      },
    }
  }

  public static fromData(data: MsgExecuteMessages.Data): MsgExecuteMessages {
    const { sender, messages } = data
    return new MsgExecuteMessages(sender, messages.map(Msg.fromData))
  }

  public toData(): MsgExecuteMessages.Data {
    const { sender, messages } = this
    return {
      '@type': '/opinit.opchild.v1.MsgExecuteMessages',
      sender,
      messages: messages.map((msg) => msg.toData()),
    }
  }

  public static fromProto(data: MsgExecuteMessages.Proto): MsgExecuteMessages {
    return new MsgExecuteMessages(data.sender, data.messages.map(Msg.fromProto))
  }

  public toProto(): MsgExecuteMessages.Proto {
    const { sender, messages } = this
    return MsgExecuteMessages_pb.fromPartial({
      sender,
      messages: messages.map((msg) => msg.packAny()),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.opchild.v1.MsgExecuteMessages',
      value: MsgExecuteMessages_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgExecuteMessages {
    return MsgExecuteMessages.fromProto(
      MsgExecuteMessages_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgExecuteMessages {
  export interface Amino {
    type: 'opchild/MsgExecuteMessages'
    value: {
      sender: AccAddress
      messages: Msg.Amino[]
    }
  }

  export interface Data {
    '@type': '/opinit.opchild.v1.MsgExecuteMessages'
    sender: AccAddress
    messages: Msg.Data[]
  }

  export type Proto = MsgExecuteMessages_pb
}
