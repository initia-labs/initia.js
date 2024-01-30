import { JSONSerializable } from '../../../../../util/json';
import { AccAddress } from '../../../../bech32';
import { MsgDeactivate as MsgDeactivate_pb } from '@initia/initia.proto/ibc/applications/fetchprice/v1/tx';
import { Any } from '@initia/initia.proto/google/protobuf/any';

export class MsgDeactivate extends JSONSerializable<
  MsgDeactivate.Amino,
  MsgDeactivate.Data,
  MsgDeactivate.Proto
> {
  /**
   * @param authority the address that controls the module
   */
  constructor(public authority: AccAddress) {
    super();
  }

  public static fromAmino(data: MsgDeactivate.Amino): MsgDeactivate {
    return new MsgDeactivate(data.value.authority);
  }

  public toAmino(): MsgDeactivate.Amino {
    return {
      type: 'fetchprice/MsgDeactivate',
      value: {
        authority: this.authority,
      },
    };
  }

  public static fromData(data: MsgDeactivate.Data): MsgDeactivate {
    return new MsgDeactivate(data.authority);
  }

  public toData(): MsgDeactivate.Data {
    return {
      '@type': '/ibc.applications.fetchprice.v1.MsgDeactivate',
      authority: this.authority,
    };
  }

  public static fromProto(data: MsgDeactivate.Proto): MsgDeactivate {
    return new MsgDeactivate(data.authority);
  }

  public toProto(): MsgDeactivate.Proto {
    return MsgDeactivate_pb.fromPartial({
      authority: this.authority,
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.applications.fetchprice.v1.MsgDeactivate',
      value: MsgDeactivate_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgDeactivate {
    return MsgDeactivate.fromProto(MsgDeactivate_pb.decode(msgAny.value));
  }
}

export namespace MsgDeactivate {
  export interface Amino {
    type: 'fetchprice/MsgDeactivate';
    value: {
      authority: AccAddress;
    };
  }

  export interface Data {
    '@type': '/ibc.applications.fetchprice.v1.MsgDeactivate';
    authority: AccAddress;
  }

  export type Proto = MsgDeactivate_pb;
}
