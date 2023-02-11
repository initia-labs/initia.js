import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgPublish as MsgPublish_pb } from '@initia/initia.proto/initia/move/v1/tx';

export class MsgPublish extends JSONSerializable<
  MsgPublish.Amino,
  MsgPublish.Data,
  MsgPublish.Proto
> {
  /**
   * @param sender code creator
   * @param code_bytes base64-encoded bytecode contents
   */
  constructor(public sender: AccAddress, public code_bytes: string[]) {
    super();
  }

  public static fromAmino(
    data: MsgPublish.Amino
  ): MsgPublish {
    const {
      value: { sender, code_bytes },
    } = data;
    return new MsgPublish(sender, code_bytes);
  }

  public toAmino(): MsgPublish.Amino {
    const { sender, code_bytes } = this;
    return {
      type: 'move/MsgPublish',
      value: {
        sender,
        code_bytes,
      },
    };
  }

  public static fromProto(
    proto: MsgPublish.Proto
  ): MsgPublish {
    return new MsgPublish(
      proto.sender,
      proto.codeBytes.map(code => Buffer.from(code).toString('base64'))
    );
  }

  public toProto(): MsgPublish.Proto {
    const { sender, code_bytes } = this;
    return MsgPublish_pb.fromPartial({
      sender,
      codeBytes: code_bytes.map(code => Buffer.from(code, 'base64')),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.move.v1.MsgPublish',
      value: MsgPublish_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgPublish {
    return MsgPublish.fromProto(
      MsgPublish_pb.decode(msgAny.value)
    );
  }

  public static fromData(
    data: MsgPublish.Data
  ): MsgPublish {
    const { sender, code_bytes } = data;
    return new MsgPublish(sender, code_bytes);
  }

  public toData(): MsgPublish.Data {
    const { sender, code_bytes } = this;
    return {
      '@type': '/initia.move.v1.MsgPublish',
      sender,
      code_bytes,
    };
  }
}

export namespace MsgPublish {
  export interface Amino {
    type: 'move/MsgPublish';
    value: {
      sender: AccAddress;
      code_bytes: string[];
    };
  }

  export interface Data {
    '@type': '/initia.move.v1.MsgPublish';
    sender: AccAddress;
    code_bytes: string[];
  }

  export type Proto = MsgPublish_pb;
}
