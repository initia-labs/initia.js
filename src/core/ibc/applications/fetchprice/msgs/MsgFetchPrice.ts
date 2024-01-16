import { JSONSerializable } from '../../../../../util/json';
import { AccAddress } from '../../../../bech32';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgFetchPrice as MsgFetchPrice_pb } from '@initia/initia.proto/ibc/applications/fetchprice/consumer/v1/tx';
import { Height } from '../../../core/client/Height';
import Long from 'long';

export class MsgFetchPrice extends JSONSerializable<
  MsgFetchPrice.Amino,
  MsgFetchPrice.Data,
  MsgFetchPrice.Proto
> {
  /**
   * @param source_port the port on which the packet will be sent
   * @param source_channel  the channel by which the packet will be sent
   * @param currency_ids
   * @param sender the sender address
   * @param timeout_height Timeout height relative to the current block height. (0 to disable)
   * @param timeout_timestamp Timeout timestamp (in nanoseconds) relative to the current block timestamp. (0 to disable)
   * @param memo optional memo
   */
  constructor(
    public source_port: string,
    public source_channel: string,
    public currency_ids: string[],
    public sender: AccAddress,
    public timeout_height?: Height,
    public timeout_timestamp?: string,
    public memo?: string
  ) {
    super();

    if (!timeout_height && !timeout_timestamp) {
      throw 'both of timeout_height and timeout_timestamp are undefined';
    }
  }

  public static fromAmino(data: MsgFetchPrice.Amino): MsgFetchPrice {
    const {
      value: {
        source_port,
        source_channel,
        currency_ids,
        sender,
        timeout_height,
        timeout_timestamp,
        memo,
      },
    } = data;

    if (!timeout_height && !timeout_timestamp) {
      throw 'both of timeout_height and timeout_timestamp are undefined';
    }

    return new MsgFetchPrice(
      source_port,
      source_channel,
      currency_ids,
      sender,
      timeout_height ? Height.fromAmino(timeout_height) : undefined,
      timeout_timestamp,
      memo
    );
  }

  public toAmino(): MsgFetchPrice.Amino {
    const {
      source_port,
      source_channel,
      currency_ids,
      sender,
      timeout_height,
      timeout_timestamp,
      memo,
    } = this;

    return {
      type: 'fetchprice/MsgFetchPrice',
      value: {
        source_port,
        source_channel,
        currency_ids,
        sender,
        timeout_height: timeout_height?.toAmino() ?? {},
        timeout_timestamp,
        memo,
      },
    };
  }

  public static fromData(data: MsgFetchPrice.Data): MsgFetchPrice {
    const {
      source_port,
      source_channel,
      currency_ids,
      sender,
      timeout_height,
      timeout_timestamp,
      memo,
    } = data;

    if (!timeout_height && !timeout_timestamp) {
      throw 'both of timeout_height and timeout_timestamp are undefined';
    }

    return new MsgFetchPrice(
      source_port,
      source_channel,
      currency_ids,
      sender,
      timeout_height ? Height.fromData(timeout_height) : undefined,
      timeout_timestamp === '0' ? undefined : timeout_timestamp,
      memo
    );
  }

  public toData(): MsgFetchPrice.Data {
    const {
      source_port,
      source_channel,
      currency_ids,
      sender,
      timeout_height,
      timeout_timestamp,
      memo,
    } = this;

    return {
      '@type': '/ibc.applications.fetchprice.consumer.v1.MsgFetchPrice',
      source_port,
      source_channel,
      currency_ids,
      sender,
      timeout_height: timeout_height
        ? timeout_height.toData()
        : new Height(0, 0).toData(),
      timeout_timestamp: timeout_timestamp ?? '0',
      memo,
    };
  }

  public static fromProto(proto: MsgFetchPrice.Proto): MsgFetchPrice {
    if (!proto.timeoutHeight && proto.timeoutTimestamp.toNumber() == 0) {
      throw 'both of timeout_height and timeout_timestamp are empty';
    }

    return new MsgFetchPrice(
      proto.sourcePort,
      proto.sourceChannel,
      proto.currencyIds,
      proto.sender,
      proto.timeoutHeight ? Height.fromProto(proto.timeoutHeight) : undefined,
      proto.timeoutTimestamp.toString(),
      proto.memo
    );
  }

  public toProto(): MsgFetchPrice.Proto {
    const {
      source_port,
      source_channel,
      currency_ids,
      sender,
      timeout_height,
      timeout_timestamp,
      memo,
    } = this;
    return MsgFetchPrice_pb.fromPartial({
      sourcePort: source_port,
      sourceChannel: source_channel,
      currencyIds: currency_ids,
      sender,
      timeoutHeight: timeout_height?.toProto(),
      timeoutTimestamp: Long.fromString(timeout_timestamp ?? '0'),
      memo,
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.applications.fetchprice.consumer.v1.MsgFetchPrice',
      value: MsgFetchPrice_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgFetchPrice {
    return MsgFetchPrice.fromProto(MsgFetchPrice_pb.decode(msgAny.value));
  }
}

export namespace MsgFetchPrice {
  export interface Amino {
    type: 'fetchprice/MsgFetchPrice';
    value: {
      source_port: string;
      source_channel: string;
      currency_ids: string[];
      sender: AccAddress;
      timeout_height: Height.Amino;
      timeout_timestamp?: string;
      memo?: string;
    };
  }

  export interface Data {
    '@type': '/ibc.applications.fetchprice.consumer.v1.MsgFetchPrice';
    source_port: string;
    source_channel: string;
    currency_ids: string[];
    sender: AccAddress;
    timeout_height: Height.Data;
    timeout_timestamp: string;
    memo?: string;
  }

  export type Proto = MsgFetchPrice_pb;
}
