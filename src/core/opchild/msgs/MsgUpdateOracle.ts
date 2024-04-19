import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { MsgUpdateOracle as MsgUpdateOracle_pb } from '@initia/opinit.proto/opinit/opchild/v1/tx';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import Long from 'long';

export class MsgUpdateOracle extends JSONSerializable<
  MsgUpdateOracle.Amino,
  MsgUpdateOracle.Data,
  MsgUpdateOracle.Proto
> {
  /**
   * @param sender the sender address
   * @param height the height of l1 which is including the oracle message
   * @param data oracle votes bytes
   */
  constructor(
    public sender: AccAddress,
    public height: number,
    public data: string
  ) {
    super();
  }

  public static fromAmino(data: MsgUpdateOracle.Amino): MsgUpdateOracle {
    return new MsgUpdateOracle(
      data.value.sender,
      Number.parseInt(data.value.height),
      data.value.data
    );
  }

  public toAmino(): MsgUpdateOracle.Amino {
    const { sender, height, data } = this;
    return {
      type: 'opchild/MsgUpdateOracle',
      value: {
        sender,
        height: height.toString(),
        data,
      },
    };
  }

  public static fromData(data: MsgUpdateOracle.Data): MsgUpdateOracle {
    return new MsgUpdateOracle(
      data.sender,
      Number.parseInt(data.height),
      data.data
    );
  }

  public toData(): MsgUpdateOracle.Data {
    const { sender, height, data } = this;
    return {
      '@type': '/opinit.opchild.v1.MsgUpdateOracle',
      sender,
      height: height.toString(),
      data,
    };
  }

  public static fromProto(data: MsgUpdateOracle.Proto): MsgUpdateOracle {
    return new MsgUpdateOracle(
      data.sender,
      data.height.toNumber(),
      Buffer.from(data.data).toString('base64')
    );
  }

  public toProto(): MsgUpdateOracle.Proto {
    const { sender, height, data } = this;
    return MsgUpdateOracle_pb.fromPartial({
      sender,
      height: Long.fromNumber(height),
      data: Buffer.from(data, 'base64'),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.opchild.v1.MsgUpdateOracle',
      value: MsgUpdateOracle_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgUpdateOracle {
    return MsgUpdateOracle.fromProto(MsgUpdateOracle_pb.decode(msgAny.value));
  }
}

export namespace MsgUpdateOracle {
  export interface Amino {
    type: 'opchild/MsgUpdateOracle';
    value: {
      sender: AccAddress;
      height: string;
      data: string;
    };
  }

  export interface Data {
    '@type': '/opinit.opchild.v1.MsgUpdateOracle';
    sender: AccAddress;
    height: string;
    data: string;
  }

  export type Proto = MsgUpdateOracle_pb;
}
