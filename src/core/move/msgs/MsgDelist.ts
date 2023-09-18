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
   * @param coin_a Dex coin A struct_tag
   * @param coin_b Dex coin B struct_tag
   * @param coin_lp Dex coin LP struct_tag
   */
  constructor(
    public authority: AccAddress,
    public coin_a: string,
    public coin_b: string,
    public coin_lp: string
  ) {
    super();
  }

  public static fromAmino(data: MsgDelist.Amino): MsgDelist {
    const {
      value: { authority, coin_a, coin_b, coin_lp },
    } = data;

    return new MsgDelist(authority, coin_a, coin_b, coin_lp);
  }

  public toAmino(): MsgDelist.Amino {
    const { authority, coin_a, coin_b, coin_lp } = this;

    return {
      type: 'move/MsgDelist',
      value: {
        authority,
        coin_a,
        coin_b,
        coin_lp,
      },
    };
  }

  public static fromData(data: MsgDelist.Data): MsgDelist {
    const { authority, coin_a, coin_b, coin_lp } = data;

    return new MsgDelist(authority, coin_a, coin_b, coin_lp);
  }

  public toData(): MsgDelist.Data {
    const { authority, coin_a, coin_b, coin_lp } = this;

    return {
      '@type': '/initia.move.v1.MsgDelist',
      authority,
      coin_a,
      coin_b,
      coin_lp,
    };
  }

  public static fromProto(data: MsgDelist.Proto): MsgDelist {
    return new MsgDelist(data.authority, data.coinA, data.coinB, data.coinLp);
  }

  public toProto(): MsgDelist.Proto {
    const { authority, coin_a, coin_b, coin_lp } = this;

    return MsgDelist_pb.fromPartial({
      authority,
      coinA: coin_a,
      coinB: coin_b,
      coinLp: coin_lp,
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
      coin_a: string;
      coin_b: string;
      coin_lp: string;
    };
  }

  export interface Data {
    '@type': '/initia.move.v1.MsgDelist';
    authority: AccAddress;
    coin_a: string;
    coin_b: string;
    coin_lp: string;
  }

  export type Proto = MsgDelist_pb;
}
