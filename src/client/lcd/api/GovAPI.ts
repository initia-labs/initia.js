import { BaseAPI } from './BaseAPI';
import { Proposal, Deposit, Vote, GovParams } from '../../../core';
import { APIParams, Pagination, PaginationOptions } from '../APIRequester';

export class GovAPI extends BaseAPI {
  /**
   * Gets all proposals.
   */
  public async proposals(
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[Proposal[], Pagination]> {
    return this.c
      .get<{
        proposals: Proposal.Data[];
        pagination: Pagination;
      }>(`/cosmos/gov/v1/proposals`, params)
      .then(d => [d.proposals.map(Proposal.fromData), d.pagination]);
  }

  /**
   * Get a specific proposal by its ID
   * @param proposalId proposal's ID
   */
  public async proposal(
    proposalId: number,
    params: APIParams = {}
  ): Promise<Proposal> {
    return this.c
      .get<{ proposal: Proposal.Data }>(
        `/cosmos/gov/v1/proposals/${proposalId}`,
        params
      )
      .then(d => Proposal.fromData(d.proposal));
  }

  /**
   * Get the deposits for a proposal
   * @param proposalId proposal's ID
   */
  public async deposits(
    proposalId: number,
    _params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[Deposit[], Pagination]> {
    return this.c
      .get<{ deposits: Deposit.Data[]; pagination: Pagination }>(
        `/cosmos/gov/v1/proposals/${proposalId}/deposits`,
        _params
      )
      .then(d => [
        d.deposits.map(deposit => Deposit.fromData(deposit)),
        d.pagination,
      ]);
  }

  /**
   * Get the current votes for a proposal
   * @param proposalId proposal's ID
   */
  public async votes(
    proposalId: number,
    _params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[Vote[], Pagination]> {
    return this.c
      .get<{ votes: Vote.Data[]; pagination: Pagination }>(
        `/cosmos/gov/v1/proposals/${proposalId}/votes`,
        _params
      )
      .then(d => [d.votes.map(v => Vote.fromData(v)), d.pagination]);
  }

  /**
   * Gets the current tally for a proposal.
   * @param proposalId proposal's ID
   */
  public async tally(
    proposalId: number,
    params: APIParams = {}
  ): Promise<Proposal.FinalTallyResult> {
    return this.c
      .get<{ tally: Proposal.FinalTallyResult }>(
        `/cosmos/gov/v1/proposals/${proposalId}/tally`,
        params
      )
      .then(d => d.tally);
  }

  /** Gets the Gov module's current parameters  */
  public async parameters(params: APIParams = {}): Promise<GovParams> {
    return this.c
      .get<{ params: GovParams.Data }>(`/initia/gov/v1/params`, params)
      .then(d => GovParams.fromData(d.params));
  }

  public async emergencyProposals(
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[Proposal[], Pagination]> {
    return this.c
      .get<{
        proposals: Proposal.Data[];
        pagination: Pagination;
      }>(`/initia/gov/v1/emergency_proposals`, params)
      .then(d => [
        d.proposals.map(prop => Proposal.fromData(prop)),
        d.pagination,
      ]);
  }

  public async lastEmergencyProposalTallyTimestamp(
    params: APIParams = {}
  ): Promise<Date> {
    return this.c
      .get<{ tally_timestamp: string }>(
        `/initia/gov/v1/last_emergency_proposal_tally_timestamp`,
        params
      )
      .then(d => new Date(d.tally_timestamp));
  }
}
