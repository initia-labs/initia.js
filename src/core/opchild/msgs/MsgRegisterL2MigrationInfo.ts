import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { L2MigrationInfo } from '../L2MigrationInfo'
import { MsgRegisterMigrationInfo as MsgRegisterMigrationInfo_pb } from '@initia/opinit.proto/opinit/opchild/v1/tx'
import { Any } from '@initia/initia.proto/google/protobuf/any'

/**
 * MsgRegisterL2MigrationInfo is a message to register the migration information.
 */
export class MsgRegisterL2MigrationInfo extends JSONSerializable<
  MsgRegisterL2MigrationInfo.Amino,
  MsgRegisterL2MigrationInfo.Data,
  MsgRegisterL2MigrationInfo.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param migration_info
   */
  constructor(
    public authority: AccAddress,
    public migration_info: L2MigrationInfo
  ) {
    super()
  }

  public static fromAmino(
    data: MsgRegisterL2MigrationInfo.Amino
  ): MsgRegisterL2MigrationInfo {
    const {
      value: { authority, migration_info },
    } = data

    return new MsgRegisterL2MigrationInfo(
      authority,
      L2MigrationInfo.fromAmino(migration_info)
    )
  }

  public toAmino(): MsgRegisterL2MigrationInfo.Amino {
    const { authority, migration_info } = this
    return {
      type: 'opchild/MsgRegisterMigrationInfo',
      value: {
        authority,
        migration_info: migration_info.toAmino(),
      },
    }
  }

  public static fromData(
    data: MsgRegisterL2MigrationInfo.Data
  ): MsgRegisterL2MigrationInfo {
    const { authority, migration_info } = data
    return new MsgRegisterL2MigrationInfo(
      authority,
      L2MigrationInfo.fromData(migration_info)
    )
  }

  public toData(): MsgRegisterL2MigrationInfo.Data {
    const { authority, migration_info } = this
    return {
      '@type': '/opinit.opchild.v1.MsgRegisterMigrationInfo',
      authority,
      migration_info: migration_info.toData(),
    }
  }

  public static fromProto(
    data: MsgRegisterL2MigrationInfo.Proto
  ): MsgRegisterL2MigrationInfo {
    return new MsgRegisterL2MigrationInfo(
      data.authority,
      L2MigrationInfo.fromProto(data.migrationInfo as L2MigrationInfo.Proto)
    )
  }

  public toProto(): MsgRegisterL2MigrationInfo.Proto {
    const { authority, migration_info } = this
    return MsgRegisterMigrationInfo_pb.fromPartial({
      authority,
      migrationInfo: migration_info.toProto(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.opchild.v1.MsgRegisterMigrationInfo',
      value: MsgRegisterMigrationInfo_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgRegisterL2MigrationInfo {
    return MsgRegisterL2MigrationInfo.fromProto(
      MsgRegisterMigrationInfo_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgRegisterL2MigrationInfo {
  export interface Amino {
    type: 'opchild/MsgRegisterMigrationInfo'
    value: {
      authority: AccAddress
      migration_info: L2MigrationInfo.Amino
    }
  }

  export interface Data {
    '@type': '/opinit.opchild.v1.MsgRegisterMigrationInfo'
    authority: AccAddress
    migration_info: L2MigrationInfo.Data
  }

  export type Proto = MsgRegisterMigrationInfo_pb
}
