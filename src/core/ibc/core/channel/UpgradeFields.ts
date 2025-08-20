import { JSONSerializable } from '../../../../util/json'
import { UpgradeFields as UpgradeFields_pb } from '@initia/initia.proto/ibc/core/channel/v1/upgrade'
import {
  orderFromJSON,
  orderToJSON,
} from '@initia/initia.proto/ibc/core/channel/v1/channel'
import { ChannelOrder } from './ChannelOrder'

/**
 * UpgradeFields defines the fields that can be upgraded in a channel.
 */
export class UpgradeFields extends JSONSerializable<
  any,
  UpgradeFields.Data,
  UpgradeFields.Proto
> {
  /**
   * @param ordering the ordering of the channel
   * @param connection_hops list of connection hops
   * @param version the version of the channel
   */
  constructor(
    public ordering: ChannelOrder,
    public connection_hops: string[],
    public version: string
  ) {
    super()
  }

  public static fromAmino(_: any): UpgradeFields {
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(data: UpgradeFields.Data): UpgradeFields {
    const { ordering, connection_hops, version } = data
    return new UpgradeFields(orderFromJSON(ordering), connection_hops, version)
  }

  public toData(): UpgradeFields.Data {
    const { ordering, connection_hops, version } = this
    return {
      ordering: orderToJSON(ordering),
      connection_hops,
      version,
    }
  }

  public static fromProto(proto: UpgradeFields.Proto): UpgradeFields {
    return new UpgradeFields(
      proto.ordering,
      proto.connectionHops,
      proto.version
    )
  }

  public toProto(): UpgradeFields.Proto {
    const { ordering, connection_hops, version } = this
    return UpgradeFields_pb.fromPartial({
      ordering,
      connectionHops: connection_hops,
      version,
    })
  }
}

export namespace UpgradeFields {
  export interface Data {
    ordering: string
    connection_hops: string[]
    version: string
  }

  export type Proto = UpgradeFields_pb
}
