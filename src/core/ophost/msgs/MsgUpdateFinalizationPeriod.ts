import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Duration } from '../../Duration'
import { MsgUpdateFinalizationPeriod as MsgUpdateFinalizationPeriod_pb } from '@initia/opinit.proto/opinit/ophost/v1/tx'
import { Any } from '@initia/initia.proto/google/protobuf/any'

/**
 * MsgUpdateFinalizationPeriod is a message to update the finalization period.
 */
export class MsgUpdateFinalizationPeriod extends JSONSerializable<
  MsgUpdateFinalizationPeriod.Amino,
  MsgUpdateFinalizationPeriod.Data,
  MsgUpdateFinalizationPeriod.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param bridge_id
   * @param finalization_period the minimum time duration that must elapse before a withdrawal can be finalized
   */
  constructor(
    public authority: AccAddress,
    public bridge_id: number,
    public finalization_period: Duration
  ) {
    super()
  }

  public static fromAmino(
    data: MsgUpdateFinalizationPeriod.Amino
  ): MsgUpdateFinalizationPeriod {
    const {
      value: { authority, bridge_id, finalization_period },
    } = data

    return new MsgUpdateFinalizationPeriod(
      authority,
      parseInt(bridge_id),
      Duration.fromAmino(finalization_period)
    )
  }

  public toAmino(): MsgUpdateFinalizationPeriod.Amino {
    const { authority, bridge_id, finalization_period } = this
    return {
      type: 'ophost/MsgUpdateFinalizationPeriod',
      value: {
        authority,
        bridge_id: bridge_id.toFixed(),
        finalization_period: finalization_period.toAmino(),
      },
    }
  }

  public static fromData(
    data: MsgUpdateFinalizationPeriod.Data
  ): MsgUpdateFinalizationPeriod {
    const { authority, bridge_id, finalization_period } = data
    return new MsgUpdateFinalizationPeriod(
      authority,
      parseInt(bridge_id),
      Duration.fromData(finalization_period)
    )
  }

  public toData(): MsgUpdateFinalizationPeriod.Data {
    const { authority, bridge_id, finalization_period } = this
    return {
      '@type': '/opinit.ophost.v1.MsgUpdateFinalizationPeriod',
      authority,
      bridge_id: bridge_id.toFixed(),
      finalization_period: finalization_period.toData(),
    }
  }

  public static fromProto(
    data: MsgUpdateFinalizationPeriod.Proto
  ): MsgUpdateFinalizationPeriod {
    return new MsgUpdateFinalizationPeriod(
      data.authority,
      Number(data.bridgeId),
      Duration.fromProto(data.finalizationPeriod as Duration.Proto)
    )
  }

  public toProto(): MsgUpdateFinalizationPeriod.Proto {
    const { authority, bridge_id, finalization_period } = this
    return MsgUpdateFinalizationPeriod_pb.fromPartial({
      authority,
      bridgeId: BigInt(bridge_id),
      finalizationPeriod: finalization_period.toProto(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.ophost.v1.MsgUpdateFinalizationPeriod',
      value: MsgUpdateFinalizationPeriod_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgUpdateFinalizationPeriod {
    return MsgUpdateFinalizationPeriod.fromProto(
      MsgUpdateFinalizationPeriod_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgUpdateFinalizationPeriod {
  export interface Amino {
    type: 'ophost/MsgUpdateFinalizationPeriod'
    value: {
      authority: AccAddress
      bridge_id: string
      finalization_period: Duration.Amino
    }
  }

  export interface Data {
    '@type': '/opinit.ophost.v1.MsgUpdateFinalizationPeriod'
    authority: AccAddress
    bridge_id: string
    finalization_period: Duration.Data
  }

  export type Proto = MsgUpdateFinalizationPeriod_pb
}
