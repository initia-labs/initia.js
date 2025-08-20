import { JSONSerializable } from '../../../../util/json'
import { Upgrade as Upgrade_pb } from '@initia/initia.proto/ibc/core/channel/v1/upgrade'
import { UpgradeFields } from './UpgradeFields'
import { Timeout } from './Timeout'

/**
 * Upgrade defines a channel upgrade.
 */
export class Upgrade extends JSONSerializable<
  any,
  Upgrade.Data,
  Upgrade.Proto
> {
  /**
   * @param fields the upgrade fields
   * @param timeout the timeout for the upgrade
   */
  constructor(
    public fields: UpgradeFields | undefined,
    public timeout: Timeout | undefined
  ) {
    super()
  }

  public static fromAmino(_: any): Upgrade {
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(data: Upgrade.Data): Upgrade {
    const { fields, timeout } = data
    return new Upgrade(
      fields ? UpgradeFields.fromData(fields) : undefined,
      timeout ? Timeout.fromData(timeout) : undefined
    )
  }

  public toData(): Upgrade.Data {
    const { fields, timeout } = this
    return {
      fields: fields?.toData(),
      timeout: timeout?.toData(),
    }
  }

  public static fromProto(proto: Upgrade.Proto): Upgrade {
    return new Upgrade(
      proto.fields ? UpgradeFields.fromProto(proto.fields) : undefined,
      proto.timeout ? Timeout.fromProto(proto.timeout) : undefined
    )
  }

  public toProto(): Upgrade.Proto {
    const { fields, timeout } = this
    return Upgrade_pb.fromPartial({
      fields: fields?.toProto(),
      timeout: timeout?.toProto(),
    })
  }
}

export namespace Upgrade {
  export interface Data {
    fields?: UpgradeFields.Data
    timeout?: Timeout.Data
  }

  export type Proto = Upgrade_pb
}
