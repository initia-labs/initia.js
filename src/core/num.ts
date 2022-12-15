import { BigNumber } from 'bignumber.js';

export function num(number: number | string): BigNumber {
  return new BigNumber(number);
}

export function checkDecimal(amount: number | string): boolean {
  return typeof amount === 'string'
    ? amount.includes('.')
    : !num(amount).isInteger();
}

export * from 'bignumber.js';
