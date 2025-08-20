import { JSONSerializable } from '../../../util/json'
import { Coins } from '../../Coins'
import { AccAddress } from '../../bech32'
import { Msg } from '../../Msg'
import { TallyResult } from '../TallyResult'
import {
  ProposalStatus,
  proposalStatusFromJSON,
  proposalStatusToJSON,
} from '@initia/initia.proto/cosmos/gov/v1/gov'
import { Proposal as Proposal_pb } from '@initia/initia.proto/initia/gov/v1/gov'

/**
 * Proposal defines the core field members of a governance proposal.
 */
export class Proposal extends JSONSerializable<
  Proposal.Amino,
  Proposal.Data,
  Proposal.Proto
> {
  public total_deposit: Coins

  /**
   * @param id the unique id of the proposal
   * @param messages the arbitrary messages to be executed if the proposal passes
   * @param status the proposal status
   * @param final_tally_result the final tally result of the proposal
   * @param submit_time the time of proposal submission
   * @param deposit_end_time the end time for deposition
   * @param total_deposit the total deposit on the proposal
   * @param voting_start_time the starting time to vote on a proposal
   * @param voting_end_time the end time of voting on a proposal
   * @param emergency_start_time
   * @param emergency_next_tally_time
   * @param metadata any arbitrary metadata attached to the proposal
   * @param title title of the proposal
   * @param summary short summary of the proposal
   * @param proposer the address of the proposal sumbitter
   * @param expedited if the proposal is expedited
   * @param emergency
   * @param failed_reason the reason why the proposal failed
   */
  constructor(
    public id: number,
    public messages: Msg[],
    public status: ProposalStatus,
    public final_tally_result: TallyResult,
    public submit_time: Date,
    public deposit_end_time: Date,
    total_deposit: Coins.Input,
    public voting_start_time: Date,
    public voting_end_time: Date,
    public emergency_start_time: Date,
    public emergency_next_tally_time: Date,
    public metadata: string,
    public title: string,
    public summary: string,
    public proposer: AccAddress,
    public expedited: boolean,
    public emergency: boolean,
    public failed_reason: string
  ) {
    super()
    this.total_deposit = new Coins(total_deposit)
  }

  public static fromAmino(data: Proposal.Amino): Proposal {
    const {
      id,
      messages,
      status,
      final_tally_result,
      submit_time,
      deposit_end_time,
      total_deposit,
      voting_start_time,
      voting_end_time,
      emergency_start_time,
      emergency_next_tally_time,
      metadata,
      title,
      summary,
      proposer,
      expedited,
      emergency,
      failed_reason,
    } = data

    return new Proposal(
      parseInt(id),
      messages.map(Msg.fromAmino),
      proposalStatusFromJSON(status),
      TallyResult.fromAmino(final_tally_result),
      new Date(submit_time),
      new Date(deposit_end_time),
      total_deposit ? Coins.fromAmino(total_deposit) : new Coins(),
      new Date(voting_start_time),
      new Date(voting_end_time),
      new Date(emergency_start_time),
      new Date(emergency_next_tally_time),
      metadata,
      title,
      summary,
      proposer,
      expedited,
      emergency,
      failed_reason
    )
  }

  public toAmino(): Proposal.Amino {
    const {
      id,
      messages,
      status,
      final_tally_result,
      submit_time,
      deposit_end_time,
      total_deposit,
      voting_start_time,
      voting_end_time,
      emergency_start_time,
      emergency_next_tally_time,
      metadata,
      title,
      summary,
      proposer,
      expedited,
      emergency,
      failed_reason,
    } = this

    return {
      id: id.toFixed(),
      messages: messages.map((msg) => msg.toAmino()),
      status: proposalStatusToJSON(status),
      final_tally_result: final_tally_result.toAmino(),
      submit_time: submit_time.toISOString(),
      deposit_end_time: deposit_end_time.toISOString(),
      total_deposit:
        total_deposit.toArray().length > 0 ? total_deposit.toAmino() : null,
      voting_start_time: voting_start_time.toISOString(),
      voting_end_time: voting_end_time.toISOString(),
      emergency_start_time: emergency_start_time.toISOString(),
      emergency_next_tally_time: emergency_next_tally_time.toISOString(),
      metadata,
      title,
      summary,
      proposer,
      expedited,
      emergency,
      failed_reason,
    }
  }

  public static fromData(data: Proposal.Data): Proposal {
    const {
      id,
      messages,
      status,
      final_tally_result,
      submit_time,
      deposit_end_time,
      total_deposit,
      voting_start_time,
      voting_end_time,
      emergency_start_time,
      emergency_next_tally_time,
      metadata,
      title,
      summary,
      proposer,
      expedited,
      emergency,
      failed_reason,
    } = data

    return new Proposal(
      parseInt(id),
      messages.map(Msg.fromData),
      proposalStatusFromJSON(status),
      TallyResult.fromData(final_tally_result),
      new Date(submit_time),
      new Date(deposit_end_time),
      Coins.fromData(total_deposit),
      new Date(voting_start_time),
      new Date(voting_end_time),
      new Date(emergency_start_time),
      new Date(emergency_next_tally_time),
      metadata,
      title,
      summary,
      proposer,
      expedited,
      emergency,
      failed_reason
    )
  }

  public toData(): Proposal.Data {
    const {
      id,
      messages,
      status,
      final_tally_result,
      submit_time,
      deposit_end_time,
      total_deposit,
      voting_start_time,
      voting_end_time,
      emergency_start_time,
      emergency_next_tally_time,
      metadata,
      title,
      summary,
      proposer,
      expedited,
      emergency,
      failed_reason,
    } = this

    return {
      id: id.toFixed(),
      messages: messages.map((msg) => msg.toData()),
      status: proposalStatusToJSON(status),
      final_tally_result: final_tally_result.toData(),
      submit_time: submit_time.toISOString(),
      deposit_end_time: deposit_end_time.toISOString(),
      total_deposit: total_deposit.toData(),
      voting_start_time: voting_start_time.toISOString(),
      voting_end_time: voting_end_time.toISOString(),
      emergency_start_time: emergency_start_time.toISOString(),
      emergency_next_tally_time: emergency_next_tally_time.toISOString(),
      metadata,
      title,
      summary,
      proposer,
      expedited,
      emergency,
      failed_reason,
    }
  }

  public static fromProto(data: Proposal.Proto): Proposal {
    return new Proposal(
      Number(data.id),
      data.messages.map(Msg.fromProto),
      data.status,
      TallyResult.fromProto(data.finalTallyResult as TallyResult.Proto),
      data.submitTime as Date,
      data.depositEndTime as Date,
      Coins.fromProto(data.totalDeposit),
      data.votingStartTime as Date,
      data.votingEndTime as Date,
      data.emergencyStartTime as Date,
      data.emergencyNextTallyTime as Date,
      data.metadata,
      data.title,
      data.summary,
      data.proposer,
      data.expedited,
      data.emergency,
      data.failedReason
    )
  }

  public toProto(): Proposal.Proto {
    const {
      id,
      messages,
      status,
      final_tally_result,
      submit_time,
      deposit_end_time,
      total_deposit,
      voting_start_time,
      voting_end_time,
      emergency_start_time,
      emergency_next_tally_time,
      metadata,
      title,
      summary,
      proposer,
      expedited,
      emergency,
      failed_reason,
    } = this

    return Proposal_pb.fromPartial({
      id: BigInt(id),
      messages: messages.map((msg) => msg.packAny()),
      status,
      finalTallyResult: final_tally_result.toProto(),
      submitTime: submit_time,
      depositEndTime: deposit_end_time,
      totalDeposit: total_deposit.toProto(),
      votingStartTime: voting_start_time,
      votingEndTime: voting_end_time,
      emergencyStartTime: emergency_start_time,
      emergencyNextTallyTime: emergency_next_tally_time,
      metadata,
      title,
      summary,
      proposer,
      expedited,
      emergency,
      failedReason: failed_reason,
    })
  }
}

export namespace Proposal {
  export const Status = ProposalStatus
  export type Status = ProposalStatus

  export interface Amino {
    id: string
    messages: Msg.Amino[]
    status: string
    final_tally_result: TallyResult.Amino
    submit_time: string
    deposit_end_time: string
    total_deposit: Coins.Amino | null
    voting_start_time: string
    voting_end_time: string
    emergency_start_time: string
    emergency_next_tally_time: string
    metadata: string
    title: string
    summary: string
    proposer: AccAddress
    expedited: boolean
    emergency: boolean
    failed_reason: string
  }

  export interface Data {
    id: string
    messages: Msg.Data[]
    status: string
    final_tally_result: TallyResult.Data
    submit_time: string
    deposit_end_time: string
    total_deposit: Coins.Data
    voting_start_time: string
    voting_end_time: string
    emergency_start_time: string
    emergency_next_tally_time: string
    metadata: string
    title: string
    summary: string
    proposer: AccAddress
    expedited: boolean
    emergency: boolean
    failed_reason: string
  }

  export type Proto = Proposal_pb
}
