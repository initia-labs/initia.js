import { JSONSerializable } from '../../util/json';
import { PublicKey } from '../PublicKey';
import { BaseAccount } from './BaseAccount';
import { ModuleAccount as ModuleAccount_pb } from '@initia/initia.proto/cosmos/auth/v1beta1/auth';
import { Any } from '@initia/initia.proto/google/protobuf/any';

/**
 * Stores information about an account for modules that holds coins on a pool.
 */
export class ModuleAccount extends JSONSerializable<
  ModuleAccount.Amino,
  ModuleAccount.Data,
  ModuleAccount.Proto
> {
  /**
   *
   * @param base_account account information
   * @param name account's name
   * @param permissions account's permissions
   */
  constructor(
    public base_account: BaseAccount,
    public name: string,
    public permissions: string[]
  ) {
    super();
  }

  public getAccountNumber(): number {
    return this.base_account.account_number;
  }

  public getSequenceNumber(): number {
    return this.base_account.sequence;
  }

  public getPublicKey(): PublicKey | null {
    return this.base_account.public_key;
  }

  public static fromAmino(data: ModuleAccount.Amino): ModuleAccount {
    const {
      value: { base_account, name, permissions },
    } = data;

    return new ModuleAccount(
      BaseAccount.fromAmino({
        type: 'cosmos-sdk/BaseAccount',
        value: base_account,
      }),
      name,
      permissions
    );
  }

  public toAmino(): ModuleAccount.Amino {
    const { base_account, name, permissions } = this;
    return {
      type: 'cosmos-sdk/ModuleAccount',
      value: {
        base_account: base_account.toAmino().value,
        name,
        permissions,
      },
    };
  }

  public static fromData(data: ModuleAccount.Data): ModuleAccount {
    const { base_account, name, permissions } = data;

    return new ModuleAccount(
      BaseAccount.fromData({
        '@type': '/cosmos.auth.v1beta1.BaseAccount',
        ...base_account,
      }),
      name,
      permissions
    );
  }

  public toData(): ModuleAccount.Data {
    const { base_account, name, permissions } = this;
    return {
      '@type': '/cosmos.auth.v1beta1.ModuleAccount',
      base_account: base_account.toData(),
      name,
      permissions,
    };
  }

  public static fromProto(proto: ModuleAccount.Proto): ModuleAccount {
    return new ModuleAccount(
      BaseAccount.fromProto(proto.baseAccount as BaseAccount.Proto),
      proto.name,
      proto.permissions
    );
  }

  public toProto(): ModuleAccount.Proto {
    const { base_account, name, permissions } = this;
    return ModuleAccount_pb.fromPartial({
      baseAccount: base_account.toProto(),
      name,
      permissions,
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.auth.v1beta1.ModuleAccount',
      value: ModuleAccount_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(pubkeyAny: Any): ModuleAccount {
    return ModuleAccount.fromProto(ModuleAccount_pb.decode(pubkeyAny.value));
  }
}

export namespace ModuleAccount {
  export interface Amino {
    type: 'cosmos-sdk/ModuleAccount';
    value: {
      base_account: BaseAccount.AminoValue;
      name: string;
      permissions: string[];
    };
  }

  export interface Data {
    '@type': '/cosmos.auth.v1beta1.ModuleAccount';
    base_account: BaseAccount.DataValue;
    name: string;
    permissions: string[];
  }

  export type Proto = ModuleAccount_pb;
}
