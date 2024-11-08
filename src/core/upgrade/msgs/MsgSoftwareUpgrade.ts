import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Plan } from '../Plan'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgSoftwareUpgrade as MsgSoftwareUpgrade_pb } from '@initia/initia.proto/cosmos/upgrade/v1beta1/tx'

/**
 * MsgSoftwareUpgrade is a governance operation for initiating a software upgrade
 */
export class MsgSoftwareUpgrade extends JSONSerializable<
  MsgSoftwareUpgrade.Amino,
  MsgSoftwareUpgrade.Data,
  MsgSoftwareUpgrade.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param plan the upgrade plan
   */
  constructor(
    public authority: AccAddress,
    public plan: Plan
  ) {
    super()
  }

  public static fromAmino(data: MsgSoftwareUpgrade.Amino): MsgSoftwareUpgrade {
    const {
      value: { authority, plan },
    } = data

    return new MsgSoftwareUpgrade(authority, Plan.fromAmino(plan))
  }

  public toAmino(): MsgSoftwareUpgrade.Amino {
    const { authority, plan } = this
    return {
      type: 'cosmos-sdk/MsgSoftwareUpgrade',
      value: {
        authority,
        plan: plan.toAmino(),
      },
    }
  }

  public static fromData(data: MsgSoftwareUpgrade.Data): MsgSoftwareUpgrade {
    const { authority, plan } = data
    return new MsgSoftwareUpgrade(authority, Plan.fromData(plan))
  }

  public toData(): MsgSoftwareUpgrade.Data {
    const { authority, plan } = this
    return {
      '@type': '/cosmos.upgrade.v1beta1.MsgSoftwareUpgrade',
      authority,
      plan: plan.toData(),
    }
  }

  public static fromProto(proto: MsgSoftwareUpgrade.Proto): MsgSoftwareUpgrade {
    return new MsgSoftwareUpgrade(
      proto.authority,
      Plan.fromProto(proto.plan as Plan.Proto)
    )
  }

  public toProto(): MsgSoftwareUpgrade.Proto {
    const { authority, plan } = this
    return MsgSoftwareUpgrade_pb.fromPartial({
      authority,
      plan: plan.toProto(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.upgrade.v1beta1.MsgSoftwareUpgrade',
      value: MsgSoftwareUpgrade_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgSoftwareUpgrade {
    return MsgSoftwareUpgrade.fromProto(
      MsgSoftwareUpgrade_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgSoftwareUpgrade {
  export interface Amino {
    type: 'cosmos-sdk/MsgSoftwareUpgrade'
    value: {
      authority: AccAddress
      plan: Plan.Amino
    }
  }

  export interface Data {
    '@type': '/cosmos.upgrade.v1beta1.MsgSoftwareUpgrade'
    authority: AccAddress
    plan: Plan.Data
  }

  export type Proto = MsgSoftwareUpgrade_pb
}
