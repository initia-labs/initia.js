import { JSONSerializable } from '../../../../../util/json';
import { AccAddress } from '../../../../bech32';
import Long from 'long';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgSftTransfer as MsgSftTransfer_pb } from '@initia/initia.proto/ibc/applications/sft_transfer/v1/tx';
import { Height } from '../../../core/client/Height';

/**
 * A basic message for SFT transfer via IBC.
 */
export class MsgSftTransfer extends JSONSerializable<
  MsgSftTransfer.Amino,
  MsgSftTransfer.Data,
  MsgSftTransfer.Proto
> {
  public source_port: string;
  public source_channel: string;
  public class_id: string;
  public token_ids: string[];
  public token_amounts: string[];
  public sender: AccAddress;
  public receiver: string; // destination chain can be non-cosmos-based
  public timeout_height?: Height; // 0 to disable
  public timeout_timestamp?: string; // 0 to disable
  public memo?: string;
  /**
   * @param source_port the port on which the packet will be sent
   * @param source_channel the channel by which the packet will be sent
   * @param class_id the struct tag of the extension
   * @param token_ids the token ids of the SFT
   * @param token_amounts the token amounts of the SFT
   * @param sender the sender address
   * @param receiver the recipient address on the destination chain
   * @param timeout_height Timeout height relative to the current block height. (0 to disable)
   * @param timeout_timestamp Timeout timestamp (in nanoseconds) relative to the current block timestamp. (0 to disable)
   * @param memo optional memo
   */
  constructor(
    source_port: string,
    source_channel: string,
    class_id: string,
    token_ids: string[],
    token_amounts: string[],
    sender: AccAddress,
    receiver: string,
    timeout_height?: Height,
    timeout_timestamp?: string,
    memo?: string
  ) {
    super();

    if (!timeout_height && !timeout_timestamp) {
      throw 'both of timeout_height and timeout_timestamp are undefined';
    }

    this.source_port = source_port;
    this.source_channel = source_channel;
    this.class_id = class_id;
    this.token_ids = token_ids;
    this.token_amounts = token_amounts;
    this.sender = sender;
    this.receiver = receiver;
    this.timeout_height = timeout_height;
    this.timeout_timestamp = timeout_timestamp;
    this.memo = memo;
  }

  public static fromAmino(data: MsgSftTransfer.Amino): MsgSftTransfer {
    const {
      value: {
        source_port,
        source_channel,
        class_id,
        token_ids,
        token_amounts,
        sender,
        receiver,
        timeout_height,
        timeout_timestamp,
        memo,
      },
    } = data;

    if (!timeout_height && !timeout_timestamp) {
      throw 'both of timeout_height and timeout_timestamp are undefined';
    }

    return new MsgSftTransfer(
      source_port,
      source_channel,
      class_id,
      token_ids,
      token_amounts,
      sender,
      receiver,
      timeout_height ? Height.fromAmino(timeout_height) : undefined,
      timeout_timestamp,
      memo
    );
  }

  public toAmino(): MsgSftTransfer.Amino {
    const {
      source_port,
      source_channel,
      class_id,
      token_ids,
      token_amounts,
      sender,
      receiver,
      timeout_height,
      timeout_timestamp,
      memo,
    } = this;
    return {
      type: 'ibc/MsgSftTransfer',
      value: {
        source_port,
        source_channel,
        class_id,
        token_ids,
        token_amounts,
        sender,
        receiver,
        timeout_height: timeout_height?.toAmino() || {},
        timeout_timestamp,
        memo,
      },
    };
  }

  public static fromData(data: MsgSftTransfer.Data): MsgSftTransfer {
    const {
      source_port,
      source_channel,
      class_id,
      token_ids,
      token_amounts,
      sender,
      receiver,
      timeout_timestamp,
      timeout_height,
      memo,
    } = data;

    if (!timeout_height && !timeout_timestamp) {
      throw 'both of timeout_height and timeout_timestamp are undefined';
    }

    return new MsgSftTransfer(
      source_port,
      source_channel,
      class_id,
      token_ids,
      token_amounts,
      sender,
      receiver,
      timeout_height ? Height.fromData(timeout_height) : undefined,
      timeout_timestamp === '0' ? undefined : timeout_timestamp,
      memo
    );
  }

  public toData(): MsgSftTransfer.Data {
    const {
      source_port,
      source_channel,
      class_id,
      token_ids,
      token_amounts,
      sender,
      receiver,
      timeout_height,
      timeout_timestamp,
      memo,
    } = this;
    return {
      '@type': '/ibc.applications.sft_transfer.v1.MsgSftTransfer',
      source_port,
      source_channel,
      class_id,
      token_ids,
      token_amounts,
      sender,
      receiver,
      timeout_height: timeout_height
        ? timeout_height.toData()
        : new Height(0, 0).toData(),
      timeout_timestamp: timeout_timestamp ?? '0',
      memo,
    };
  }

  public static fromProto(proto: MsgSftTransfer.Proto): MsgSftTransfer {
    if (!proto.timeoutHeight && proto.timeoutTimestamp.toNumber() == 0) {
      throw 'both of timeout_height and timeout_timestamp are empty';
    }

    return new MsgSftTransfer(
      proto.sourcePort,
      proto.sourceChannel,
      proto.classId,
      proto.tokenIds,
      proto.tokenAmounts,
      proto.sender,
      proto.receiver,
      proto.timeoutHeight ? Height.fromProto(proto.timeoutHeight) : undefined,
      proto.timeoutTimestamp.toString(),
      proto.memo
    );
  }

  public toProto(): MsgSftTransfer.Proto {
    const {
      source_port,
      source_channel,
      class_id,
      token_ids,
      token_amounts,
      sender,
      receiver,
      timeout_height,
      timeout_timestamp,
      memo,
    } = this;
    return MsgSftTransfer_pb.fromPartial({
      sourcePort: source_port,
      sourceChannel: source_channel,
      classId: class_id,
      tokenIds: token_ids,
      tokenAmounts: token_amounts,
      sender,
      receiver,
      timeoutHeight: timeout_height?.toProto(),
      timeoutTimestamp: Long.fromString(timeout_timestamp ?? '0'),
      memo,
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.applications.sft_transfer.v1.MsgSftTransfer',
      value: MsgSftTransfer_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgSftTransfer {
    return MsgSftTransfer.fromProto(MsgSftTransfer_pb.decode(msgAny.value));
  }
}

export namespace MsgSftTransfer {
  export interface Amino {
    type: 'ibc/MsgSftTransfer';
    value: {
      source_port: string;
      source_channel: string;
      class_id: string;
      token_ids: string[];
      token_amounts: string[];
      sender: AccAddress;
      receiver: string;
      timeout_height: Height.Amino;
      timeout_timestamp?: string;
      memo?: string;
    };
  }

  export interface Data {
    '@type': '/ibc.applications.sft_transfer.v1.MsgSftTransfer';
    source_port: string;
    source_channel: string;
    class_id: string;
    token_ids: string[];
    token_amounts: string[];
    sender: AccAddress;
    receiver: string;
    timeout_height: Height.Data;
    timeout_timestamp: string;
    memo?: string;
  }

  export type Proto = MsgSftTransfer_pb;
}
