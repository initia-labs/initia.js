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
  public async groupInfo(groupId: number): Promise<GroupInfo> {
    return this.c
      .get<{ info: GroupInfo.Data }>(`/cosmos/group/v1/group_info/${groupId}`)
      .then((d) => GroupInfo.fromData(d.info))
  }

  public async groupPolicyInfo(address: AccAddress): Promise<GroupPolicyInfo> {
    return this.c
      .get<{
        info: GroupPolicyInfo.Data
      }>(`/cosmos/group/v1/group_policy_info/${address}`)
      .then((d) => GroupPolicyInfo.fromData(d.info))
  }

  public async groupMembers(
    groupId: number,
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[GroupMember[], Pagination]> {
    return this.c
      .get<{
        members: GroupMember.Data[]
        pagination: Pagination
      }>(`/cosmos/group/v1/group_members/${groupId}`, params)
      .then((d) => [d.members.map(GroupMember.fromData), d.pagination])
  }

  public async groupsByAdmin(
    admin: AccAddress,
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[GroupInfo[], Pagination]> {
    return this.c
      .get<{
        groups: GroupInfo.Data[]
        pagination: Pagination
      }>(`/cosmos/group/v1/groups_by_admin/${admin}`, params)
      .then((d) => [d.groups.map(GroupInfo.fromData), d.pagination])
  }

  public async groupPoliciesByGroup(
    groupId: number,
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[GroupPolicyInfo[], Pagination]> {
    return this.c
      .get<{
        group_policies: GroupPolicyInfo.Data[]
        pagination: Pagination
      }>(`/cosmos/group/v1/group_policies_by_group/${groupId}`, params)
      .then((d) => [
        d.group_policies.map(GroupPolicyInfo.fromData),
        d.pagination,
      ])
  }

  public async groupPoliciesByAdmin(
    admin: AccAddress,
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[GroupPolicyInfo[], Pagination]> {
    return this.c
      .get<{
        group_policies: GroupPolicyInfo.Data[]
        pagination: Pagination
      }>(`/cosmos/group/v1/group_policies_by_admin/${admin}`, params)
      .then((d) => [
        d.group_policies.map(GroupPolicyInfo.fromData),
        d.pagination,
      ])
  }

  public async proposal(proposalId: number): Promise<GroupProposal> {
    return this.c
      .get<{
        proposal: GroupProposal.Data
      }>(`/cosmos/group/v1/proposal/${proposalId}`)
      .then((d) => GroupProposal.fromData(d.proposal))
  }

  public async proposalsByGroupPolicy(
    address: AccAddress,
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[GroupProposal[], Pagination]> {
    return this.c
      .get<{
        proposals: GroupProposal.Data[]
        pagination: Pagination
      }>(`/cosmos/group/v1/proposals_by_group_policy/${address}`, params)
      .then((d) => [d.proposals.map(GroupProposal.fromData), d.pagination])
  }

  public async voteByProposalVoter(
    proposalId: number,
    voter: AccAddress
  ): Promise<GroupVote> {
    return this.c
      .get<{
        vote: GroupVote.Data
      }>(`/cosmos/group/v1/vote_by_proposal_voter/${proposalId}/${voter}`)
      .then((d) => GroupVote.fromData(d.vote))
  }

  public async votesByProposal(
    proposalId: number,
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[GroupVote[], Pagination]> {
    return this.c
      .get<{
        votes: GroupVote.Data[]
        pagination: Pagination
      }>(`/cosmos/group/v1/votes_by_proposal/${proposalId}`, params)
      .then((d) => [d.votes.map(GroupVote.fromData), d.pagination])
  }

  public async votesByVoter(
    voter: AccAddress,
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[GroupVote[], Pagination]> {
    return this.c
      .get<{
        votes: GroupVote.Data[]
        pagination: Pagination
      }>(`/cosmos/group/v1/votes_by_voter/${voter}`, params)
      .then((d) => [d.votes.map(GroupVote.fromData), d.pagination])
  }

  public async groupsByMember(
    address: AccAddress,
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[GroupInfo[], Pagination]> {
    return this.c
      .get<{
        groups: GroupInfo.Data[]
        pagination: Pagination
      }>(`/cosmos/group/v1/groups_by_member/${address}`, params)
      .then((d) => [d.groups.map(GroupInfo.fromData), d.pagination])
  }

  public async tally(
    proposalId: number
  ): Promise<GroupProposal.FinalTallyResult> {
    return this.c
      .get<{
        tally: GroupProposal.FinalTallyResult
      }>(`/cosmos/group/v1/proposals/${proposalId}/tally`)
      .then((d) => d.tally)
  }

  public async groups(
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[GroupInfo[], Pagination]> {
    return this.c
      .get<{
        groups: GroupInfo.Data[]
        pagination: Pagination
      }>(`/cosmos/group/v1/groups`, params)
      .then((d) => [d.groups.map(GroupInfo.fromData), d.pagination])
  }
}
