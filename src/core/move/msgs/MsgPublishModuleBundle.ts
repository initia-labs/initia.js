import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgPublishModuleBundle as MsgPublishModuleBundle_pb } from '@initia/initia.proto/initia/move/v1/tx';

export class MsgPublishModuleBundle extends JSONSerializable<
  MsgPublishModuleBundle.Amino,
  MsgPublishModuleBundle.Data,
  MsgPublishModuleBundle.Proto
> {
  /**
   * @param sender code creator
   * @param code_bytes base64-encoded bytecode contents
   */
  constructor(public sender: AccAddress, public code_bytes: string[]) {
    super();
  }

  public static fromAmino(data: MsgPublishModuleBundle.Amino): MsgPublishModuleBundle {
    const {
      value: { sender, code_bytes },
    } = data;
    return new MsgPublishModuleBundle(sender, code_bytes);
  }

  public toAmino(): MsgPublishModuleBundle.Amino {
    const { sender, code_bytes } = this;
    return {
      type: 'move/MsgPublishModuleBundle',
      value: {
        sender,
        code_bytes,
      },
    };
  }

  public static fromProto(proto: MsgPublishModuleBundle.Proto): MsgPublishModuleBundle {
    return new MsgPublishModuleBundle(
      proto.sender,
      proto.codeBytes.map((code) => Buffer.from(code).toString('base64'))
    );
  }

  public toProto(): MsgPublishModuleBundle.Proto {
    const { sender, code_bytes } = this;
    return MsgPublishModuleBundle_pb.fromPartial({
      sender,
      codeBytes: code_bytes.map((code) => Buffer.from(code, 'base64')),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.move.v1.MsgPublishModuleBundle',
      value: MsgPublishModuleBundle_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgPublishModuleBundle {
    return MsgPublishModuleBundle.fromProto(MsgPublishModuleBundle_pb.decode(msgAny.value));
  }

  public static fromData(data: MsgPublishModuleBundle.Data): MsgPublishModuleBundle {
    const { sender, code_bytes } = data;
    return new MsgPublishModuleBundle(sender, code_bytes);
  }

  public toData(): MsgPublishModuleBundle.Data {
    const { sender, code_bytes } = this;
    return {
      '@type': '/initia.move.v1.MsgPublishModuleBundle',
      sender,
      code_bytes,
    };
  }
}

export namespace MsgPublishModuleBundle {
  export interface Amino {
    type: 'move/MsgPublishModuleBundle';
    value: {
      sender: AccAddress;
      code_bytes: string[];
    };
  }

  export interface Data {
    '@type': '/initia.move.v1.MsgPublishModuleBundle';
    sender: AccAddress;
    code_bytes: string[];
  }

  export type Proto = MsgPublishModuleBundle_pb;
}
