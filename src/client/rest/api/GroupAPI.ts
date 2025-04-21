import { BaseAPI } from './BaseAPI'
import {
  AccAddress,
  GroupInfo,
  GroupMember,
  GroupPolicyInfo,
  GroupProposal,
  GroupVote,
} from '../../../core'
import { APIParams, Pagination, PaginationOptions } from '../APIRequester'

export class GroupAPI extends BaseAPI {
  /**
   * Query the group info based on group id.
   * @param group_id the unique ID of the group
   */
  public async groupInfo(
    group_id: number,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<GroupInfo> {
    return this.c
      .get<{
        info: GroupInfo.Data
      }>(`/cosmos/group/v1/group_info/${group_id}`, params, headers)
      .then((d) => GroupInfo.fromData(d.info))
  }

  /**
   * Query the group policy info based on account address of group policy.
   * @param address the account address of the group policy
   */
  public async groupPolicyInfo(
    address: AccAddress,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<GroupPolicyInfo> {
    return this.c
      .get<{
        info: GroupPolicyInfo.Data
      }>(`/cosmos/group/v1/group_policy_info/${address}`, params, headers)
      .then((d) => GroupPolicyInfo.fromData(d.info))
  }

  /**
   * Query members of a group by group id.
   * @param group_id the unique ID of the group
   */
  public async groupMembers(
    group_id: number,
    params: Partial<PaginationOptions & APIParams> = {},
    headers: Record<string, string> = {}
  ): Promise<[GroupMember[], Pagination]> {
    return this.c
      .get<{
        members: GroupMember.Data[]
        pagination: Pagination
      }>(`/cosmos/group/v1/group_members/${group_id}`, params, headers)
      .then((d) => [d.members.map(GroupMember.fromData), d.pagination])
  }

  /**
   * Query groups by admin address.
   * @param admin the account address of a group's admin
   */
  public async groupsByAdmin(
    admin: AccAddress,
    params: Partial<PaginationOptions & APIParams> = {},
    headers: Record<string, string> = {}
  ): Promise<[GroupInfo[], Pagination]> {
    return this.c
      .get<{
        groups: GroupInfo.Data[]
        pagination: Pagination
      }>(`/cosmos/group/v1/groups_by_admin/${admin}`, params, headers)
      .then((d) => [d.groups.map(GroupInfo.fromData), d.pagination])
  }

  /**
   * Query group policies by group id.
   * @param group_id the unique ID of the group
   */
  public async groupPoliciesByGroup(
    group_id: number,
    params: Partial<PaginationOptions & APIParams> = {},
    headers: Record<string, string> = {}
  ): Promise<[GroupPolicyInfo[], Pagination]> {
    return this.c
      .get<{
        group_policies: GroupPolicyInfo.Data[]
        pagination: Pagination
      }>(
        `/cosmos/group/v1/group_policies_by_group/${group_id}`,
        params,
        headers
      )
      .then((d) => [
        d.group_policies.map(GroupPolicyInfo.fromData),
        d.pagination,
      ])
  }

  /**
   * Query groups policies by admin address.
   * @param admin the admin address of the group policy
   */
  public async groupPoliciesByAdmin(
    admin: AccAddress,
    params: Partial<PaginationOptions & APIParams> = {},
    headers: Record<string, string> = {}
  ): Promise<[GroupPolicyInfo[], Pagination]> {
    return this.c
      .get<{
        group_policies: GroupPolicyInfo.Data[]
        pagination: Pagination
      }>(`/cosmos/group/v1/group_policies_by_admin/${admin}`, params, headers)
      .then((d) => [
        d.group_policies.map(GroupPolicyInfo.fromData),
        d.pagination,
      ])
  }

  /**
   * Query proposal based on proposal id.
   * @param proposal_id the unique ID of a proposal
   */
  public async proposal(
    proposal_id: number,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<GroupProposal> {
    return this.c
      .get<{
        proposal: GroupProposal.Data
      }>(`/cosmos/group/v1/proposal/${proposal_id}`, params, headers)
      .then((d) => GroupProposal.fromData(d.proposal))
  }

  /**
   * Query proposals based on account address of group policy.
   * @param address the account address of the group policy related to proposals
   */
  public async proposalsByGroupPolicy(
    address: AccAddress,
    params: Partial<PaginationOptions & APIParams> = {},
    headers: Record<string, string> = {}
  ): Promise<[GroupProposal[], Pagination]> {
    return this.c
      .get<{
        proposals: GroupProposal.Data[]
        pagination: Pagination
      }>(
        `/cosmos/group/v1/proposals_by_group_policy/${address}`,
        params,
        headers
      )
      .then((d) => [d.proposals.map(GroupProposal.fromData), d.pagination])
  }

  /**
   * Query a vote by proposal id and voter.
   * @param proposal_id the unique ID of a proposal
   * @param voter a proposal voter account address
   */
  public async voteByProposalVoter(
    proposal_id: number,
    voter: AccAddress,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<GroupVote> {
    return this.c
      .get<{
        vote: GroupVote.Data
      }>(
        `/cosmos/group/v1/vote_by_proposal_voter/${proposal_id}/${voter}`,
        params,
        headers
      )
      .then((d) => GroupVote.fromData(d.vote))
  }

  /**
   * Query votes by proposal id.
   * @param proposal_id the unique ID of a proposal
   */
  public async votesByProposal(
    proposal_id: number,
    params: Partial<PaginationOptions & APIParams> = {},
    headers: Record<string, string> = {}
  ): Promise<[GroupVote[], Pagination]> {
    return this.c
      .get<{
        votes: GroupVote.Data[]
        pagination: Pagination
      }>(`/cosmos/group/v1/votes_by_proposal/${proposal_id}`, params, headers)
      .then((d) => [d.votes.map(GroupVote.fromData), d.pagination])
  }

  /**
   * Query votes by voter.
   * @param voter a proposal voter account address
   */
  public async votesByVoter(
    voter: AccAddress,
    params: Partial<PaginationOptions & APIParams> = {},
    headers: Record<string, string> = {}
  ): Promise<[GroupVote[], Pagination]> {
    return this.c
      .get<{
        votes: GroupVote.Data[]
        pagination: Pagination
      }>(`/cosmos/group/v1/votes_by_voter/${voter}`, params, headers)
      .then((d) => [d.votes.map(GroupVote.fromData), d.pagination])
  }

  /**
   * Query groups by member address.
   * @param address the group member address
   */
  public async groupsByMember(
    address: AccAddress,
    params: Partial<PaginationOptions & APIParams> = {},
    headers: Record<string, string> = {}
  ): Promise<[GroupInfo[], Pagination]> {
    return this.c
      .get<{
        groups: GroupInfo.Data[]
        pagination: Pagination
      }>(`/cosmos/group/v1/groups_by_member/${address}`, params, headers)
      .then((d) => [d.groups.map(GroupInfo.fromData), d.pagination])
  }

  /**
   * Query the tally result of a proposal.
   * If still in voting period, returns the current tally state.
   * If proposal is final, returns the `final_tally_result`.
   * @param proposal_id the unique id of a proposal
   */
  public async tally(
    proposal_id: number,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<GroupProposal.FinalTallyResult> {
    return this.c
      .get<{
        tally: GroupProposal.FinalTallyResult
      }>(`/cosmos/group/v1/proposals/${proposal_id}/tally`, params, headers)
      .then((d) => d.tally)
  }

  /**
   * Query all groups in state.
   */
  public async groups(
    params: Partial<PaginationOptions & APIParams> = {},
    headers: Record<string, string> = {}
  ): Promise<[GroupInfo[], Pagination]> {
    return this.c
      .get<{
        groups: GroupInfo.Data[]
        pagination: Pagination
      }>(`/cosmos/group/v1/groups`, params, headers)
      .then((d) => [d.groups.map(GroupInfo.fromData), d.pagination])
  }
}
