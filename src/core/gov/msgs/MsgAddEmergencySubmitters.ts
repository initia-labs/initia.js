import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgAddEmergencySubmitters as MsgAddEmergencySubmitters_pb } from '@initia/initia.proto/initia/gov/v1/tx'

/**
 * MsgAddEmergencySubmitters defines an operation for adding emergency proposal submitters.
 */
export class MsgAddEmergencySubmitters extends JSONSerializable<
  MsgAddEmergencySubmitters.Amino,
  MsgAddEmergencySubmitters.Data,
  MsgAddEmergencySubmitters.Proto
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
    data: MsgAddEmergencySubmitters.Amino
  ): MsgAddEmergencySubmitters {
    const {
      value: { authority, emergency_submitters },
    } = data
    return new MsgAddEmergencySubmitters(authority, emergency_submitters)
  }

  public toAmino(): MsgAddEmergencySubmitters.Amino {
    const { authority, emergency_submitters } = this
    return {
      type: 'gov/MsgAddEmergencySubmitters',
      value: {
        authority,
        emergency_submitters,
      },
    }
  }

  public static fromData(
    data: MsgAddEmergencySubmitters.Data
  ): MsgAddEmergencySubmitters {
    const { authority, emergency_submitters } = data
    return new MsgAddEmergencySubmitters(authority, emergency_submitters)
  }

  public toData(): MsgAddEmergencySubmitters.Data {
    const { authority, emergency_submitters } = this
    return {
      '@type': '/initia.gov.v1.MsgAddEmergencySubmitters',
      authority,
      emergency_submitters,
    }
  }

  public static fromProto(
    data: MsgAddEmergencySubmitters.Proto
  ): MsgAddEmergencySubmitters {
    return new MsgAddEmergencySubmitters(
      data.authority,
      data.emergencySubmitters
    )
  }

  public toProto(): MsgAddEmergencySubmitters.Proto {
    const { authority, emergency_submitters } = this
    return MsgAddEmergencySubmitters_pb.fromPartial({
      authority,
      emergencySubmitters: emergency_submitters,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.gov.v1.MsgAddEmergencySubmitters',
      value: MsgAddEmergencySubmitters_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgAddEmergencySubmitters {
    return MsgAddEmergencySubmitters.fromProto(
      MsgAddEmergencySubmitters_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgAddEmergencySubmitters {
  export interface Amino {
    type: 'gov/MsgAddEmergencySubmitters'
    value: {
      authority: AccAddress
      emergency_submitters: string[]
    }
  }

  export interface Data {
    '@type': '/initia.gov.v1.MsgAddEmergencySubmitters'
    authority: AccAddress
    emergency_submitters: string[]
  }

  export type Proto = MsgAddEmergencySubmitters_pb
}
