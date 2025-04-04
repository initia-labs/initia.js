import { JSONSerializable } from '../../../../../util/json'
import { AccAddress } from '../../../../bech32'
import { Coin } from '../../../../Coin'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgTransfer as MsgTransfer_pb } from '@initia/initia.proto/ibc/applications/transfer/v1/tx'
import { Height } from '../../../core/client/Height'

/**
 * MsgTransfer defines a msg to transfer fungible tokens (i.e Coins) between
 * ICS20 enabled chains. See ICS Spec here:
 * https://github.com/cosmos/ibc/tree/master/spec/app/ics-020-fungible-token-transfer#data-structures
 */
export class MsgTransfer extends JSONSerializable<
  MsgTransfer.Amino,
  MsgTransfer.Data,
  MsgTransfer.Proto
> {
  public source_port: string
  public source_channel: string
  public token?: Coin
  public sender: AccAddress
  public receiver: string
  public timeout_height?: Height
  public timeout_timestamp?: string
  public memo?: string
  /**
   * @param source_port the port on which the packet will be sent
   * @param source_channel  the channel by which the packet will be sent
   * @param token the tokens to be transferred
   * @param sender the sender address
   * @param receiver the recipient address on the destination chain (can be non-cosmos-based)
   * @param timeout_height timeout height relative to the current block height (0 to disable)
   * @param timeout_timestamp timeout timestamp (in nanoseconds) relative to the current block timestamp (0 to disable)
   * @param memo optional memo
   */
  constructor(
    source_port: string,
    source_channel: string,
    token: Coin | undefined,
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
    this.token = token
    this.sender = sender
    this.receiver = receiver
    this.timeout_height = timeout_height
    this.timeout_timestamp = timeout_timestamp
    this.memo = memo
  }

  public static fromAmino(data: MsgTransfer.Amino): MsgTransfer {
    const {
      value: {
        source_port,
        source_channel,
        token,
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

    return new MsgTransfer(
      source_port,
      source_channel,
      token ? Coin.fromAmino(token) : undefined,
      sender,
      receiver,
      Height.fromAmino(timeout_height),
      timeout_timestamp,
      memo
    )
  }

  public toAmino(): MsgTransfer.Amino {
    const {
      source_port,
      source_channel,
      token,
      sender,
      receiver,
      timeout_height,
      timeout_timestamp,
      memo,
    } = this
    return {
      type: 'cosmos-sdk/MsgTransfer',
      value: {
        source_port,
        source_channel,
        token: token?.toAmino(),
        sender,
        receiver,
        timeout_height: timeout_height?.toAmino() ?? {},
        timeout_timestamp,
        memo: memo === '' ? undefined : memo,
      },
    }
  }

  public static fromData(data: MsgTransfer.Data): MsgTransfer {
    const {
      source_port,
      source_channel,
      token,
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

    return new MsgTransfer(
      source_port,
      source_channel,
      token ? Coin.fromData(token) : undefined,
      sender,
      receiver,
      timeout_height ? Height.fromData(timeout_height) : undefined,
      timeout_timestamp === '0' ? undefined : timeout_timestamp,
      memo
    )
  }

  public toData(): MsgTransfer.Data {
    const {
      source_port,
      source_channel,
      token,
      sender,
      receiver,
      timeout_height,
      timeout_timestamp,
      memo,
    } = this
    return {
      '@type': '/ibc.applications.transfer.v1.MsgTransfer',
      source_port,
      source_channel,
      token: token?.toData(),
      sender,
      receiver,
      timeout_height: timeout_height
        ? timeout_height.toData()
        : new Height(0, 0).toData(),
      timeout_timestamp: timeout_timestamp ?? '0',
      memo,
    }
  }

  public static fromProto(proto: MsgTransfer.Proto): MsgTransfer {
    if (!proto.timeoutHeight && Number(proto.timeoutTimestamp) == 0) {
      throw new Error('both of timeout_height and timeout_timestamp are empty')
    }

    return new MsgTransfer(
      proto.sourcePort,
      proto.sourceChannel,
      proto.token ? Coin.fromProto(proto.token) : undefined,
      proto.sender,
      proto.receiver,
      proto.timeoutHeight ? Height.fromProto(proto.timeoutHeight) : undefined,
      proto.timeoutTimestamp.toString(),
      proto.memo
    )
  }

  public toProto(): MsgTransfer.Proto {
    const {
      source_port,
      source_channel,
      token,
      sender,
      receiver,
      timeout_height,
      timeout_timestamp,
      memo,
    } = this
    return MsgTransfer_pb.fromPartial({
      sourcePort: source_port,
      sourceChannel: source_channel,
      token: token?.toProto(),
      sender,
      receiver,
      timeoutHeight: timeout_height?.toProto(),
      timeoutTimestamp: timeout_timestamp
        ? BigInt(timeout_timestamp)
        : undefined,
      memo,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.applications.transfer.v1.MsgTransfer',
      value: MsgTransfer_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgTransfer {
    return MsgTransfer.fromProto(MsgTransfer_pb.decode(msgAny.value))
  }
}

export namespace MsgTransfer {
  export interface Amino {
    type: 'cosmos-sdk/MsgTransfer'
    value: {
      source_port: string
      source_channel: string
      token?: Coin.Amino
      sender: AccAddress
      receiver: string
      timeout_height: Height.Amino
      timeout_timestamp?: string
      memo?: string
    }
  }

  export interface Data {
    '@type': '/ibc.applications.transfer.v1.MsgTransfer'
    source_port: string
    source_channel: string
    token?: Coin.Data
    sender: AccAddress
    receiver: string
    timeout_height: Height.Data
    timeout_timestamp: string
    memo?: string
  }

  export type Proto = MsgTransfer_pb
}
