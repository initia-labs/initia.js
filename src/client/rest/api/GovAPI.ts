import { BaseAPI } from './BaseAPI'
import { Proposal, Deposit, Vote, GovParams, TallyResult } from '../../../core'
import { APIParams, Pagination, PaginationOptions } from '../APIRequester'

export class GovAPI extends BaseAPI {
  /**
   * Query all proposals.
   */
  public async proposals(
    params: Partial<PaginationOptions & APIParams> = {},
    headers: Record<string, string> = {}
  ): Promise<[Proposal[], Pagination]> {
    return this.c
      .get<{
        proposals: Proposal.Data[]
        pagination: Pagination
      }>(`/initia/gov/v1/proposals`, params, headers)
      .then((d) => [d.proposals.map(Proposal.fromData), d.pagination])
  }

  /**
   * Query a specific proposal by its ID.
   * @param proposal_id proposal's ID
   */
  public async proposal(
    proposal_id: number,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<Proposal> {
    return this.c
      .get<{
        proposal: Proposal.Data
      }>(`/initia/gov/v1/proposals/${proposal_id}`, params, headers)
      .then((d) => Proposal.fromData(d.proposal))
  }

  /**
   * Query the deposits for a proposal.
   * @param proposal_id proposal's ID
   */
  public async deposits(
    proposal_id: number,
    params: Partial<PaginationOptions & APIParams> = {},
    headers: Record<string, string> = {}
  ): Promise<[Deposit[], Pagination]> {
    return this.c
      .get<{
        deposits: Deposit.Data[]
        pagination: Pagination
      }>(`/cosmos/gov/v1/proposals/${proposal_id}/deposits`, params, headers)
      .then((d) => [
        d.deposits.map((deposit) => Deposit.fromData(deposit)),
        d.pagination,
      ])
  }

  /**
   * Query the current votes for a proposal.
   * @param proposal_id proposal's ID
   */
  public async votes(
    proposal_id: number,
    params: Partial<PaginationOptions & APIParams> = {},
    headers: Record<string, string> = {}
  ): Promise<[Vote[], Pagination]> {
    return this.c
      .get<{
        votes: Vote.Data[]
        pagination: Pagination
      }>(`/cosmos/gov/v1/proposals/${proposal_id}/votes`, params, headers)
      .then((d) => [d.votes.map((v) => Vote.fromData(v)), d.pagination])
  }

  /**
   * Query the current tally for a proposal.
   * @param proposal_id proposal's ID
   */
  public async tally(
    proposal_id: number,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<TallyResult> {
    return this.c
      .get<{
        tally_result: TallyResult.Data
      }>(`/initia/gov/v1/proposals/${proposal_id}/tally`, params, headers)
      .then((d) => TallyResult.fromData(d.tally_result))
  }

  /**
   * Query the parameters of the gov module.
   */
  public async parameters(
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<GovParams> {
    return this.c
      .get<{ params: GovParams.Data }>(`/initia/gov/v1/params`, params, headers)
      .then((d) => GovParams.fromData(d.params))
  }

  /**
   * Query all emergency proposals.
   */
  public async emergencyProposals(
    params: Partial<PaginationOptions & APIParams> = {},
    headers: Record<string, string> = {}
  ): Promise<[Proposal[], Pagination]> {
    return this.c
      .get<{
        proposals: Proposal.Data[]
        pagination: Pagination
      }>(`/initia/gov/v1/emergency_proposals`, params, headers)
      .then((d) => [
        d.proposals.map((prop) => Proposal.fromData(prop)),
        d.pagination,
      ])
  }
}
