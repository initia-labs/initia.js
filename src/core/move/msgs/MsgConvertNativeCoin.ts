import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { Coin } from '../../Coin';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgConvertNativeCoin as MsgConvertNativeCoin_pb } from '@initia/initia.proto/initia/move/v1/tx';

export class MsgConvertNativeCoin extends JSONSerializable<
  MsgConvertNativeCoin.Amino,
  MsgConvertNativeCoin.Data,
  MsgConvertNativeCoin.Proto
> {
  /**
   * @param sender code creator
   * @param coin coin to convert
   */
  constructor(public sender: AccAddress, public coin?: Coin) {
    super();
  }

  public static fromAmino(data: MsgConvertNativeCoin.Amino): MsgConvertNativeCoin {
    const { value: { sender, coin } } = data;
    return new MsgConvertNativeCoin(sender, coin && Coin.fromAmino(coin));
  }

  public toAmino(): MsgConvertNativeCoin.Amino {
    const { sender, coin } = this;
    return {
      type: 'move/MsgConvertNativeCoin',
      value: {
        sender,
        coin: coin?.toAmino(),
      },
    };
  }

  public static fromProto(proto: MsgConvertNativeCoin.Proto): MsgConvertNativeCoin {
    return new MsgConvertNativeCoin(
      proto.sender,
      proto.coin && Coin.fromProto(proto.coin),
    )
  }

  public toProto(): MsgConvertNativeCoin.Proto {
    const { sender, coin } = this;
    return MsgConvertNativeCoin_pb.fromPartial({
      sender,
      coin: coin?.toProto(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.move.v1.MsgConvertNativeCoin',
      value: MsgConvertNativeCoin_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgConvertNativeCoin {
    return MsgConvertNativeCoin.fromProto(
      MsgConvertNativeCoin_pb.decode(msgAny.value)
    );
  }

  public static fromData(data: MsgConvertNativeCoin.Data): MsgConvertNativeCoin {
    const { sender, coin } = data;
    return new MsgConvertNativeCoin(sender, coin && Coin.fromData(coin));
  }

  public toData(): MsgConvertNativeCoin.Data {
    const { sender, coin } = this;
    return {
      '@type': '/initia.move.v1.MsgConvertNativeCoin',
      sender,
      coin: coin?.toData(),
    }
  }
}

export namespace MsgConvertNativeCoin {
  export interface Amino {
    type: 'move/MsgConvertNativeCoin';
    value: {
      sender: AccAddress;
      coin?: Coin.Amino;
    };
  }

  export interface Data {
    '@type': '/initia.move.v1.MsgConvertNativeCoin';
    sender: AccAddress;
    coin?: Coin.Data;
  }

  export type Proto = MsgConvertNativeCoin_pb;
}
