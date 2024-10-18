import { RESTClient } from './RESTClient'
import { Key } from '../../key'
import { CreateTxOptions } from './api/TxAPI'
import { Tx } from '../../core'
import { SignMode } from '@initia/initia.proto/cosmos/tx/signing/v1beta1/signing'

export class Wallet {
  private accAddress: string
  constructor(
    public rest: RESTClient,
    public key: Key
  ) {
    this.accAddress = key.accAddress
  }

  public setAccountAddress(accAddress: string) {
    this.accAddress = accAddress
  }

  public async accountNumberAndSequence(): Promise<{
    account_number: number
    sequence: number
  }> {
    return this.rest.auth.accountInfo(this.accAddress).then((d) => {
      return {
        account_number: d.getAccountNumber(),
        sequence: d.getSequenceNumber(),
      }
    })
  }

  public async accountNumber(): Promise<number> {
    return this.rest.auth.accountInfo(this.accAddress).then((d) => {
      return d.getAccountNumber()
    })
  }

  public async sequence(): Promise<number> {
    return this.rest.auth.accountInfo(this.accAddress).then((d) => {
      return d.getSequenceNumber()
    })
  }

  public async createTx(
    options: CreateTxOptions & {
      sequence?: number
    }
  ): Promise<Tx> {
    return this.rest.tx.create(
      [
        {
          address: this.accAddress,
          sequenceNumber: options.sequence,
          publicKey: this.key.publicKey,
        },
      ],
      options
    )
  }

  public async createAndSignTx(
    options: CreateTxOptions & {
      sequence?: number
      accountNumber?: number
      signMode?: SignMode
    }
  ): Promise<Tx> {
    if (!this.rest.config.chainId) {
      this.rest.config.chainId = await this.rest.tendermint.chainId()
    }

    let accountNumber = options.accountNumber
    let sequence = options.sequence

    if (accountNumber === undefined || sequence === undefined) {
      const res = await this.accountNumberAndSequence()
      if (accountNumber === undefined) {
        accountNumber = res.account_number
      }

      if (sequence === undefined) {
        sequence = res.sequence
      }
    }

    options.sequence = sequence
    options.accountNumber = accountNumber

    const tx = await this.createTx(options)
    return this.key.signTx(tx, {
      accountNumber,
      sequence,
      chainId: this.rest.config.chainId,
      signMode: options.signMode ?? SignMode.SIGN_MODE_DIRECT,
    })
  }
}
