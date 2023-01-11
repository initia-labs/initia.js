import { APIRequester } from '../APIRequester';
import { MintAPI } from './MintAPI';

const c = new APIRequester('https://stone-rest.initia.tech/');
const api = new MintAPI(c);

describe('MintAPI', () => {
  it('inflation', async () => {
    await expect(api.inflation()).resolves.toEqual(expect.any(String));
  });

  it('annual provisions', async () => {
    await expect(api.annualProvisions()).resolves.toEqual(expect.any(String));
  });

  it('parameters', async () => {
    await expect(api.parameters()).resolves.toMatchObject({
      mint_denom: expect.any(String),
      inflation_rate: expect.any(String),
    });
  });
});
