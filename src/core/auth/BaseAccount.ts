import { PublicKey } from '../PublicKey'
import { JSONSerializable } from '../../util/json'
import { AccAddress } from '../bech32'
import { BaseAccount as BaseAccount_pb } from '@initia/initia.proto/cosmos/auth/v1beta1/auth'
import { Any } from '@initia/initia.proto/google/protobuf/any'

/**
 * Stores information about an account fetched from the blockchain.
 */
export class BaseAccount extends JSONSerializable<
  BaseAccount.Amino,
  BaseAccount.Data,
  BaseAccount.Proto
> {
  /**
   * @param address account address
   * @param coins account's balance
   * @param public_key account's public key information
   * @param account_number account number on the blockchain
   * @param sequence sequence number, or number of transactions that have been posted
   */
  constructor(
    public address: AccAddress,
    public public_key: PublicKey | undefined,
    public account_number: number,
    public sequence: number
  ) {
    super()
  }

  public getAccountNumber(): number {
    return this.account_number
  }

  public getSequenceNumber(): number {
    return this.sequence
  }

  public getPublicKey(): PublicKey | undefined {
    return this.public_key
  }

  public static fromAmino(data: BaseAccount.Amino): BaseAccount {
    const {
      value: { address, public_key, account_number, sequence },
    } = data

    return new BaseAccount(
      address ?? '',
      public_key ? PublicKey.fromAmino(public_key) : undefined,
      parseInt(account_number) ?? 0,
      parseInt(sequence) ?? 0
    )
  }

  public toAmino(): BaseAccount.Amino {
    const { address, public_key, account_number, sequence } = this
    return {
      type: 'cosmos-sdk/BaseAccount',
      value: {
        address,
        public_key: public_key?.toAmino(),
        account_number: account_number.toFixed(),
        sequence: sequence.toFixed(),
      },
    }
  }

  public static fromData(data: BaseAccount.Data): BaseAccount {
    const { address, pub_key, account_number, sequence } = data

    return new BaseAccount(
      address ?? '',
      pub_key ? PublicKey.fromData(pub_key) : undefined,
      parseInt(account_number) ?? 0,
      parseInt(sequence) ?? 0
    )
  }

  public toData(): BaseAccount.Data {
    const { address, public_key, account_number, sequence } = this
    return {
      '@type': '/cosmos.auth.v1beta1.BaseAccount',
      address,
      pub_key: public_key?.toData(),
      account_number: account_number.toFixed(),
      sequence: sequence.toFixed(),
    }
  }

  public static fromProto(baseAccountProto: BaseAccount.Proto): BaseAccount {
    const pubkey = baseAccountProto.pubKey
    return new BaseAccount(
      baseAccountProto.address,
      pubkey ? PublicKey.fromProto(pubkey) : undefined,
      Number(baseAccountProto.accountNumber),
      Number(baseAccountProto.sequence)
    )
  }

  public toProto(): BaseAccount.Proto {
    const { address, public_key, account_number, sequence } = this
    return BaseAccount_pb.fromPartial({
      address,
      pubKey: public_key?.packAny(),
      accountNumber: BigInt(account_number),
      sequence: BigInt(sequence),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.auth.v1beta1.BaseAccount',
      value: BaseAccount_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(pubkeyAny: Any): BaseAccount {
    return BaseAccount.fromProto(BaseAccount_pb.decode(pubkeyAny.value))
  }
}

export namespace BaseAccount {
  export interface AminoValue {
    address: AccAddress
    public_key?: PublicKey.Amino
    account_number: string
    sequence: string
  }

  export interface Amino {
    type: 'cosmos-sdk/BaseAccount'
    value: AminoValue
  }

  export interface DataValue {
    address: AccAddress
    pub_key?: PublicKey.Data
    account_number: string
    sequence: string
  }

  export interface Data extends DataValue {
    '@type': '/cosmos.auth.v1beta1.BaseAccount'
  }

  export type Proto = BaseAccount_pb
}
