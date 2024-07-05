import { JSONSerializable } from '../../util/json'
import { num } from '../num'
import { AccAddress } from '../bech32'
import { Msg } from '../Msg'
import {
  Proposal as Proposal_pb,
  ProposalStatus,
  TallyResult,
  ProposalExecutorResult,
  proposalStatusFromJSON,
  proposalStatusToJSON,
  proposalExecutorResultFromJSON,
  proposalExecutorResultToJSON,
} from '@initia/initia.proto/cosmos/group/v1/types'
import Long from 'long'

/**
 * A group proposal consists of a set of `sdk.Msg`s that will be executed if the proposal
 * passes as well as some optional metadata associated with the proposal
 */
export class GroupProposal extends JSONSerializable<
  GroupProposal.Amino,
  GroupProposal.Data,
  GroupProposal.Proto
> {
  /**
   *
   * @param id the unique id of the proposal
   * @param group_policy_address the account address of group policy
   * @param metadata any arbitrary metadata attached to the proposal
   * @param proposers the account addresses of the proposers
   * @param submit_time timestamp specifying when a proposal was submitted
   * @param group_version tracks the version of the group at proposal submission
   * @param group_policy_version tracks the version of the group policy at proposal submission
   * @param status proposal's status
   * @param final_tally_result tally result
   * @param voting_period_end the timestamp before which voting must be done
   * @param executor_result the final result of the proposal execution
   * @param messages list of `sdk.Msg`s that will be executed if the proposal passes
   * @param title title of the proposal
   * @param summary short summary of the proposal
   */
  constructor(
    public id: number,
    public group_policy_address: AccAddress,
    public metadata: string,
    public proposers: AccAddress[],
    public submit_time: Date,
    public group_version: number,
    public group_policy_version: number,
    public status: ProposalStatus,
    public final_tally_result: GroupProposal.FinalTallyResult,
    public voting_period_end: Date,
    public executor_result: ProposalExecutorResult,
    public messages: Msg[],
    public title: string,
    public summary: string
  ) {
    super()
  }

  public static fromAmino(data: GroupProposal.Amino): GroupProposal {
    const {
      id,
      group_policy_address,
      metadata,
      proposers,
      submit_time,
      group_version,
      group_policy_version,
      status,
      final_tally_result,
      voting_period_end,
      executor_result,
      messages,
      title,
      summary,
    } = data

    return new GroupProposal(
      Number.parseInt(id),
      group_policy_address,
      metadata,
      proposers,
      new Date(submit_time),
      Number.parseInt(group_version),
      Number.parseInt(group_policy_version),
      proposalStatusFromJSON(status),
      {
        yes_count: num(final_tally_result.yes_count ?? 0).toFixed(0),
        no_count: num(final_tally_result.no_count ?? 0).toFixed(0),
        abstain_count: num(final_tally_result.abstain_count ?? 0).toFixed(0),
        no_with_veto_count: num(
          final_tally_result.no_with_veto_count ?? 0
        ).toFixed(0),
      },
      new Date(voting_period_end),
      proposalExecutorResultFromJSON(executor_result),
      messages.map(Msg.fromAmino),
      title,
      summary
    )
  }

  public toAmino(): GroupProposal.Amino {
    const {
      id,
      group_policy_address,
      metadata,
      proposers,
      submit_time,
      group_version,
      group_policy_version,
      status,
      final_tally_result,
      voting_period_end,
      executor_result,
      messages,
      title,
      summary,
    } = this

    return {
      id: id.toString(),
      group_policy_address,
      metadata,
      proposers,
      submit_time: submit_time.toISOString(),
      group_version: group_version.toString(),
      group_policy_version: group_policy_version.toString(),
      status: proposalStatusToJSON(status),
      final_tally_result: {
        yes_count: num(final_tally_result.yes_count).toFixed(),
        no_count: num(final_tally_result.no_count).toFixed(),
        abstain_count: num(final_tally_result.abstain_count).toFixed(),
        no_with_veto_count: num(
          final_tally_result.no_with_veto_count
        ).toFixed(),
      },
      voting_period_end: voting_period_end.toISOString(),
      executor_result: proposalExecutorResultToJSON(executor_result),
      messages: messages.map((msg) => msg.toAmino()),
      title,
      summary,
    }
  }

  public static fromData(data: GroupProposal.Data): GroupProposal {
    const {
      id,
      group_policy_address,
      metadata,
      proposers,
      submit_time,
      group_version,
      group_policy_version,
      status,
      final_tally_result,
      voting_period_end,
      executor_result,
      messages,
      title,
      summary,
    } = data

    return new GroupProposal(
      Number.parseInt(id),
      group_policy_address,
      metadata,
      proposers,
      new Date(submit_time),
      Number.parseInt(group_version),
      Number.parseInt(group_policy_version),
      proposalStatusFromJSON(status),
      {
        yes_count: num(final_tally_result.yes_count ?? 0).toFixed(0),
        no_count: num(final_tally_result.no_count ?? 0).toFixed(0),
        abstain_count: num(final_tally_result.abstain_count ?? 0).toFixed(0),
        no_with_veto_count: num(
          final_tally_result.no_with_veto_count ?? 0
        ).toFixed(0),
      },
      new Date(voting_period_end),
      proposalExecutorResultFromJSON(executor_result),
      messages.map(Msg.fromData),
      title,
      summary
    )
  }

  public toData(): GroupProposal.Data {
    const {
      id,
      group_policy_address,
      metadata,
      proposers,
      submit_time,
      group_version,
      group_policy_version,
      status,
      final_tally_result,
      voting_period_end,
      executor_result,
      messages,
      title,
      summary,
    } = this

    return {
      id: id.toString(),
      group_policy_address,
      metadata,
      proposers,
      submit_time: submit_time.toISOString(),
      group_version: group_version.toString(),
      group_policy_version: group_policy_version.toString(),
      status: proposalStatusToJSON(status),
      final_tally_result: {
        yes_count: num(final_tally_result.yes_count).toFixed(),
        no_count: num(final_tally_result.no_count).toFixed(),
        abstain_count: num(final_tally_result.abstain_count).toFixed(),
        no_with_veto_count: num(
          final_tally_result.no_with_veto_count
        ).toFixed(),
      },
      voting_period_end: voting_period_end.toISOString(),
      executor_result: proposalExecutorResultToJSON(executor_result),
      messages: messages.map((msg) => msg.toData()),
      title,
      summary,
    }
  }

  public static fromProto(data: GroupProposal.Proto): GroupProposal {
    return new GroupProposal(
      data.id.toNumber(),
      data.groupPolicyAddress,
      data.metadata,
      data.proposers,
      data.submitTime as Date,
      data.groupVersion.toNumber(),
      data.groupPolicyVersion.toNumber(),
      data.status,
      {
        yes_count: num(data.finalTallyResult?.yesCount ?? 0).toFixed(0),
        no_count: num(data.finalTallyResult?.noCount ?? 0).toFixed(0),
        abstain_count: num(data.finalTallyResult?.abstainCount ?? 0).toFixed(0),
        no_with_veto_count: num(
          data.finalTallyResult?.noWithVetoCount ?? 0
        ).toFixed(0),
      },
      data.votingPeriodEnd as Date,
      data.executorResult,
      data.messages.map(Msg.fromProto),
      data.title,
      data.summary
    )
  }

  public toProto(): GroupProposal.Proto {
    const {
      id,
      group_policy_address,
      metadata,
      proposers,
      submit_time,
      group_version,
      group_policy_version,
      status,
      final_tally_result,
      voting_period_end,
      executor_result,
      messages,
      title,
      summary,
    } = this

    let ftr: TallyResult | undefined
    if (final_tally_result) {
      ftr = TallyResult.fromPartial({
        yesCount: final_tally_result.yes_count.toString(),
        noCount: final_tally_result.no_count.toString(),
        abstainCount: final_tally_result.abstain_count.toString(),
        noWithVetoCount: final_tally_result.no_with_veto_count.toString(),
      })
    }

    return Proposal_pb.fromPartial({
      id: Long.fromNumber(id),
      groupPolicyAddress: group_policy_address,
      metadata,
      proposers,
      submitTime: submit_time,
      groupVersion: Long.fromNumber(group_version),
      groupPolicyVersion: Long.fromNumber(group_policy_version),
      status,
      finalTallyResult: ftr,
      votingPeriodEnd: voting_period_end,
      executorResult: executor_result,
      messages: messages.map((msg) => msg.packAny()),
      title,
      summary,
    })
  }
}

export namespace GroupProposal {
  export const Status = ProposalStatus
  export type Status = ProposalStatus
  export const ExecutorResult = ProposalExecutorResult
  export type ExecutorResult = ProposalExecutorResult

  export interface FinalTallyResult {
    yes_count: string
    abstain_count: string
    no_count: string
    no_with_veto_count: string
  }

  export interface Amino {
    id: string
    group_policy_address: AccAddress
    metadata: string
    proposers: AccAddress[]
    submit_time: string
    group_version: string
    group_policy_version: string
    status: string
    final_tally_result: {
      yes_count: string
      abstain_count: string
      no_count: string
      no_with_veto_count: string
    }
    voting_period_end: string
    executor_result: string
    messages: Msg.Amino[]
    title: string
    summary: string
  }

  export interface Data {
    id: string
    group_policy_address: AccAddress
    metadata: string
    proposers: AccAddress[]
    submit_time: string
    group_version: string
    group_policy_version: string
    status: string
    final_tally_result: {
      yes_count: string
      abstain_count: string
      no_count: string
      no_with_veto_count: string
    }
    voting_period_end: string
    executor_result: string
    messages: Msg.Data[]
    title: string
    summary: string
  }

  export type Proto = Proposal_pb
}
