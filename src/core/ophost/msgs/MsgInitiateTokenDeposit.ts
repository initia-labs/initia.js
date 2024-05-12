import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { Coin } from '../../Coin';
import { MsgInitiateTokenDeposit as MsgInitiateTokenDeposit_pb } from '@initia/opinit.proto/opinit/ophost/v1/tx';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import Long from 'long';

export class MsgInitiateTokenDeposit extends JSONSerializable<
  MsgInitiateTokenDeposit.Amino,
  MsgInitiateTokenDeposit.Data,
  MsgInitiateTokenDeposit.Proto
> {
  /**
   * @param sender
   * @param bridge_id
   * @param to
   * @param amount
   * @param data
   */
  constructor(
    public sender: AccAddress,
    public bridge_id: number,
    public to: AccAddress,
    public amount: Coin,
    public data?: string
  ) {
    super();
  }

  public static fromAmino(
    msgAmino: MsgInitiateTokenDeposit.Amino
  ): MsgInitiateTokenDeposit {
    const {
      value: { sender, bridge_id, to, amount, data },
    } = msgAmino;
    return new MsgInitiateTokenDeposit(
      sender,
      Number.parseInt(bridge_id),
      to,
      Coin.fromAmino(amount),
      data
    );
  }

  public toAmino(): MsgInitiateTokenDeposit.Amino {
    const { sender, bridge_id, to, amount, data } = this;
    return {
      type: 'ophost/MsgInitiateTokenDeposit',
      value: {
        sender,
        bridge_id: bridge_id.toString(),
        to,
        amount: amount.toAmino(),
        data,
      },
    };
  }

  public static fromData(
    msgData: MsgInitiateTokenDeposit.Data
  ): MsgInitiateTokenDeposit {
    const { sender, bridge_id, to, amount, data } = msgData;
    return new MsgInitiateTokenDeposit(
      sender,
      Number.parseInt(bridge_id),
      to,
      Coin.fromData(amount),
      data
    );
  }

  public toData(): MsgInitiateTokenDeposit.Data {
    const { sender, bridge_id, to, amount, data } = this;
    return {
      '@type': '/opinit.ophost.v1.MsgInitiateTokenDeposit',
      sender,
      bridge_id: bridge_id.toString(),
      to,
      amount: amount.toData(),
      data,
    };
  }

  public static fromProto(
    msgProto: MsgInitiateTokenDeposit.Proto
  ): MsgInitiateTokenDeposit {
    return new MsgInitiateTokenDeposit(
      msgProto.sender,
      msgProto.bridgeId.toNumber(),
      msgProto.to,
      Coin.fromProto(msgProto.amount as Coin),
      msgProto.data.length
        ? Buffer.from(msgProto.data).toString('base64')
        : undefined
    );
  }

  public toProto(): MsgInitiateTokenDeposit.Proto {
    const { sender, bridge_id, to, amount, data } = this;
    return MsgInitiateTokenDeposit_pb.fromPartial({
      sender,
      bridgeId: Long.fromNumber(bridge_id),
      to,
      amount: amount.toProto(),
      data: data ? Buffer.from(data, 'base64') : undefined,
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.ophost.v1.MsgInitiateTokenDeposit',
      value: MsgInitiateTokenDeposit_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgInitiateTokenDeposit {
    return MsgInitiateTokenDeposit.fromProto(
      MsgInitiateTokenDeposit_pb.decode(msgAny.value)
    );
  }
}

export namespace MsgInitiateTokenDeposit {
  export interface Amino {
    type: 'ophost/MsgInitiateTokenDeposit';
    value: {
      sender: AccAddress;
      bridge_id: string;
      to: AccAddress;
      amount: Coin.Amino;
      data?: string;
    };
  }

  export interface Data {
    '@type': '/opinit.ophost.v1.MsgInitiateTokenDeposit';
    sender: AccAddress;
    bridge_id: string;
    to: AccAddress;
    amount: Coin.Data;
    data?: string;
  }

  export type Proto = MsgInitiateTokenDeposit_pb;
}
