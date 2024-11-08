import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgUpdateGroupPolicyMetadata as MsgUpdateGroupPolicyMetadata_pb } from '@initia/initia.proto/cosmos/group/v1/tx'

/**
 * MsgUpdateGroupPolicyMetadata updates a group policy metadata.
 */
export class MsgUpdateGroupPolicyMetadata extends JSONSerializable<
  MsgUpdateGroupPolicyMetadata.Amino,
  MsgUpdateGroupPolicyMetadata.Data,
  MsgUpdateGroupPolicyMetadata.Proto
> {
  /**
   * @param admin the account address of the group admin
   * @param group_policy_address the account address of group policy
   * @param metadata the group policy metadata to be updated
   */
  constructor(
    public admin: AccAddress,
    public group_policy_address: AccAddress,
    public metadata: string
  ) {
    super()
  }

  public static fromAmino(
    data: MsgUpdateGroupPolicyMetadata.Amino
  ): MsgUpdateGroupPolicyMetadata {
    const {
      value: { admin, group_policy_address, metadata },
    } = data
    return new MsgUpdateGroupPolicyMetadata(
      admin,
      group_policy_address,
      metadata
    )
  }

  public toAmino(): MsgUpdateGroupPolicyMetadata.Amino {
    const { admin, group_policy_address, metadata } = this
    return {
      type: 'cosmos-sdk/MsgUpdateGroupPolicyMetadata',
      value: {
        admin,
        group_policy_address,
        metadata,
      },
    }
  }

  public static fromData(
    data: MsgUpdateGroupPolicyMetadata.Data
  ): MsgUpdateGroupPolicyMetadata {
    const { admin, group_policy_address, metadata } = data
    return new MsgUpdateGroupPolicyMetadata(
      admin,
      group_policy_address,
      metadata
    )
  }

  public toData(): MsgUpdateGroupPolicyMetadata.Data {
    const { admin, group_policy_address, metadata } = this
    return {
      '@type': '/cosmos.group.v1.MsgUpdateGroupPolicyMetadata',
      admin,
      group_policy_address,
      metadata,
    }
  }

  public static fromProto(
    data: MsgUpdateGroupPolicyMetadata.Proto
  ): MsgUpdateGroupPolicyMetadata {
    return new MsgUpdateGroupPolicyMetadata(
      data.admin,
      data.groupPolicyAddress,
      data.metadata
    )
  }

  public toProto(): MsgUpdateGroupPolicyMetadata.Proto {
    const { admin, group_policy_address, metadata } = this
    return MsgUpdateGroupPolicyMetadata_pb.fromPartial({
      admin,
      groupPolicyAddress: group_policy_address,
      metadata,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.group.v1.MsgUpdateGroupPolicyMetadata',
      value: MsgUpdateGroupPolicyMetadata_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgUpdateGroupPolicyMetadata {
    return MsgUpdateGroupPolicyMetadata.fromProto(
      MsgUpdateGroupPolicyMetadata_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgUpdateGroupPolicyMetadata {
  export interface Amino {
    type: 'cosmos-sdk/MsgUpdateGroupPolicyMetadata'
    value: {
      admin: AccAddress
      group_policy_address: AccAddress
      metadata: string
    }
  }

  export interface Data {
    '@type': '/cosmos.group.v1.MsgUpdateGroupPolicyMetadata'
    admin: AccAddress
    group_policy_address: AccAddress
    metadata: string
  }

  export type Proto = MsgUpdateGroupPolicyMetadata_pb
}
