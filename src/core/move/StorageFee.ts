import { AccAddress } from 'core/bech32';
import { Coins } from '../Coins';
import { JSONSerializable } from '../../util/json';
import { StorageFee as StorageFee_pb } from '@initia/initia.proto/initia/move/v1/types';
import Long from 'long';

export class StorageFee extends JSONSerializable<
  StorageFee.Amino,
  StorageFee.Data,
  StorageFee.Proto
> {
  public amount: Coins;

  /**
   * @param address address
   * @param assigned_bytes storage amount in bytes unit
   * @param amount paid coin amount for the storage allocation
   */
  constructor(
    public address: AccAddress, 
    public assigned_bytes: number, 
    amount: Coins.Input
  ) {
    super();
    this.amount = new Coins(amount);
  }

  public static fromAmino(data: StorageFee.Amino): StorageFee {
    const { address, assigned_bytes, amount } = data;
    return new StorageFee(address, Number.parseInt(assigned_bytes), Coins.fromAmino(amount));
  }

  public toAmino(): StorageFee.Amino {
    const { address, assigned_bytes, amount } = this;
    return {
      address,
      assigned_bytes: assigned_bytes.toFixed(),
      amount: amount.toAmino(),
    };
  }

  public static fromData(data: StorageFee.Data): StorageFee {
    const { address, assigned_bytes, amount } = data;
    return new StorageFee(address, Number.parseInt(assigned_bytes), Coins.fromData(amount));
  }

  public toData(): StorageFee.Data {
    const { address, assigned_bytes, amount } = this;
    return {
      address,
      assigned_bytes: assigned_bytes.toFixed(),
      amount: amount.toData(),
    };
  }

  public static fromProto(proto: StorageFee.Proto): StorageFee {
    return new StorageFee(
      proto.address, 
      proto.assignedBytes.toNumber(), 
      Coins.fromProto(proto.amount)
    );
  }

  public toProto(): StorageFee.Proto {
    const { address, assigned_bytes, amount } = this;
    return StorageFee_pb.fromPartial({
      address,
      assignedBytes: Long.fromNumber(assigned_bytes),
      amount: amount.toProto(),
    });
  }
}

export namespace StorageFee {
  export interface Amino {
    address: AccAddress;
    assigned_bytes: string;
    amount: Coins.Amino;
  }

  export interface Data {
    address: AccAddress;
    assigned_bytes: string;
    amount: Coins.Data;
  }

  export type Proto = StorageFee_pb;
}
