import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Msg } from '../../Msg'
import { Coins } from '../../Coins'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgSubmitProposal as MsgSubmitProposal_pb } from '@initia/initia.proto/cosmos/gov/v1/tx'

export class MsgSubmitProposal extends JSONSerializable<
  MsgSubmitProposal.Amino,
  MsgSubmitProposal.Data,
  MsgSubmitProposal.Proto
> {
  public initial_deposit: Coins

  /**
   * @param messages the arbitrary messages to be executed if proposal passes
   * @param initial_deposit the deposit value that must be paid at proposal submission
   * @param proposer the account address of the proposer
   * @param metadata any arbitrary metadata attached to the proposal
   * @param title the title of the proposal
   * @param summary the summary of the proposal
   * @param expedited if the proposal is expedited or not
   */
  constructor(
    public messages: Msg[],
    initial_deposit: Coins.Input,
    public proposer: AccAddress,
    public metadata: string,
    public title: string,
    public summary: string,
    public expedited: boolean
  ) {
    super()
    this.initial_deposit = new Coins(initial_deposit)
  }

  public static fromAmino(data: MsgSubmitProposal.Amino): MsgSubmitProposal {
    const {
      value: {
        messages,
        initial_deposit,
        proposer,
        metadata,
        title,
        summary,
        expedited,
      },
    } = data

    return new MsgSubmitProposal(
      messages.map(Msg.fromAmino),
      Coins.fromAmino(initial_deposit),
      proposer,
      metadata ?? '',
      title,
      summary,
      expedited
    )
  }

  public toAmino(): MsgSubmitProposal.Amino {
    const {
      messages,
      initial_deposit,
      proposer,
      metadata,
      title,
      summary,
      expedited,
    } = this

    return {
      type: 'cosmos-sdk/v1/MsgSubmitProposal',
      value: {
        messages: messages.map((msg) => msg.toAmino()),
        initial_deposit: initial_deposit.toAmino(),
        proposer,
        metadata: metadata && metadata !== '' ? metadata : undefined,
        title,
        summary,
        expedited,
      },
    }
  }

  public static fromData(data: MsgSubmitProposal.Data): MsgSubmitProposal {
    const {
      messages,
      initial_deposit,
      proposer,
      metadata,
      title,
      summary,
      expedited,
    } = data

    return new MsgSubmitProposal(
      messages.map(Msg.fromData),
      Coins.fromData(initial_deposit),
      proposer,
      metadata,
      title,
      summary,
      expedited
    )
  }

  public toData(): MsgSubmitProposal.Data {
    const {
      messages,
      initial_deposit,
      proposer,
      metadata,
      title,
      summary,
      expedited,
    } = this

    return {
      '@type': '/cosmos.gov.v1.MsgSubmitProposal',
      messages: messages.map((msg) => msg.toData()),
      initial_deposit: initial_deposit.toData(),
      proposer,
      metadata,
      title,
      summary,
      expedited,
    }
  }

  public static fromProto(data: MsgSubmitProposal.Proto): MsgSubmitProposal {
    return new MsgSubmitProposal(
      data.messages.map(Msg.fromProto),
      Coins.fromProto(data.initialDeposit),
      data.proposer,
      data.metadata,
      data.title,
      data.summary,
      data.expedited
    )
  }

  public toProto(): MsgSubmitProposal.Proto {
    const {
      messages,
      initial_deposit,
      proposer,
      metadata,
      title,
      summary,
      expedited,
    } = this

    return MsgSubmitProposal_pb.fromPartial({
      messages: messages.map((msg) => msg.packAny()),
      initialDeposit: initial_deposit.toProto(),
      proposer,
      metadata,
      title,
      summary,
      expedited,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.gov.v1.MsgSubmitProposal',
      value: MsgSubmitProposal_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgSubmitProposal {
    return MsgSubmitProposal.fromProto(
      MsgSubmitProposal_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgSubmitProposal {
  export interface Amino {
    type: 'cosmos-sdk/v1/MsgSubmitProposal'
    value: {
      messages: Msg.Amino[]
      initial_deposit: Coins.Amino
      proposer: AccAddress
      metadata?: string
      title: string
      summary: string
      expedited: boolean
    }
  }

  export interface Data {
    '@type': '/cosmos.gov.v1.MsgSubmitProposal'
    messages: Msg.Data[]
    initial_deposit: Coins.Data
    proposer: AccAddress
    metadata: string
    title: string
    summary: string
    expedited: boolean
  }

  export type Proto = MsgSubmitProposal_pb
}
