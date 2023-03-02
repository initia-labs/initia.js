import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgRegisterAccount as MsgRegisterAccount_pb } from '@initia/initia.proto/intertx/tx';

export class MsgRegisterAccount extends JSONSerializable<
  any,
  MsgRegisterAccount.Data,
  MsgRegisterAccount.Proto
> {
  /**
   * @param owner 
   * @param connection_id 
   * @param version 
   */
  constructor(
    public owner: AccAddress, 
    public connection_id: string,
    public version: string
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
    data: MsgRegisterAccount.Data
  ): MsgRegisterAccount {
    const { owner, connection_id, version } = data;
    return new MsgRegisterAccount(owner, connection_id, version);
  }

  public toData(): MsgRegisterAccount.Data {
    const { owner, connection_id, version } = this;
    return {
      '@type': '/intertx.MsgRegisterAccount',
      owner,
      connection_id,
      version,
    };
  }

  public static fromProto(
    proto: MsgRegisterAccount.Proto
  ): MsgRegisterAccount {
    return new MsgRegisterAccount(
      proto.owner,
      proto.connectionId,
      proto.version,
    );
  }

  public toProto(): MsgRegisterAccount.Proto {
    const { owner, connection_id, version } = this;
    return MsgRegisterAccount_pb.fromPartial({
      owner,
      connectionId: connection_id,
      version,
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/intertx.MsgRegisterAccount',
      value: MsgRegisterAccount_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgRegisterAccount {
    return MsgRegisterAccount.fromProto(
      MsgRegisterAccount_pb.decode(msgAny.value)
    );
  }
}

export namespace MsgRegisterAccount {
  export interface Data {
    '@type': '/intertx.MsgRegisterAccount';
    owner: AccAddress;
    connection_id: string;
    version: string;
  }

  export type Proto = MsgRegisterAccount_pb;
}
