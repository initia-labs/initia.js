import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgSetMemo as MsgSetMemo_pb } from '@initia/initia.proto/noble/forwarding/v1/tx'

/**
 * MsgSetMemo registers memo which will be attached to all forwarded txs for a given address+denom pair.
 */
export class MsgSetMemo extends JSONSerializable<
  MsgSetMemo.Amino,
  MsgSetMemo.Data,
  MsgSetMemo.Proto
> {
  /**
   * @param signer
   * @param recipient
   * @param channel
   * @param fallback
   * @param denom
   * @param memo
   */
  constructor(
    public signer: AccAddress,
    public recipient: string,
    public channel: string,
    public fallback: AccAddress,
    public denom: string,
    public memo: string
  ) {
    super()
  }

  public static fromAmino(data: MsgSetMemo.Amino): MsgSetMemo {
    const {
      value: { signer, recipient, channel, fallback, denom, memo },
    } = data
    return new MsgSetMemo(signer, recipient, channel, fallback, denom, memo)
  }

  public toAmino(): MsgSetMemo.Amino {
    const { signer, recipient, channel, fallback, denom, memo } = this
    return {
      type: 'noble/forwarding/SetMemo',
      value: {
        signer,
        recipient,
        channel,
        fallback,
        denom,
        memo,
      },
    }
  }

  public static fromData(data: MsgSetMemo.Data): MsgSetMemo {
    const { signer, recipient, channel, fallback, denom, memo } = data
    return new MsgSetMemo(signer, recipient, channel, fallback, denom, memo)
  }

  public toData(): MsgSetMemo.Data {
    const { signer, recipient, channel, fallback, denom, memo } = this
    return {
      '@type': '/noble.forwarding.v1.MsgSetMemo',
      signer,
      recipient,
      channel,
      fallback,
      denom,
      memo,
    }
  }

  public static fromProto(data: MsgSetMemo.Proto): MsgSetMemo {
    return new MsgSetMemo(
      data.signer,
      data.recipient,
      data.channel,
      data.fallback,
      data.denom,
      data.memo
    )
  }

  public toProto(): MsgSetMemo.Proto {
    const { signer, recipient, channel, fallback, denom, memo } = this
    return MsgSetMemo_pb.fromPartial({
      signer,
      recipient,
      channel,
      fallback,
      denom,
      memo,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/noble.forwarding.v1.MsgSetMemo',
      value: MsgSetMemo_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgSetMemo {
    return MsgSetMemo.fromProto(MsgSetMemo_pb.decode(msgAny.value))
  }
}

export namespace MsgSetMemo {
  export interface Amino {
    type: 'noble/forwarding/SetMemo'
    value: {
      signer: AccAddress
      recipient: string
      channel: string
      fallback: AccAddress
      denom: string
      memo: string
    }
  }

  export interface Data {
    '@type': '/noble.forwarding.v1.MsgSetMemo'
    signer: AccAddress
    recipient: string
    channel: string
    fallback: AccAddress
    denom: string
    memo: string
  }

  export type Proto = MsgSetMemo_pb
}
