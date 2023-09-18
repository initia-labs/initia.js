import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgSubmitTx as MsgSubmitTx_pb } from '@initia/initia.proto/initia/intertx/v1/tx';
import { Msg } from '../../Msg';

export class MsgSubmitTx extends JSONSerializable<
  MsgSubmitTx.Amino,
  MsgSubmitTx.Data,
  MsgSubmitTx.Proto
> {
  /**
   * @param owner
   * @param connection_id
   * @param msg
   */
  constructor(
    public owner: AccAddress,
    public connection_id: string,
    public msg: Msg
  ) {
    super();
  }

  public static fromAmino(data: MsgSubmitTx.Amino): MsgSubmitTx {
    const {
      value: { owner, connection_id, msg },
    } = data;

    return new MsgSubmitTx(owner, connection_id, Msg.fromAmino(msg));
  }

  public toAmino(): MsgSubmitTx.Amino {
    const { owner, connection_id, msg } = this;
    return {
      type: 'intertx/MsgSubmitTx',
      value: {
        owner,
        connection_id,
        msg: msg.toAmino(),
      },
    };
  }

  public static fromData(data: MsgSubmitTx.Data): MsgSubmitTx {
    const { owner, connection_id, msg } = data;
    return new MsgSubmitTx(owner, connection_id, Msg.fromData(msg));
  }

  public toData(): MsgSubmitTx.Data {
    const { owner, connection_id, msg } = this;
    return {
      '@type': '/initia.intertx.v1.MsgSubmitTx',
      owner,
      connection_id,
      msg: msg.toData(),
    };
  }

  public static fromProto(proto: MsgSubmitTx.Proto): MsgSubmitTx {
    return new MsgSubmitTx(
      proto.owner,
      proto.connectionId,
      Msg.fromProto(proto.msg as any)
    );
  }

  public toProto(): MsgSubmitTx.Proto {
    const { owner, connection_id, msg } = this;
    return MsgSubmitTx_pb.fromPartial({
      owner,
      connectionId: connection_id,
      msg: msg.packAny(),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.intertx.v1.MsgSubmitTx',
      value: MsgSubmitTx_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgSubmitTx {
    return MsgSubmitTx.fromProto(MsgSubmitTx_pb.decode(msgAny.value));
  }
}

export namespace MsgSubmitTx {
  export interface Amino {
    type: 'intertx/MsgSubmitTx';
    value: {
      owner: AccAddress;
      connection_id: string;
      msg: Msg.Amino;
    };
  }

  export interface Data {
    '@type': '/initia.intertx.v1.MsgSubmitTx';
    owner: AccAddress;
    connection_id: string;
    msg: Msg.Data;
  }

  export type Proto = MsgSubmitTx_pb;
}
