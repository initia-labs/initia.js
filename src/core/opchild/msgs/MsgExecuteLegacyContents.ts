import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { Content } from '../../gov/proposals';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgExecuteLegacyContents as MsgExecuteLegacyContents_pb } from '@initia/opinit.proto/opinit/opchild/v1/tx';

export class MsgExecuteLegacyContents extends JSONSerializable<
  MsgExecuteLegacyContents.Amino,
  MsgExecuteLegacyContents.Data,
  MsgExecuteLegacyContents.Proto
> {
  /**
   * @param sender the actor that signed the messages
   * @param contents the arbitrary legacy (gov) contents to be executed
   */
  constructor(public sender: AccAddress, public contents: Content[]) {
    super();
  }

  public static fromAmino(
    data: MsgExecuteLegacyContents.Amino
  ): MsgExecuteLegacyContents {
    const {
      value: { sender, contents },
    } = data;
    return new MsgExecuteLegacyContents(
      sender,
      contents.map(Content.fromAmino)
    );
  }

  public toAmino(): MsgExecuteLegacyContents.Amino {
    const { sender, contents } = this;
    return {
      type: 'opchild/MsgExecuteLegacyContents',
      value: {
        sender,
        contents: contents.map(content => content.toAmino()),
      },
    };
  }

  public static fromData(
    data: MsgExecuteLegacyContents.Data
  ): MsgExecuteLegacyContents {
    const { sender, contents } = data;
    return new MsgExecuteLegacyContents(sender, contents.map(Content.fromData));
  }

  public toData(): MsgExecuteLegacyContents.Data {
    const { sender, contents } = this;
    return {
      '@type': '/opinit.opchild.v1.MsgExecuteLegacyContents',
      sender,
      contents: contents.map(content => content.toData()),
    };
  }

  public static fromProto(
    data: MsgExecuteLegacyContents.Proto
  ): MsgExecuteLegacyContents {
    return new MsgExecuteLegacyContents(
      data.sender,
      data.contents.map(Content.fromProto)
    );
  }

  public toProto(): MsgExecuteLegacyContents.Proto {
    const { sender, contents } = this;
    return MsgExecuteLegacyContents_pb.fromPartial({
      sender,
      contents: contents.map(content => content.packAny()),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.opchild.v1.MsgExecuteLegacyContents',
      value: MsgExecuteLegacyContents_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgExecuteLegacyContents {
    return MsgExecuteLegacyContents.fromProto(
      MsgExecuteLegacyContents_pb.decode(msgAny.value)
    );
  }
}

export namespace MsgExecuteLegacyContents {
  export interface Amino {
    type: 'opchild/MsgExecuteLegacyContents';
    value: {
      sender: AccAddress;
      contents: Content.Amino[];
    };
  }

  export interface Data {
    '@type': '/opinit.opchild.v1.MsgExecuteLegacyContents';
    sender: AccAddress;
    contents: Content.Data[];
  }

  export type Proto = MsgExecuteLegacyContents_pb;
}
