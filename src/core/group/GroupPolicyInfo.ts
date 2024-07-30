import { JSONSerializable } from '../../util/json'
import { AccAddress } from '../bech32'
import { DecisionPolicy } from './policies'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { GroupPolicyInfo as GroupPolicyInfo_pb } from '@initia/initia.proto/cosmos/group/v1/types'
import Long from 'long'

export class GroupPolicyInfo extends JSONSerializable<
  GroupPolicyInfo.Amino,
  GroupPolicyInfo.Data,
  GroupPolicyInfo.Proto
> {
  /**
   * @param address the account address of group policy
   * @param group_id the unique ID of the group
   * @param admin the account address of the group admin
   * @param metadata any arbitrary metadata attached to the group
   * @param version used to track changes to a group's membership structure that would break existing proposals
   * @param decision_policy the group policy's decision policy
   * @param created_at timestamp specifying when a group policy was created
   */
  constructor(
    public address: AccAddress,
    public group_id: number,
    public admin: AccAddress,
    public metadata: string,
    public version: number,
    public decision_policy: DecisionPolicy,
    public created_at: Date
  ) {
    super()
  }

  public static fromAmino(data: GroupPolicyInfo.Amino): GroupPolicyInfo {
    const {
      address,
      group_id,
      admin,
      metadata,
      version,
      decision_policy,
      created_at,
    } = data

    return new GroupPolicyInfo(
      address,
      Number.parseInt(group_id),
      admin,
      metadata,
      Number.parseInt(version),
      DecisionPolicy.fromAmino(decision_policy),
      new Date(created_at)
    )
  }

  public toAmino(): GroupPolicyInfo.Amino {
    const {
      address,
      group_id,
      admin,
      metadata,
      version,
      decision_policy,
      created_at,
    } = this

    return {
      address,
      group_id: group_id.toString(),
      admin,
      metadata,
      version: version.toString(),
      decision_policy: decision_policy.toAmino(),
      created_at: created_at.toISOString(),
    }
  }

  public static fromData(data: GroupPolicyInfo.Data): GroupPolicyInfo {
    const {
      address,
      group_id,
      admin,
      metadata,
      version,
      decision_policy,
      created_at,
    } = data

    return new GroupPolicyInfo(
      address,
      Number.parseInt(group_id),
      admin,
      metadata,
      Number.parseInt(version),
      DecisionPolicy.fromData(decision_policy),
      new Date(created_at)
    )
  }

  public toData(): GroupPolicyInfo.Data {
    const {
      address,
      group_id,
      admin,
      metadata,
      version,
      decision_policy,
      created_at,
    } = this

    return {
      address,
      group_id: group_id.toString(),
      admin,
      metadata,
      version: version.toString(),
      decision_policy: decision_policy.toData(),
      created_at: created_at.toISOString(),
    }
  }

  public static fromProto(data: GroupPolicyInfo.Proto): GroupPolicyInfo {
    return new GroupPolicyInfo(
      data.address,
      data.groupId.toNumber(),
      data.admin,
      data.metadata,
      data.version.toNumber(),
      DecisionPolicy.fromProto(data.decisionPolicy as Any),
      data.createdAt as Date
    )
  }

  public toProto(): GroupPolicyInfo.Proto {
    const {
      address,
      group_id,
      admin,
      metadata,
      version,
      decision_policy,
      created_at,
    } = this

    return GroupPolicyInfo_pb.fromPartial({
      address,
      groupId: Long.fromNumber(group_id),
      admin,
      metadata,
      version: Long.fromNumber(version),
      decisionPolicy: decision_policy.packAny(),
      createdAt: created_at,
    })
  }
}

export namespace GroupPolicyInfo {
  export interface Amino {
    address: AccAddress
    group_id: string
    admin: AccAddress
    metadata: string
    version: string
    decision_policy: DecisionPolicy.Amino
    created_at: string
  }

  export interface Data {
    address: AccAddress
    group_id: string
    admin: AccAddress
    metadata: string
    version: string
    decision_policy: DecisionPolicy.Data
    created_at: string
  }

  export type Proto = GroupPolicyInfo_pb
}
