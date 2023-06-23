import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgCancelUpgrade as MsgCancelUpgrade_pb } from '@initia/initia.proto/cosmos/upgrade/v1beta1/tx';

/**
 * MsgCancelUpgrade is a governance operation for cancelling a previously approved software upgrade
 */
export class MsgCancelUpgrade extends JSONSerializable<
  MsgCancelUpgrade.Amino,
  MsgCancelUpgrade.Data,
  MsgCancelUpgrade.Proto
> {
  /**
   *
   * @param authority the address that controls the module
   * @param plan the upgrade plan
   */
  constructor(public authority: AccAddress) {
    super();
  }

  public static fromAmino(data: MsgCancelUpgrade.Amino): MsgCancelUpgrade {
    const {
      value: { authority },
    } = data;
    return new MsgCancelUpgrade(authority);
  }

  public toAmino(): MsgCancelUpgrade.Amino {
    const { authority } = this;
    return {
      type: 'cosmos-sdk/MsgCancelUpgrade',
      value: { authority },
    };
  }

  public static fromData(data: MsgCancelUpgrade.Data): MsgCancelUpgrade {
    const { authority } = data;
    return new MsgCancelUpgrade(authority);
  }

  public toData(): MsgCancelUpgrade.Data {
    const { authority } = this;
    return {
      '@type': '/cosmos.upgrade.v1beta1.MsgCancelUpgrade',
      authority,
    };
  }

  public static fromProto(proto: MsgCancelUpgrade.Proto): MsgCancelUpgrade {
    return new MsgCancelUpgrade(proto.authority);
  }

  public toProto(): MsgCancelUpgrade.Proto {
    const { authority } = this;
    return MsgCancelUpgrade_pb.fromPartial({
      authority,
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.upgrade.v1beta1.MsgCancelUpgrade',
      value: MsgCancelUpgrade_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgCancelUpgrade {
    return MsgCancelUpgrade.fromProto(MsgCancelUpgrade_pb.decode(msgAny.value));
  }
}

export namespace MsgCancelUpgrade {
  export interface Amino {
    type: 'cosmos-sdk/MsgCancelUpgrade';
    value: {
      authority: AccAddress;
    };
  }

  export interface Data {
    '@type': '/cosmos.upgrade.v1beta1.MsgCancelUpgrade';
    authority: AccAddress;
  }

  export type Proto = MsgCancelUpgrade_pb;
}
