import { APIRequester } from '../APIRequester'
import { GovAPI } from './GovAPI'
import { Coins } from '../../../core'

const c = new APIRequester('https://stone-rest.initia.tech/')
const gov = new GovAPI(c)

describe('GovAPI', () => {
  it('parameters', async () => {
    await expect(gov.parameters()).resolves.toMatchObject({
      deposit_params: {
        min_deposit: expect.any(Coins),
        max_deposit_period: expect.any(Number),
      },
      voting_params: {
        voting_period: expect.any(Number),
      },
      tally_params: {
        quorum: expect.any(String),
        threshold: expect.any(String),
        veto_threshold: expect.any(String),
      },
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
