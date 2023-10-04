import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgDelist as MsgDelist_pb } from '@initia/initia.proto/initia/move/v1/tx';

export class MsgDelist extends JSONSerializable<
  MsgDelist.Amino,
  MsgDelist.Data,
  MsgDelist.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param metadata_lp Dex coin LP metadata address
   */
  constructor(public authority: AccAddress, public metadata_lp: string) {
    super();
  }

  public static fromAmino(data: MsgDelist.Amino): MsgDelist {
    const {
      value: { authority, metadata_lp },
    } = data;

    return new MsgDelist(authority, metadata_lp);
  }

  public toAmino(): MsgDelist.Amino {
    const { authority, metadata_lp } = this;

    return {
      type: 'move/MsgDelist',
      value: {
        authority,
        metadata_lp,
      },
    };
  }

  public static fromData(data: MsgDelist.Data): MsgDelist {
    const { authority, metadata_lp } = data;

    return new MsgDelist(authority, metadata_lp);
  }

  public toData(): MsgDelist.Data {
    const { authority, metadata_lp } = this;

    return {
      '@type': '/initia.move.v1.MsgDelist',
      authority,
      metadata_lp,
    };
  }

  public static fromProto(data: MsgDelist.Proto): MsgDelist {
    return new MsgDelist(data.authority, data.metadataLp);
  }

  public toProto(): MsgDelist.Proto {
    const { authority, metadata_lp } = this;

    return MsgDelist_pb.fromPartial({
      authority,
      metadataLp: metadata_lp,
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.move.v1.MsgDelist',
      value: MsgDelist_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgDelist {
    return MsgDelist.fromProto(MsgDelist_pb.decode(msgAny.value));
  }
}

export namespace MsgDelist {
  export interface Amino {
    type: 'move/MsgDelist';
    value: {
      authority: AccAddress;
      metadata_lp: string;
    };
  }

  export interface Data {
    '@type': '/initia.move.v1.MsgDelist';
    authority: AccAddress;
    metadata_lp: string;
  }

  export type Proto = MsgDelist_pb;
}
