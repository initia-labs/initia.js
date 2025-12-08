import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgRemoveEmergencySubmitters as MsgRemoveEmergencySubmitters_pb } from '@initia/initia.proto/initia/gov/v1/tx'

/**
 * MsgRemoveEmergencySubmitters defines an operation for removing emergency proposal submitters.
 */
export class MsgRemoveEmergencySubmitters extends JSONSerializable<
  MsgRemoveEmergencySubmitters.Amino,
  MsgRemoveEmergencySubmitters.Data,
  MsgRemoveEmergencySubmitters.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param emergency_submitters
   */
  constructor(
    public authority: AccAddress,
    public emergency_submitters: string[]
  ) {
    super()
  }

  public static fromAmino(
    data: MsgRemoveEmergencySubmitters.Amino
  ): MsgRemoveEmergencySubmitters {
    const {
      value: { authority, emergency_submitters },
    } = data
    return new MsgRemoveEmergencySubmitters(authority, emergency_submitters)
  }

  public toAmino(): MsgRemoveEmergencySubmitters.Amino {
    const { authority, emergency_submitters } = this
    return {
      type: 'gov/MsgRemoveEmergencySubmitters',
      value: {
        authority,
        emergency_submitters,
      },
    }
  }

  public static fromData(
    data: MsgRemoveEmergencySubmitters.Data
  ): MsgRemoveEmergencySubmitters {
    const { authority, emergency_submitters } = data
    return new MsgRemoveEmergencySubmitters(authority, emergency_submitters)
  }

  public toData(): MsgRemoveEmergencySubmitters.Data {
    const { authority, emergency_submitters } = this
    return {
      '@type': '/initia.gov.v1.MsgRemoveEmergencySubmitters',
      authority,
      emergency_submitters,
    }
  }

  public static fromProto(
    data: MsgRemoveEmergencySubmitters.Proto
  ): MsgRemoveEmergencySubmitters {
    return new MsgRemoveEmergencySubmitters(
      data.authority,
      data.emergencySubmitters
    )
  }

  public toProto(): MsgRemoveEmergencySubmitters.Proto {
    const { authority, emergency_submitters } = this
    return MsgRemoveEmergencySubmitters_pb.fromPartial({
      authority,
      emergencySubmitters: emergency_submitters,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.gov.v1.MsgRemoveEmergencySubmitters',
      value: MsgRemoveEmergencySubmitters_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgRemoveEmergencySubmitters {
    return MsgRemoveEmergencySubmitters.fromProto(
      MsgRemoveEmergencySubmitters_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgRemoveEmergencySubmitters {
  export interface Amino {
    type: 'gov/MsgRemoveEmergencySubmitters'
    value: {
      authority: AccAddress
      emergency_submitters: string[]
    }
  }

  export interface Data {
    '@type': '/initia.gov.v1.MsgRemoveEmergencySubmitters'
    authority: AccAddress
    emergency_submitters: string[]
  }

  export type Proto = MsgRemoveEmergencySubmitters_pb
}
