import { JSONSerializable } from '../../../../../util/json'
import { AccAddress } from '../../../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgIBCSoftwareUpgrade as MsgIBCSoftwareUpgrade_pb } from '@initia/initia.proto/ibc/core/client/v1/tx'
import { Plan } from '../../../../upgrade'

/**
 * MsgIBCSoftwareUpgrade defines the message used to schedule an upgrade of an IBC client using a v1 governance proposal.
 */
export class MsgIBCSoftwareUpgrade extends JSONSerializable<
  any,
  MsgIBCSoftwareUpgrade.Data,
  MsgIBCSoftwareUpgrade.Proto
> {
  /**
   * @param plan
   * @param upgraded_client_state
   * @param signer signer address
   */
  constructor(
    public plan: Plan,
    public upgraded_client_state: any,
    public signer: string
  ) {
    super()
  }

  public static fromAmino(_: any): MsgIBCSoftwareUpgrade {
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(
    data: MsgIBCSoftwareUpgrade.Data
  ): MsgIBCSoftwareUpgrade {
    const { plan, upgraded_client_state, signer } = data
    return new MsgIBCSoftwareUpgrade(
      Plan.fromData(plan),
      upgraded_client_state,
      signer
    )
  }

  public toData(): MsgIBCSoftwareUpgrade.Data {
    const { plan, upgraded_client_state, signer } = this
    return {
      '@type': '/ibc.core.client.v1.MsgIBCSoftwareUpgrade',
      plan: plan.toData(),
      upgraded_client_state,
      signer,
    }
  }

  public static fromProto(
    proto: MsgIBCSoftwareUpgrade.Proto
  ): MsgIBCSoftwareUpgrade {
    return new MsgIBCSoftwareUpgrade(
      Plan.fromProto(proto.plan as Plan.Proto),
      proto.upgradedClientState,
      proto.signer
    )
  }

  public toProto(): MsgIBCSoftwareUpgrade.Proto {
    const { plan, upgraded_client_state, signer } = this
    return MsgIBCSoftwareUpgrade_pb.fromPartial({
      plan: plan.toProto(),
      upgradedClientState: upgraded_client_state,
      signer,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.core.client.v1.MsgIBCSoftwareUpgrade',
      value: MsgIBCSoftwareUpgrade_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgIBCSoftwareUpgrade {
    return MsgIBCSoftwareUpgrade.fromProto(
      MsgIBCSoftwareUpgrade_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgIBCSoftwareUpgrade {
  export interface Data {
    '@type': '/ibc.core.client.v1.MsgIBCSoftwareUpgrade'
    plan: Plan.Data
    upgraded_client_state: any
    signer: AccAddress
  }

  export type Proto = MsgIBCSoftwareUpgrade_pb
}
