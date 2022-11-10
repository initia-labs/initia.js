import { APIRequester } from '../APIRequester';
import { BankAPI } from './BankAPI';

const c = new APIRequester('https://stone-rest.initia.tech/');
const bank = new BankAPI(c);

describe('BankAPI', () => {
  describe('balance', () => {
    it('account exists', async () => {
      await bank.balance('init1wlvk4e083pd3nddlfe5quy56e68atra3gu9xfs');
    });

    it('invalid account', async () => {
      await expect(bank.balance('1234')).rejects.toThrow();
    });
  });

  it('total supply', async () => {
    const totalSupply = await bank.total();
    expect(totalSupply[0].toArray().length).toBeGreaterThan(0);
  });

  describe('parameters', () => {
    it('parameters', async () => {
      const param = await bank.parameters();

      expect(param.default_send_enabled).toBeDefined();
    });
  });
});
