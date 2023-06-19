import { LCDClient } from './LCDClient';
import { Key } from '../../key';
import { CreateTxOptions } from '../lcd/api/TxAPI';
import { Tx } from '../../core';
import { SignMode } from '@initia/initia.proto/cosmos/tx/signing/v1beta1/signing';

export class Wallet {
  constructor(public lcd: LCDClient, public key: Key) {}

  public async accountNumberAndSequence(): Promise<{
    account_number: number;
    sequence: number;
  }> {
    return this.lcd.auth.accountInfo(this.key.accAddress).then(d => {
      return {
        account_number: d.getAccountNumber(),
        sequence: d.getSequenceNumber(),
      };
    });
  }

  public async accountNumber(): Promise<number> {
    return this.lcd.auth.accountInfo(this.key.accAddress).then(d => {
      return d.getAccountNumber();
    });
  }

  public async sequence(): Promise<number> {
    return this.lcd.auth.accountInfo(this.key.accAddress).then(d => {
      return d.getSequenceNumber();
    });
  }

  public async createTx(
    options: CreateTxOptions & {
      sequence?: number;
    }
  ): Promise<Tx> {
    return this.lcd.tx.create(
      [
        {
          address: this.key.accAddress,
          sequenceNumber: options.sequence,
          publicKey: this.key.publicKey,
        },
      ],
      options
    );
  }

  public async createAndSignTx(
    options: CreateTxOptions & {
      sequence?: number;
      accountNumber?: number;
      signMode?: SignMode;
    }
  ): Promise<Tx> {
    if (!this.lcd.config.chainId) {
      this.lcd.config.chainId = await this.lcd.tendermint.chainId();
    }

    let accountNumber = options.accountNumber;
    let sequence = options.sequence;

    if (accountNumber === undefined || sequence === undefined) {
      const res = await this.accountNumberAndSequence();
      if (accountNumber === undefined) {
        accountNumber = res.account_number;
      }

      if (sequence === undefined) {
        sequence = res.sequence;
      }
    }

    options.sequence = sequence;
    options.accountNumber = accountNumber;

    const tx = await this.createTx(options);
    return this.key.signTx(tx, {
      accountNumber,
      sequence,
      chainId: this.lcd.config.chainId,
      signMode: options.signMode ?? SignMode.SIGN_MODE_DIRECT,
    });
  }
}
