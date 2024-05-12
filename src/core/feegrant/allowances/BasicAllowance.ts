import { JSONSerializable } from '../../../util/json';
import { Coins } from '../../Coins';
import { num } from '../../num';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { BasicAllowance as BasicAllowance_pb } from '@initia/initia.proto/cosmos/feegrant/v1beta1/feegrant';

/**
 * BasicAllowance implements Allowance with a one-time grant of tokens
 * that optionally expires. The grantee can use up to SpendLimit to cover fees.
 */
export class BasicAllowance extends JSONSerializable<
  BasicAllowance.Amino,
  BasicAllowance.Data,
  BasicAllowance.Proto
> {
  public spend_limit: Coins;

  /**
   * @param spend_limit spend_limit allowed to be spent as fee
   * @param expiration allowance's expiration
   */
  constructor(spend_limit: Coins.Input, public expiration?: Date) {
    super();
    let hasNotPositive = false;
    this.spend_limit = new Coins(spend_limit);
    this.spend_limit.map(c => {
      // isPositive() from decimal.js returns true when the amount is 0.
      // but Coins.IsAllPositive() from cosmos-sdk will return false in same case.
      // so we use lessThanorEquenTo(0) instead of isPositive() == false
      if (num(c.amount).isLessThanOrEqualTo(0)) {
        hasNotPositive = true;
      }
    });
    if (hasNotPositive) {
      throw new Error('spend_limit must be positive');
    }
  }

  public static fromAmino(data: BasicAllowance.Amino): BasicAllowance {
    const {
      value: { spend_limit, expiration },
    } = data;

    return new BasicAllowance(
      Coins.fromAmino(spend_limit),
      expiration ? new Date(expiration) : undefined
    );
  }

  public toAmino(): BasicAllowance.Amino {
    const { spend_limit, expiration } = this;
    return {
      type: 'cosmos-sdk/BasicAllowance',
      value: {
        spend_limit: spend_limit.toAmino(),
        expiration: expiration?.toISOString().replace(/\.000Z$/, 'Z'),
      },
    };
  }

  public static fromData(proto: BasicAllowance.Data): BasicAllowance {
    const { spend_limit, expiration } = proto;
    return new BasicAllowance(
      Coins.fromData(spend_limit),
      expiration ? new Date(expiration) : undefined
    );
  }

  public toData(): BasicAllowance.Data {
    const { spend_limit, expiration } = this;
    return {
      '@type': '/cosmos.feegrant.v1beta1.BasicAllowance',
      spend_limit: spend_limit.toData(),
      expiration: expiration?.toISOString().replace(/\.000Z$/, 'Z'),
    };
  }

  public static fromProto(proto: BasicAllowance.Proto): BasicAllowance {
    return new BasicAllowance(
      Coins.fromProto(proto.spendLimit),
      proto.expiration
    );
  }

  public toProto(): BasicAllowance.Proto {
    const { spend_limit, expiration } = this;
    return BasicAllowance_pb.fromPartial({
      expiration,
      spendLimit: spend_limit.toProto(),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.feegrant.v1beta1.BasicAllowance',
      value: BasicAllowance_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): BasicAllowance {
    return BasicAllowance.fromProto(BasicAllowance_pb.decode(msgAny.value));
  }
}

export namespace BasicAllowance {
  export interface Amino {
    type: 'cosmos-sdk/BasicAllowance';
    value: {
      spend_limit: Coins.Amino;
      expiration?: string;
    };
  }

  export interface Data {
    '@type': '/cosmos.feegrant.v1beta1.BasicAllowance';
    spend_limit: Coins.Data;
    expiration?: string;
  }

  export type Proto = BasicAllowance_pb;
}
