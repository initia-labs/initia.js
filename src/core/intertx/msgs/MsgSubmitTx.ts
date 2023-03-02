import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgSubmitTx as MsgSubmitTx_pb } from '@initia/initia.proto/intertx/tx';

export class MsgSubmitTx extends JSONSerializable<
  any,
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
    public msg: any
  ) {
    super();
  }

  public static fromAmino(_: any): any {
    throw new Error('Amino not supported');
  }

  public toAmino(): any {
    throw new Error('Amino not supported');
  }

  public static fromData(
    data: MsgSubmitTx.Data
  ): MsgSubmitTx {
    const { owner, connection_id, msg } = data;
    return new MsgSubmitTx(owner, connection_id, msg);
  }

  public toData(): MsgSubmitTx.Data {
    const { owner, connection_id, msg } = this;
    return {
      '@type': '/intertx.MsgSubmitTx',
      owner,
      connection_id,
      msg,
    };
  }

  public static fromProto(
    proto: MsgSubmitTx.Proto
  ): MsgSubmitTx {
    return new MsgSubmitTx(
      proto.owner,
      proto.connectionId,
      proto.msg,
    );
  }

  public toProto(): MsgSubmitTx.Proto {
    const { owner, connection_id, msg } = this;
    return MsgSubmitTx_pb.fromPartial({
      owner,
      connectionId: connection_id,
      msg,
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/intertx.MsgSubmitTx',
      value: MsgSubmitTx_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgSubmitTx {
    return MsgSubmitTx.fromProto(
      MsgSubmitTx_pb.decode(msgAny.value)
    );
  }
}

export namespace MsgSubmitTx {
  export interface Data {
    '@type': '/intertx.MsgSubmitTx';
    owner: AccAddress;
    connection_id: string;
    msg: Any;
  }

  export type Proto = MsgSubmitTx_pb;
}
