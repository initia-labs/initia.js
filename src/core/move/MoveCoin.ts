import { JSONSerializable } from '../../util/json';
import { MoveCoin as MoveCoin_pb } from '@initia/initia.proto/initia/move/v1/types';

export class MoveCoin extends JSONSerializable<
  MoveCoin.Amino, 
  MoveCoin.Data, 
  MoveCoin.Proto
> {
  /**
   * @param struct_tag struct tag
   * @param amount amount
   */
  constructor(public struct_tag: string, public amount: string) {
    super();
  }

  public static fromAmino(data: MoveCoin.Amino): MoveCoin {
    const { struct_tag, amount } = data;
    return new MoveCoin(struct_tag, amount);
  }

  public toAmino(): MoveCoin.Amino {
    const { struct_tag, amount } = this;
    return {
      struct_tag,
      amount,
    };
  }

  public static fromData(data: MoveCoin.Data): MoveCoin {
    const { struct_tag, amount } = data;
    return new MoveCoin(struct_tag, amount);
  }

  public toData(): MoveCoin.Data {
    const { struct_tag, amount } = this;
    return {
      struct_tag,
      amount,
    };
  }

  public static fromProto(proto: MoveCoin.Proto): MoveCoin {
    return new MoveCoin(proto.structTag, proto.amount)
  }

  public toProto(): MoveCoin.Proto {
    return MoveCoin_pb.fromPartial({
      structTag: this.struct_tag,
      amount: this.amount,
    })
  }
}

export namespace MoveCoin {
  export interface Amino {
    struct_tag: string;
    amount: string;
  }

  export interface Data {
    struct_tag: string;
    amount: string;
  }

  export type Proto = MoveCoin_pb;
}
