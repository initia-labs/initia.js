import { JSONSerializable } from '../../util/json'
import { AccAddress } from '../bech32'
import { GroupInfo as GroupInfo_pb } from '@initia/initia.proto/cosmos/group/v1/types'

/**
 * GroupInfo represents the high-level on-chain information for a group.
 */
export class GroupInfo extends JSONSerializable<
  GroupInfo.Amino,
  GroupInfo.Data,
  GroupInfo.Proto
> {
  /**
   * @param id the unique ID of the group
   * @param admin the account address of the group's admin
   * @param metadata any arbitrary metadata attached to the group
   * @param version used to track changes to a group's membership structure that would break existing proposals
   * @param total_weight the sum of the group members' weights
   * @param created_at timestamp specifying when a group was created
   */
  constructor(
    public id: number,
    public admin: AccAddress,
    public metadata: string,
    public version: number,
    public total_weight: string,
    public created_at: Date
  ) {
    super()
  }

  public static fromAmino(data: GroupInfo.Amino): GroupInfo {
    const { id, admin, metadata, version, total_weight, created_at } = data
    return new GroupInfo(
      parseInt(id),
      admin,
      metadata,
      parseInt(version),
      total_weight,
      new Date(created_at)
    )
  }

  public toAmino(): GroupInfo.Amino {
    const { id, admin, metadata, version, total_weight, created_at } = this
    return {
      id: id.toFixed(),
      admin,
      metadata,
      version: version.toFixed(),
      total_weight,
      created_at: created_at.toISOString(),
    }
  }

  public static fromData(data: GroupInfo.Data): GroupInfo {
    const { id, admin, metadata, version, total_weight, created_at } = data
    return new GroupInfo(
      parseInt(id),
      admin,
      metadata,
      parseInt(version),
      total_weight,
      new Date(created_at)
    )
  }

  public toData(): GroupInfo.Data {
    const { id, admin, metadata, version, total_weight, created_at } = this
    return {
      id: id.toFixed(),
      admin,
      metadata,
      version: version.toFixed(),
      total_weight,
      created_at: created_at.toISOString(),
    }
  }

  public static fromProto(data: GroupInfo.Proto): GroupInfo {
    return new GroupInfo(
      Number(data.id),
      data.admin,
      data.metadata,
      Number(data.version),
      data.totalWeight,
      data.createdAt as Date
    )
  }

  public toProto(): GroupInfo.Proto {
    const { id, admin, metadata, version, total_weight, created_at } = this
    return GroupInfo_pb.fromPartial({
      id: BigInt(id),
      admin,
      metadata,
      version: BigInt(version),
      totalWeight: total_weight,
      createdAt: created_at,
    })
  }
}

export namespace GroupInfo {
  export interface Amino {
    id: string
    admin: AccAddress
    metadata: string
    version: string
    total_weight: string
    created_at: string
  }

  export interface Data {
    id: string
    admin: AccAddress
    metadata: string
    version: string
    total_weight: string
    created_at: string
  }

  export type Proto = GroupInfo_pb
}
