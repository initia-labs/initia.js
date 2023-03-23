import { JSONSerializable } from '../../../util/json';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { WhitelistProposal as WhitelistProposal_pb } from '@initia/initia.proto/initia/move//v1/proposal';

/**
 * WhitelistProposal proposal which supports whitelisting dex pairs
 */
export class WhitelistProposal extends JSONSerializable<
  WhitelistProposal.Amino,
  WhitelistProposal.Data,
  WhitelistProposal.Proto
> {
  /**
   * @param title a short summary
   * @param description a human readable text
   * @param coin_a coin A struct tag
   * @param coin_b coin B struct tag
   * @param coin_lp coin LP struct tag
   */
  constructor(
    public title: string,
    public description: string,
    public coin_a: string,
    public coin_b: string,
    public coin_lp: string
  ) {
    super();
  }

  public static fromAmino(data: WhitelistProposal.Amino): WhitelistProposal {
    const {
      value: { title, description, coin_a, coin_b, coin_lp },
    } = data;
    return new WhitelistProposal(title, description, coin_a, coin_b, coin_lp);
  }

  public toAmino(): WhitelistProposal.Amino {
    const { title, description, coin_a, coin_b, coin_lp } = this;
    return {
      type: 'move/WhitelistProposal',
      value: {
        title,
        description,
        coin_a,
        coin_b,
        coin_lp,
      },
    };
  }

  public static fromData(data: WhitelistProposal.Data): WhitelistProposal {
    const { title, description, coin_a, coin_b, coin_lp } = data;
    return new WhitelistProposal(title, description, coin_a, coin_b, coin_lp);
  }

  public toData(): WhitelistProposal.Data {
    const { title, description, coin_a, coin_b, coin_lp } = this;
    return {
      '@type': '/initia.move.v1.WhitelistProposal',
      title,
      description,
      coin_a,
      coin_b,
      coin_lp,
    };
  }

  public static fromProto(proto: WhitelistProposal.Proto): WhitelistProposal {
    return new WhitelistProposal(
      proto.title,
      proto.description,
      proto.coinA,
      proto.coinB,
      proto.coinLp
    );
  }

  public toProto(): WhitelistProposal.Proto {
    const { title, description, coin_a, coin_b, coin_lp } = this;
    return WhitelistProposal_pb.fromPartial({
      title,
      description,
      coinA: coin_a,
      coinB: coin_b,
      coinLp: coin_lp,
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.move.v1.WhitelistProposal',
      value: WhitelistProposal_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): WhitelistProposal {
    return WhitelistProposal.fromProto(
      WhitelistProposal_pb.decode(msgAny.value)
    );
  }
}

export namespace WhitelistProposal {
  export interface Amino {
    type: 'move/WhitelistProposal';
    value: {
      title: string;
      description: string;
      coin_a: string;
      coin_b: string;
      coin_lp: string;
    };
  }

  export interface Data {
    '@type': '/initia.move.v1.WhitelistProposal';
    title: string;
    description: string;
    coin_a: string;
    coin_b: string;
    coin_lp: string;
  }

  export type Proto = WhitelistProposal_pb;
}
