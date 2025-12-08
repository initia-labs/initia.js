import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { L1MigrationInfo } from '../L1MigrationInfo'
import { MsgRegisterMigrationInfo as MsgRegisterMigrationInfo_pb } from '@initia/opinit.proto/opinit/ophost/v1/tx'
import { Any } from '@initia/initia.proto/google/protobuf/any'

/**
 * MsgRegisterL1MigrationInfo is a message to register the migration info.
 */
export class MsgRegisterL1MigrationInfo extends JSONSerializable<
  MsgRegisterL1MigrationInfo.Amino,
  MsgRegisterL1MigrationInfo.Data,
  MsgRegisterL1MigrationInfo.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param migration_info
   */
  constructor(
    public authority: AccAddress,
    public migration_info: L1MigrationInfo
  ) {
    super()
  }

  public static fromAmino(
    data: MsgRegisterL1MigrationInfo.Amino
  ): MsgRegisterL1MigrationInfo {
    const {
      value: { authority, migration_info },
    } = data

    return new MsgRegisterL1MigrationInfo(
      authority,
      L1MigrationInfo.fromAmino(migration_info)
    )
  }

  public toAmino(): MsgRegisterL1MigrationInfo.Amino {
    const { authority, migration_info } = this
    return {
      type: 'ophost/MsgRegisterMigrationInfo',
      value: {
        authority,
        migration_info: migration_info.toAmino(),
      },
    }
  }

  public static fromData(
    data: MsgRegisterL1MigrationInfo.Data
  ): MsgRegisterL1MigrationInfo {
    const { authority, migration_info } = data
    return new MsgRegisterL1MigrationInfo(
      authority,
      L1MigrationInfo.fromData(migration_info)
    )
  }

  public toData(): MsgRegisterL1MigrationInfo.Data {
    const { authority, migration_info } = this
    return {
      '@type': '/opinit.ophost.v1.MsgRegisterMigrationInfo',
      authority,
      migration_info: migration_info.toAmino(),
    }
  }

  public static fromProto(
    data: MsgRegisterL1MigrationInfo.Proto
  ): MsgRegisterL1MigrationInfo {
    return new MsgRegisterL1MigrationInfo(
      data.authority,
      L1MigrationInfo.fromProto(data.migrationInfo as L1MigrationInfo.Proto)
    )
  }

  public toProto(): MsgRegisterL1MigrationInfo.Proto {
    const { authority, migration_info } = this
    return MsgRegisterMigrationInfo_pb.fromPartial({
      authority,
      migrationInfo: migration_info.toProto(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.ophost.v1.MsgRegisterMigrationInfo',
      value: MsgRegisterMigrationInfo_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgRegisterL1MigrationInfo {
    return MsgRegisterL1MigrationInfo.fromProto(
      MsgRegisterMigrationInfo_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgRegisterL1MigrationInfo {
  export interface Amino {
    type: 'ophost/MsgRegisterMigrationInfo'
    value: {
      authority: AccAddress
      migration_info: L1MigrationInfo.Amino
    }
  }

  export interface Data {
    '@type': '/opinit.ophost.v1.MsgRegisterMigrationInfo'
    authority: AccAddress
    migration_info: L1MigrationInfo.Data
  }

  export type Proto = MsgRegisterMigrationInfo_pb
}
