import { Coins } from '../../Coins'
import { Content } from '../proposals'
import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgSubmitProposal as MsgSubmitProposal_pb } from '@initia/initia.proto/cosmos/gov/v1beta1/tx'

/**
 * Submit a proposal alongside an initial deposit.
 */
export class MsgSubmitProposalLegacy extends JSONSerializable<
  MsgSubmitProposalLegacy.Amino,
  MsgSubmitProposalLegacy.Data,
  MsgSubmitProposalLegacy.Proto
> {
  public initial_deposit: Coins

  /**
   * @param content proposal content to submit
   * @param initial_deposit deposit provided
   * @param proposer proposer's account address
   */
  constructor(
    public content: Content | undefined,
    initial_deposit: Coins.Input,
    public proposer: AccAddress
  ) {
    super()
    this.initial_deposit = new Coins(initial_deposit)
  }

  public static fromAmino(
    data: MsgSubmitProposalLegacy.Amino
  ): MsgSubmitProposalLegacy {
    const {
      value: { content, initial_deposit, proposer },
    } = data
    return new MsgSubmitProposalLegacy(
      content ? Content.fromAmino(content) : undefined,
      Coins.fromAmino(initial_deposit),
      proposer
    )
  }

  public toAmino(): MsgSubmitProposalLegacy.Amino {
    const { content, initial_deposit, proposer } = this
    return {
      type: 'cosmos-sdk/MsgSubmitProposal',
      value: {
        content: content?.toAmino(),
        initial_deposit: initial_deposit.toAmino(),
        proposer,
      },
    }
  }

  public static fromData(
    data: MsgSubmitProposalLegacy.Data
  ): MsgSubmitProposalLegacy {
    const { content, initial_deposit, proposer } = data
    return new MsgSubmitProposalLegacy(
      content ? Content.fromData(content) : undefined,
      Coins.fromData(initial_deposit),
      proposer
    )
  }

  public toData(): MsgSubmitProposalLegacy.Data {
    const { content, initial_deposit, proposer } = this
    return {
      '@type': '/cosmos.gov.v1beta1.MsgSubmitProposal',
      content: content?.toData(),
      initial_deposit: initial_deposit.toData(),
      proposer,
    }
  }

  public static fromProto(
    proto: MsgSubmitProposalLegacy.Proto
  ): MsgSubmitProposalLegacy {
    return new MsgSubmitProposalLegacy(
      proto.content ? Content.fromProto(proto.content) : undefined,
      Coins.fromProto(proto.initialDeposit),
      proto.proposer
    )
  }

  public toProto(): MsgSubmitProposalLegacy.Proto {
    const { content, initial_deposit, proposer } = this
    return MsgSubmitProposal_pb.fromPartial({
      content: content?.packAny(),
      initialDeposit: initial_deposit.toProto(),
      proposer,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.gov.v1beta1.MsgSubmitProposal',
      value: MsgSubmitProposal_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgSubmitProposalLegacy {
    return MsgSubmitProposalLegacy.fromProto(
      MsgSubmitProposal_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgSubmitProposalLegacy {
  export interface Amino {
    type: 'cosmos-sdk/MsgSubmitProposal'
    value: {
      content: Content.Amino | undefined
      initial_deposit: Coins.Amino
      proposer: AccAddress
    }
  }

  export interface Data {
    '@type': '/cosmos.gov.v1beta1.MsgSubmitProposal'
    content: Content.Data | undefined
    initial_deposit: Coins.Data
    proposer: AccAddress
  }

  export type Proto = MsgSubmitProposal_pb
}
