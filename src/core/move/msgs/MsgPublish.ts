import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgPublish as MsgPublish_pb } from '@initia/initia.proto/initia/move/v1/tx';
import { UpgradePolicy } from '@initia/initia.proto/initia/move/v1/types';

export class MsgPublish extends JSONSerializable<
  MsgPublish.Amino,
  MsgPublish.Data,
  MsgPublish.Proto
> {
  /**
   * @param sender the actor that signed the messages
   * @param code_bytes raw move module bytes code
   * @param upgrade_policy arbitrary `0`, compatible `1`, immutable `2`
   */
  constructor(
    public sender: AccAddress,
    public code_bytes: string[],
    public upgrade_policy: UpgradePolicy
  ) {
    super();
  }

  public static fromAmino(data: MsgPublish.Amino): MsgPublish {
    const {
      value: { sender, code_bytes, upgrade_policy },
    } = data;
    return new MsgPublish(
      sender,
      code_bytes,
      upgrade_policy ? upgrade_policy : 0
    );
  }

  public toAmino(): MsgPublish.Amino {
    const { sender, code_bytes, upgrade_policy } = this;
    return {
      type: 'move/MsgPublish',
      value: {
        sender,
        code_bytes,
        upgrade_policy: upgrade_policy === 0 ? undefined : upgrade_policy,
      },
    };
  }

  public static fromProto(proto: MsgPublish.Proto): MsgPublish {
    return new MsgPublish(
      proto.sender,
      proto.codeBytes.map(code => Buffer.from(code).toString('base64')),
      proto.upgradePolicy
    );
  }

  public toProto(): MsgPublish.Proto {
    const { sender, code_bytes, upgrade_policy } = this;
    return MsgPublish_pb.fromPartial({
      sender,
      codeBytes: code_bytes.map(code => Buffer.from(code, 'base64')),
      upgradePolicy: upgrade_policy,
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.move.v1.MsgPublish',
      value: MsgPublish_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgPublish {
    return MsgPublish.fromProto(MsgPublish_pb.decode(msgAny.value));
  }

  public static fromData(data: MsgPublish.Data): MsgPublish {
    const { sender, code_bytes, upgrade_policy } = data;
    return new MsgPublish(sender, code_bytes, upgrade_policy);
  }

  public toData(): MsgPublish.Data {
    const { sender, code_bytes, upgrade_policy } = this;
    return {
      '@type': '/initia.move.v1.MsgPublish',
      sender,
      code_bytes,
      upgrade_policy,
    };
  }
}

export namespace MsgPublish {
  export interface Amino {
    type: 'move/MsgPublish';
    value: {
      sender: AccAddress;
      code_bytes: string[];
      upgrade_policy?: UpgradePolicy;
    };
  }

  export interface Data {
    '@type': '/initia.move.v1.MsgPublish';
    sender: AccAddress;
    code_bytes: string[];
    upgrade_policy: UpgradePolicy;
  }

  export type Proto = MsgPublish_pb;
}

export { UpgradePolicy };
