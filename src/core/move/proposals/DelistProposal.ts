import { JSONSerializable } from '../../../util/json';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { DelistProposal as DelistProposal_pb } from '@initia/initia.proto/initia/move/v1/proposal';

/**
 * DelistProposal proposal which supports delisting whitelisted dex pairs
 */
export class DelistProposal extends JSONSerializable<
  DelistProposal.Amino,
  DelistProposal.Data,
  DelistProposal.Proto
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

  public static fromAmino(data: DelistProposal.Amino): DelistProposal {
    const {
      value: { title, description, coin_a, coin_b, coin_lp },
    } = data;
    return new DelistProposal(title, description, coin_a, coin_b, coin_lp);
  }

  public toAmino(): DelistProposal.Amino {
    const { title, description, coin_a, coin_b, coin_lp } = this;
    return {
      type: 'move/DelistProposal',
      value: {
        title,
        description,
        coin_a,
        coin_b,
        coin_lp,
      },
    };
  }

  public static fromData(data: DelistProposal.Data): DelistProposal {
    const { title, description, coin_a, coin_b, coin_lp } = data;
    return new DelistProposal(title, description, coin_a, coin_b, coin_lp);
  }

  public toData(): DelistProposal.Data {
    const { title, description, coin_a, coin_b, coin_lp } = this;
    return {
      '@type': '/initia.move.v1.DelistProposal',
      title,
      description,
      coin_a,
      coin_b,
      coin_lp,
    };
  }

  public static fromProto(proto: DelistProposal.Proto): DelistProposal {
    return new DelistProposal(
      proto.title,
      proto.description,
      proto.coinA,
      proto.coinB,
      proto.coinLp
    );
  }

  public toProto(): DelistProposal.Proto {
    const { title, description, coin_a, coin_b, coin_lp } = this;
    return DelistProposal_pb.fromPartial({
      title,
      description,
      coinA: coin_a,
      coinB: coin_b,
      coinLp: coin_lp,
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.move.v1.DelistProposal',
      value: DelistProposal_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): DelistProposal {
    return DelistProposal.fromProto(DelistProposal_pb.decode(msgAny.value));
  }
}

export namespace DelistProposal {
  export interface Amino {
    type: 'move/DelistProposal';
    value: {
      title: string;
      description: string;
      coin_a: string;
      coin_b: string;
      coin_lp: string;
    };
  }

  export interface Data {
    '@type': '/initia.move.v1.DelistProposal';
    title: string;
    description: string;
    coin_a: string;
    coin_b: string;
    coin_lp: string;
  }

  export type Proto = DelistProposal_pb;
}
