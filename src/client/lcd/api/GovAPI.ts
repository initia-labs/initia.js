import { BaseAPI } from './BaseAPI';
import {
  Proposal,
  AccAddress,
  Coins,
  Deposit,
  Vote,
  WeightedVoteOption,
  Tx,
  GovParams,
} from '../../../core';
import { APIParams, Pagination, PaginationOptions } from '../APIRequester';
import { TxSearchResult } from './TxAPI';
import {
  ProposalStatus,
  TallyResult,
} from '@initia/initia.proto/cosmos/gov/v1/gov';

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
   * Get the proposal's proposer
   * @param proposalId proposal's ID
   */
  public async proposer(proposalId: number): Promise<AccAddress> {
    const creationTx = await this.searchProposalCreationTx(proposalId);
    const msg = creationTx.body.messages.find(
      msg => msg['@type'] === '/cosmos.gov.v1.MsgSubmitProposal'
    );

    if (msg && msg['@type'] === '/cosmos.gov.v1.MsgSubmitProposal') {
      return msg.proposer;
    }

    throw Error('failed to fetch submit_proposer tx');
  }

  /**
   * Get the proposal's initial deposit
   * @param proposalId proposal's ID
   */
  public async initialDeposit(proposalId: number): Promise<Coins> {
    const creationTx = await this.searchProposalCreationTx(proposalId);
    const msg = creationTx.body.messages.find(
      msg => msg['@type'] === '/cosmos.gov.v1.MsgSubmitProposal'
    );

    if (msg && msg['@type'] === '/cosmos.gov.v1.MsgSubmitProposal') {
      return Coins.fromData(msg.initial_deposit);
    }

    throw Error('failed to fetch submit_proposer tx');
  }

  /**
   * Get the deposits for a proposal
   * @param proposalId proposal's ID
   */
  public async deposits(
    proposalId: number,
    _params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[Deposit[], Pagination]> {
    const proposal = await this.proposal(proposalId);
    if (
      proposal.status === ProposalStatus.PROPOSAL_STATUS_DEPOSIT_PERIOD ||
      proposal.status === ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD
    ) {
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

    // build search params
    const params = new URLSearchParams();
    params.append('events', `message.action='/cosmos.gov.v1.MsgDeposit'`);
    params.append('events', `proposal_deposit.proposal_id=${proposalId}`);

    Object.entries(_params).forEach(v => {
      params.append(v[0], v[1] as string);
    });

    return this.c
      .get<TxSearchResult.Data>(`/cosmos/tx/v1beta1/txs`, params)
      .then(d => {
        const deposits: Deposit[] = [];
        d.txs.map(tx =>
          tx.body.messages.forEach(msg => {
            if (
              msg['@type'] === '/cosmos.gov.v1.MsgDeposit' &&
              Number.parseInt(msg.proposal_id) == proposalId
            ) {
              deposits.push(
                new Deposit(
                  proposalId,
                  msg.depositor,
                  Coins.fromData(msg.amount)
                )
              );
            }
          }, deposits)
        );
        return [deposits, d.pagination];
      });
  }

  public async searchProposalCreationTx(proposalId: number): Promise<Tx.Data> {
    // build search params
    const params = new URLSearchParams();
    params.append(
      'events',
      `message.action='/cosmos.gov.v1.MsgSubmitProposal'`
    );
    params.append('events', `submit_proposal.proposal_id=${proposalId}`);

    return this.c
      .get<TxSearchResult.Data>(`/cosmos/tx/v1beta1/txs`, params)
      .then(d => {
        if (d.tx_responses.length === 0) {
          throw Error('failed to fetch submit_proposer tx');
        }

        return d.txs[0];
      });
  }

  /**
   * Get the current votes for a proposal
   * @param proposalId proposal's ID
   */
  public async votes(
    proposalId: number,
    _params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[Vote[], Pagination]> {
    const proposal = await this.proposal(proposalId);
    if (proposal.status === ProposalStatus.PROPOSAL_STATUS_DEPOSIT_PERIOD) {
      return this.c
        .get<{ votes: Vote.Data[]; pagination: Pagination }>(
          `/cosmos/gov/v1/proposals/${proposalId}/votes`,
          _params
        )
        .then(d => [d.votes.map(v => Vote.fromData(v)), d.pagination]);
    }

    // build search params
    const params = new URLSearchParams();
    params.append('events', `message.action='/cosmos.gov.v1.MsgVote'`);
    params.append('events', `proposal_vote.proposal_id=${proposalId}`);

    Object.entries(_params).forEach(v => {
      params.append(v[0], v[1] as string);
    });

    return this.c
      .get<TxSearchResult.Data>(`/cosmos/tx/v1beta1/txs`, params)
      .then(d => {
        const votes: Vote[] = [];
        d.txs.map(tx =>
          tx.body.messages.forEach(msg => {
            if (
              msg['@type'] === '/cosmos.gov.v1.MsgVote' &&
              Number.parseInt(msg.proposal_id) == proposalId
            ) {
              votes.push(
                new Vote(
                  proposalId,
                  msg.voter,
                  [new WeightedVoteOption(msg.option, '1')],
                  ''
                )
              );
            } else if (
              msg['@type'] === '/cosmos.gov.v1.MsgVoteWeighted' &&
              Number.parseInt(msg.proposal_id) == proposalId
            ) {
              votes.push(
                new Vote(
                  proposalId,
                  msg.voter,
                  msg.options.map(o => WeightedVoteOption.fromData(o)),
                  ''
                )
              );
            }
          }, votes)
        );

        return [votes, d.pagination];
      });
  }

  /**
   * Gets the current tally for a proposal.
   * @param proposalId proposal's ID
   */
  public async tally(
    proposalId: number,
    params: APIParams = {}
  ): Promise<TallyResult> {
    return this.c
      .get<{ tally: TallyResult }>(
        `/cosmos/gov/v1/proposals/${proposalId}/tally`,
        params
      )
      .then(d => d.tally);
  }

  /** Gets the Gov module's current parameters  */
  public async parameters(params: APIParams = {}): Promise<GovParams> {
    return this.c
      .get<{ params: GovParams.Data }>(`/cosmos/gov/v1/params/voting`, params)
      .then(d => GovParams.fromData(d.params));
  }
}
