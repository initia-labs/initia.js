import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { Coins } from '../../Coins';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgSpendFeePool as MsgSpendFeePool_pb } from '@initia/opinit.proto/opinit/opchild/v1/tx';

export class MsgSpendFeePool extends JSONSerializable<
  MsgSpendFeePool.Amino,
  MsgSpendFeePool.Data,
  MsgSpendFeePool.Proto
> {
  public amount: Coins;

  /**
   * @param authority the address that controls the module
   * @param recipient address to receive the coins
   * @param amount the coin amount to spend
   */
  constructor(
    public authority: AccAddress,
    public recipient: AccAddress,
    amount: Coins.Input
  ) {
    super();
    this.amount = new Coins(amount);
  }

  public static fromAmino(data: MsgSpendFeePool.Amino): MsgSpendFeePool {
    const {
      value: { authority, recipient, amount },
    } = data;
    return new MsgSpendFeePool(authority, recipient, Coins.fromAmino(amount));
  }

  public toAmino(): MsgSpendFeePool.Amino {
    const { authority, recipient, amount } = this;
    return {
      type: 'opchild/MsgSpendFeePool',
      value: {
        authority,
        recipient,
        amount: amount.toAmino(),
      },
    };
  }

  public static fromData(data: MsgSpendFeePool.Data): MsgSpendFeePool {
    const { authority, recipient, amount } = data;
    return new MsgSpendFeePool(authority, recipient, Coins.fromData(amount));
  }

  public toData(): MsgSpendFeePool.Data {
    const { authority, recipient, amount } = this;
    return {
      '@type': '/opinit.opchild.v1.MsgSpendFeePool',
      authority,
      recipient,
      amount: amount.toData(),
    };
  }

  public static fromProto(data: MsgSpendFeePool.Proto): MsgSpendFeePool {
    return new MsgSpendFeePool(
      data.authority,
      data.recipient,
      Coins.fromProto(data.amount)
    );
  }

  public toProto(): MsgSpendFeePool.Proto {
    const { authority, recipient, amount } = this;
    return MsgSpendFeePool_pb.fromPartial({
      authority,
      recipient,
      amount: amount.toProto(),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.opchild.v1.MsgSpendFeePool',
      value: MsgSpendFeePool_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgSpendFeePool {
    return MsgSpendFeePool.fromProto(MsgSpendFeePool_pb.decode(msgAny.value));
  }
}

export namespace MsgSpendFeePool {
  export interface Amino {
    type: 'opchild/MsgSpendFeePool';
    value: {
      authority: AccAddress;
      recipient: AccAddress;
      amount: Coins.Amino;
    };
  }

  export interface Data {
    '@type': '/opinit.opchild.v1.MsgSpendFeePool';
    authority: AccAddress;
    recipient: AccAddress;
    amount: Coins.Data;
  }

  export type Proto = MsgSpendFeePool_pb;
}
