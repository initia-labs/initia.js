import { JSONSerializable } from '../../../../../util/json';
import { AccAddress } from '../../../../bech32';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgConnectionOpenInit as MsgConnectionOpenInit_pb } from '@initia/initia.proto/ibc/core/connection/v1/tx';
import { ConnectionCounterparty } from '../ConnectionCounterparty';
import { IbcVersion } from '../IbcVersion';
import Long from 'long';

/**
 * MsgConnectionOpenInit defines the msg sent by an account on Chain A to initialize a connection with Chain B.
 */
export class MsgConnectionOpenInit extends JSONSerializable<
  any,
  MsgConnectionOpenInit.Data,
  MsgConnectionOpenInit.Proto
> {
  /**
   * @param client_id identifier of the port to use
   * @param counterparty
   * @param version
   * @param delay_period
   * @param signer signer address
   */
  constructor(
    public client_id: string,
    public counterparty: ConnectionCounterparty,
    public version: IbcVersion,
    public delay_period: number,
    public signer: AccAddress
  ) {
    super();
  }

  public static fromAmino(_: any): MsgConnectionOpenInit {
    _;
    throw new Error('Amino not supported');
  }

  public toAmino(): any {
    throw new Error('Amino not supported');
  }

  public static fromData(
    data: MsgConnectionOpenInit.Data
  ): MsgConnectionOpenInit {
    const { client_id, counterparty, version, delay_period, signer } = data;
    return new MsgConnectionOpenInit(
      client_id,
      ConnectionCounterparty.fromData(counterparty),
      IbcVersion.fromData(version),
      Number.parseInt(delay_period),
      signer
    );
  }

  public toData(): MsgConnectionOpenInit.Data {
    const { client_id, counterparty, version, delay_period, signer } = this;
    return {
      '@type': '/ibc.core.connection.v1.MsgConnectionOpenInit',
      client_id,
      counterparty: counterparty.toData(),
      version: version.toData(),
      delay_period: delay_period.toFixed(),
      signer,
    };
  }

  public static fromProto(
    proto: MsgConnectionOpenInit.Proto
  ): MsgConnectionOpenInit {
    return new MsgConnectionOpenInit(
      proto.clientId,
      ConnectionCounterparty.fromProto(
        proto.counterparty as ConnectionCounterparty.Proto
      ),
      IbcVersion.fromProto(proto.version as IbcVersion.Proto),
      proto.delayPeriod.toNumber(),
      proto.signer
    );
  }

  public toProto(): MsgConnectionOpenInit.Proto {
    const { client_id, counterparty, version, delay_period, signer } = this;
    return MsgConnectionOpenInit_pb.fromPartial({
      clientId: client_id,
      counterparty: counterparty.toProto(),
      version: version.toProto(),
      delayPeriod: Long.fromNumber(delay_period),
      signer,
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.core.connection.v1.MsgConnectionOpenInit',
      value: MsgConnectionOpenInit_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgConnectionOpenInit {
    return MsgConnectionOpenInit.fromProto(
      MsgConnectionOpenInit_pb.decode(msgAny.value)
    );
  }
}

export namespace MsgConnectionOpenInit {
  export interface Data {
    '@type': '/ibc.core.connection.v1.MsgConnectionOpenInit';
    client_id: string;
    counterparty: ConnectionCounterparty.Data;
    version: IbcVersion.Data;
    delay_period: string;
    signer: AccAddress;
  }

  export type Proto = MsgConnectionOpenInit_pb;
}
