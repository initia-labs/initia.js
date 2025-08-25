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
   * @param next_sequence_send the next sequence send
   */
  constructor(
    public fields: UpgradeFields | undefined,
    public timeout: Timeout | undefined,
    public next_sequence_send: number
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
    const { fields, timeout, next_sequence_send } = data
    return new Upgrade(
      fields ? UpgradeFields.fromData(fields) : undefined,
      timeout ? Timeout.fromData(timeout) : undefined,
      parseInt(next_sequence_send)
    )
  }

  public toData(): Upgrade.Data {
    const { fields, timeout, next_sequence_send } = this
    return {
      fields: fields?.toData(),
      timeout: timeout?.toData(),
      next_sequence_send: next_sequence_send.toFixed(),
    }
  }

  public static fromProto(proto: Upgrade.Proto): Upgrade {
    return new Upgrade(
      proto.fields ? UpgradeFields.fromProto(proto.fields) : undefined,
      proto.timeout ? Timeout.fromProto(proto.timeout) : undefined,
      Number(proto.nextSequenceSend)
    )
  }

  public toProto(): Upgrade.Proto {
    const { fields, timeout, next_sequence_send } = this
    return Upgrade_pb.fromPartial({
      fields: fields?.toProto(),
      timeout: timeout?.toProto(),
      nextSequenceSend: BigInt(next_sequence_send),
    })
  }
}

export namespace Upgrade {
  export interface Data {
    fields?: UpgradeFields.Data
    timeout?: Timeout.Data
    next_sequence_send: string
  }

  export type Proto = Upgrade_pb
}
