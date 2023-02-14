import { Coins } from '../../Coins';
import { JSONSerializable } from '../../../util/json';
import { AccAddress, ValAddress } from '../../bech32';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgUndelegate as MsgUndelegate_pb } from '@initia/initia.proto/initia/mstaking/v1/tx';

/**
 * A delegator can undelegate an amount of bonded Initia, and will begin the unbonding
 * process for those funds. The unbonding process takes 21 days to complete, during
 * which the Initia cannot be transacted or swapped.
 */
export class MsgUndelegate extends JSONSerializable<
  MsgUndelegate.Amino,
  MsgUndelegate.Data,
  MsgUndelegate.Proto
> {
  public amount: Coins;

  /**
   * @param delegator_address delegator's account address
   * @param validator_address validator's operator address
   * @param amount INIT to be undelegated
   */
  constructor(
    public delegator_address: AccAddress,
    public validator_address: ValAddress,
    amount: Coins.Input
  ) {
    super();
    this.amount = new Coins(amount);
  }

  public static fromAmino(data: MsgUndelegate.Amino): MsgUndelegate {
    const {
      value: { delegator_address, validator_address, amount },
    } = data;
    return new MsgUndelegate(
      delegator_address,
      validator_address,
      Coins.fromAmino(amount)
    );
  }

  public toAmino(): MsgUndelegate.Amino {
    const { delegator_address, validator_address, amount } = this;
    return {
      type: 'mstaking/MsgUndelegate',
      value: {
        delegator_address,
        validator_address,
        amount: amount.toAmino(),
      },
    };
  }

  public static fromProto(proto: MsgUndelegate.Proto): MsgUndelegate {
    return new MsgUndelegate(
      proto.delegatorAddress,
      proto.validatorAddress,
      Coins.fromProto(proto.amount as Coins.Proto)
    );
  }

  public toProto(): MsgUndelegate.Proto {
    const { delegator_address, validator_address, amount } = this;
    return MsgUndelegate_pb.fromPartial({
      amount: amount.toProto(),
      delegatorAddress: delegator_address,
      validatorAddress: validator_address,
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.mstaking.v1.MsgUndelegate',
      value: MsgUndelegate_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgUndelegate {
    return MsgUndelegate.fromProto(MsgUndelegate_pb.decode(msgAny.value));
  }

  public static fromData(data: MsgUndelegate.Data): MsgUndelegate {
    const { delegator_address, validator_address, amount } = data;
    return new MsgUndelegate(
      delegator_address,
      validator_address,
      Coins.fromData(amount)
    );
  }

  public toData(): MsgUndelegate.Data {
    const { delegator_address, validator_address, amount } = this;
    return {
      '@type': '/initia.mstaking.v1.MsgUndelegate',
      delegator_address,
      validator_address,
      amount: amount.toData(),
    };
  }
}

export namespace MsgUndelegate {
  export interface Amino {
    type: 'mstaking/MsgUndelegate';
    value: {
      delegator_address: AccAddress;
      validator_address: ValAddress;
      amount: Coins.Amino;
    };
  }

  export interface Data {
    '@type': '/initia.mstaking.v1.MsgUndelegate';
    delegator_address: AccAddress;
    validator_address: ValAddress;
    amount: Coins.Data;
  }

  export type Proto = MsgUndelegate_pb;
}
