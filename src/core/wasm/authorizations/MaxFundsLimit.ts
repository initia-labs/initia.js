import { JSONSerializable } from '../../../util/json';
import { Coins } from '../../Coins';
import { MaxFundsLimit as MaxFundsLimit_pb } from '@initia/initia.proto/cosmwasm/wasm/v1/authz';
import { Any } from '@initia/initia.proto/google/protobuf/any';

export class MaxFundsLimit extends JSONSerializable<
  MaxFundsLimit.Amino,
  MaxFundsLimit.Data,
  MaxFundsLimit.Proto
> {
  public amounts: Coins;

  constructor(amounts: Coins.Input) {
    super();
    this.amounts = new Coins(amounts);
  }

  public static fromAmino(data: MaxFundsLimit.Amino): MaxFundsLimit {
    return new MaxFundsLimit(Coins.fromAmino(data.value.amounts));
  }

  public toAmino(): MaxFundsLimit.Amino {
    return {
      type: 'wasm/MaxFundsLimit',
      value: { amounts: this.amounts.toAmino() },
    };
  }

  public static fromData(data: MaxFundsLimit.Data): MaxFundsLimit {
    return new MaxFundsLimit(Coins.fromData(data.amounts));
  }

  public toData(): MaxFundsLimit.Data {
    return {
      '@type': '/cosmwasm.wasm.v1.MaxFundsLimit',
      amounts: this.amounts.toData(),
    };
  }

  public static fromProto(data: MaxFundsLimit.Proto): MaxFundsLimit {
    return new MaxFundsLimit(Coins.fromProto(data.amounts));
  }

  public toProto(): MaxFundsLimit.Proto {
    return MaxFundsLimit_pb.fromPartial({ amounts: this.amounts.toProto() });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmwasm.wasm.v1.MaxFundsLimit',
      value: MaxFundsLimit_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MaxFundsLimit {
    return MaxFundsLimit.fromProto(MaxFundsLimit_pb.decode(msgAny.value));
  }
}

export namespace MaxFundsLimit {
  export interface Amino {
    type: 'wasm/MaxFundsLimit';
    value: { amounts: Coins.Amino };
  }

  export interface Data {
    '@type': '/cosmwasm.wasm.v1.MaxFundsLimit';
    amounts: Coins.Data;
  }

  export type Proto = MaxFundsLimit_pb;
}
