import { APIRequester } from '../APIRequester';
import { SlashingAPI } from './SlashingAPI';

const c = new APIRequester('https://stone-rest.initia.tech/');
const slashing = new SlashingAPI(c);

describe('SlashingAPI', () => {
  it('parameters', async () => {
    await expect(slashing.parameters()).resolves.toMatchObject({
      signed_blocks_window: expect.any(Number),
      min_signed_per_window: expect.any(String),
      downtime_jail_duration: expect.any(Number),
      slash_fraction_double_sign: expect.any(String),
      slash_fraction_downtime: expect.any(String),
    });
  });
});
