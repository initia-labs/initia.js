import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { MoveCoin } from '../MoveCoin';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgConvertMoveCoin as MsgConvertMoveCoin_pb } from '@initia/initia.proto/initia/move/v1/tx';

export class MsgConvertMoveCoin extends JSONSerializable<
  MsgConvertMoveCoin.Amino,
  MsgConvertMoveCoin.Data,
  MsgConvertMoveCoin.Proto
> {
  /**
   * @param sender code creator
   * @param move_coin move coin to convert
   */
  constructor(public sender: AccAddress, public move_coin?: MoveCoin) {
    super();
  }

  public static fromAmino(data: MsgConvertMoveCoin.Amino): MsgConvertMoveCoin {
    const { value: { sender, move_coin } } = data;
    return new MsgConvertMoveCoin(sender, move_coin && MoveCoin.fromAmino(move_coin));
  }

  public toAmino(): MsgConvertMoveCoin.Amino {
    const { sender, move_coin } = this;
    return {
      type: 'move/MsgConvertMoveCoin',
      value: {
        sender,
        move_coin: move_coin?.toAmino(),
      },
    };
  }

  public static fromProto(proto: MsgConvertMoveCoin.Proto): MsgConvertMoveCoin {
    return new MsgConvertMoveCoin(
      proto.sender,
      proto.moveCoin && MoveCoin.fromProto(proto.moveCoin)
    )
  }

  public toProto(): MsgConvertMoveCoin.Proto {
    const { sender, move_coin } = this;
    return MsgConvertMoveCoin_pb.fromPartial({
      sender,
      moveCoin: move_coin?.toProto(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.move.v1.MsgConvertMoveCoin',
      value: MsgConvertMoveCoin_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgConvertMoveCoin {
    return MsgConvertMoveCoin.fromProto(
      MsgConvertMoveCoin_pb.decode(msgAny.value)
    );
  }

  public static fromData(data: MsgConvertMoveCoin.Data): MsgConvertMoveCoin {
    const { sender, move_coin } = data;
    return new MsgConvertMoveCoin(sender, move_coin && MoveCoin.fromData(move_coin));
  }

  public toData(): MsgConvertMoveCoin.Data {
    const { sender, move_coin } = this;
    return {
      '@type': '/initia.move.v1.MsgConvertMoveCoin',
      sender,
      move_coin: move_coin?.toData(),
    }
  }
}

export namespace MsgConvertMoveCoin {
  export interface Amino {
    type: 'move/MsgConvertMoveCoin';
    value: {
      sender: AccAddress;
      move_coin?: MoveCoin.Amino;
    };
  }

  export interface Data {
    '@type': '/initia.move.v1.MsgConvertMoveCoin';
    sender: AccAddress;
    move_coin?: MoveCoin.Data;
  }

  export type Proto = MsgConvertMoveCoin_pb;
}
