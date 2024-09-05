import { APIRequester } from '../APIRequester'
import { GovAPI } from './GovAPI'
import { Coins, Duration } from '../../../core'

const c = new APIRequester('https://lcd.devnet.initia.xyz/')
const gov = new GovAPI(c)

describe('GovAPI', () => {
  it('parameters', async () => {
    await expect(gov.parameters()).resolves.toMatchObject({
      min_deposit: expect.any(Coins),
      max_deposit_period: expect.any(Duration),
      voting_period: expect.any(Duration),
      quorum: expect.any(String),
      threshold: expect.any(String),
      veto_threshold: expect.any(String),
      min_initial_deposit_ratio: expect.any(String),
      proposal_cancel_ratio: expect.any(String),
      proposal_cancel_dest: expect.any(String),
      expedited_voting_period: expect.any(Duration),
      expedited_threshold: expect.any(String),
      expedited_min_deposit: expect.any(Coins),
      burn_vote_quorum: expect.any(Boolean),
      burn_proposal_deposit_prevote: expect.any(Boolean),
      burn_vote_veto: expect.any(Boolean),
      min_deposit_ratio: expect.any(String),
      emergency_min_deposit: expect.any(Coins),
      emergency_tally_interval: expect.any(Duration),
      low_threshold_functions: expect.any(Array<string>),
    })
  })

  // it('tally', async () => {
  //   await expect(gov.tally(5333)).resolves.toMatchObject({
  //     yes: expect.any(String),
  //     abstain: expect.any(String),
  //     no: expect.any(String),
  //     no_with_veto: expect.any(String),
  //   });
  // });

  // it('proposals', async () => {
  //   const proposals = await gov.proposals().then(v => v[0]);
  //   expect(proposals).toContainEqual(expect.any(Proposal));
  // });

  // it('proposal', async () => {
  //   const proposalId = await gov.proposals().then(v => v[0][0].id);
  //   const proposal = await gov.proposal(proposalId);
  //   expect(proposal).toEqual(expect.any(Proposal));
  // });

  // it('proposer', async () => {
  //   const proposalId = await gov.proposals().then(v => v[0][0].id);
  //   const proposer = await gov.proposer(proposalId);
  //   expect(proposer).toEqual(expect.any(String));
  // });

  // it('initialDeposit', async () => {
  //   const proposalId = await gov.proposals().then(v => v[0][0].id);
  //   const initialDeposit = await gov.initialDeposit(proposalId);
  //   expect(initialDeposit).toEqual(expect.any(Coins));
  // });

  // it('deposits', async () => {
  //   const proposals = await gov.proposals().then(v => v[0]);
  //   const proposalId = proposals[0].id;
  //   const deposits = await gov.deposits(proposalId).then(v => v[0][0]);
  //   if (deposits !== undefined) {
  //     expect(deposits).toEqual(expect.any(Deposit));
  //   }
  // });
})
