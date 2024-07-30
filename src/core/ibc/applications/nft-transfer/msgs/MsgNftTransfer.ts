import { JSONSerializable } from '../../../../../util/json'
import { AccAddress } from '../../../../bech32'
import Long from 'long'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgTransfer as MsgTransfer_pb } from '@initia/initia.proto/ibc/applications/nft_transfer/v1/tx'
import { Height } from '../../../core/client/Height'

/**
 * A basic message for NFT transfer via IBC.
 */
export class MsgNftTransfer extends JSONSerializable<
  MsgNftTransfer.Amino,
  MsgNftTransfer.Data,
  MsgNftTransfer.Proto
> {
  public source_port: string
  public source_channel: string
  public class_id: string
  public token_ids: string[]
  public sender: AccAddress
  public receiver: string // destination chain can be non-cosmos-based
  public timeout_height?: Height // 0 to disable
  public timeout_timestamp?: string // 0 to disable
  public memo?: string
  /**
   * @param source_port the port on which the packet will be sent
   * @param source_channel the channel by which the packet will be sent
   * @param class_id the struct tag of the extension
   * @param token_ids the token ids of the NFT
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
    sender: AccAddress,
    receiver: string,
    timeout_height?: Height,
    timeout_timestamp?: string,
    memo?: string
  ) {
    super()

    if (!timeout_height && !timeout_timestamp) {
      throw new Error(
        'both of timeout_height and timeout_timestamp are undefined'
      )
    }

    this.source_port = source_port
    this.source_channel = source_channel
    this.class_id = class_id
    this.token_ids = token_ids
    this.sender = sender
    this.receiver = receiver
    this.timeout_height = timeout_height
    this.timeout_timestamp = timeout_timestamp
    this.memo = memo
  }

  public static fromAmino(data: MsgNftTransfer.Amino): MsgNftTransfer {
    const {
      value: {
        source_port,
        source_channel,
        class_id,
        token_ids,
        sender,
        receiver,
        timeout_height,
        timeout_timestamp,
        memo,
      },
    } = data

    if (!timeout_height && !timeout_timestamp) {
      throw new Error(
        'both of timeout_height and timeout_timestamp are undefined'
      )
    }

    return new MsgNftTransfer(
      source_port,
      source_channel,
      class_id,
      token_ids,
      sender,
      receiver,
      timeout_height ? Height.fromAmino(timeout_height) : undefined,
      timeout_timestamp,
      memo
    )
  }

  public toAmino(): MsgNftTransfer.Amino {
    const {
      source_port,
      source_channel,
      class_id,
      token_ids,
      sender,
      receiver,
      timeout_height,
      timeout_timestamp,
      memo,
    } = this
    return {
      type: 'nft-transfer/MsgTransfer',
      value: {
        source_port,
        source_channel,
        class_id,
        token_ids,
        sender,
        receiver,
        timeout_height: timeout_height?.toAmino() ?? {},
        timeout_timestamp,
        memo,
      },
    }
  }

  public static fromData(data: MsgNftTransfer.Data): MsgNftTransfer {
    const {
      source_port,
      source_channel,
      class_id,
      token_ids,
      sender,
      receiver,
      timeout_timestamp,
      timeout_height,
      memo,
    } = data

    if (!timeout_height && !timeout_timestamp) {
      throw new Error(
        'both of timeout_height and timeout_timestamp are undefined'
      )
    }

    return new MsgNftTransfer(
      source_port,
      source_channel,
      class_id,
      token_ids,
      sender,
      receiver,
      timeout_height ? Height.fromData(timeout_height) : undefined,
      timeout_timestamp === '0' ? undefined : timeout_timestamp,
      memo
    )
  }

  public toData(): MsgNftTransfer.Data {
    const {
      source_port,
      source_channel,
      class_id,
      token_ids,
      sender,
      receiver,
      timeout_height,
      timeout_timestamp,
      memo,
    } = this
    return {
      '@type': '/ibc.applications.nft_transfer.v1.MsgTransfer',
      source_port,
      source_channel,
      class_id,
      token_ids,
      sender,
      receiver,
      timeout_height: timeout_height
        ? timeout_height.toData()
        : new Height(0, 0).toData(),
      timeout_timestamp: timeout_timestamp ?? '0',
      memo,
    }
  }

  public static fromProto(proto: MsgNftTransfer.Proto): MsgNftTransfer {
    if (!proto.timeoutHeight && proto.timeoutTimestamp.toNumber() == 0) {
      throw new Error('both of timeout_height and timeout_timestamp are empty')
    }

    return new MsgNftTransfer(
      proto.sourcePort,
      proto.sourceChannel,
      proto.classId,
      proto.tokenIds,
      proto.sender,
      proto.receiver,
      proto.timeoutHeight ? Height.fromProto(proto.timeoutHeight) : undefined,
      proto.timeoutTimestamp.toString(),
      proto.memo
    )
  }

  public toProto(): MsgNftTransfer.Proto {
    const {
      source_port,
      source_channel,
      class_id,
      token_ids,
      sender,
      receiver,
      timeout_height,
      timeout_timestamp,
      memo,
    } = this
    return MsgTransfer_pb.fromPartial({
      sourcePort: source_port,
      sourceChannel: source_channel,
      classId: class_id,
      tokenIds: token_ids,
      sender,
      receiver,
      timeoutHeight: timeout_height?.toProto(),
      timeoutTimestamp: Long.fromString(timeout_timestamp ?? '0'),
      memo,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.applications.nft_transfer.v1.MsgTransfer',
      value: MsgTransfer_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgNftTransfer {
    return MsgNftTransfer.fromProto(MsgTransfer_pb.decode(msgAny.value))
  }
}

export namespace MsgNftTransfer {
  export interface Amino {
    type: 'nft-transfer/MsgTransfer'
    value: {
      source_port: string
      source_channel: string
      class_id: string
      token_ids: string[]
      sender: AccAddress
      receiver: string
      timeout_height: Height.Amino
      timeout_timestamp?: string
      memo?: string
    }
  }

  export interface Data {
    '@type': '/ibc.applications.nft_transfer.v1.MsgTransfer'
    source_port: string
    source_channel: string
    class_id: string
    token_ids: string[]
    sender: AccAddress
    receiver: string
    timeout_height: Height.Data
    timeout_timestamp: string
    memo?: string
  }

  export type Proto = MsgTransfer_pb
}
