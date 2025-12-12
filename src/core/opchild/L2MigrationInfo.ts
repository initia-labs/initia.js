import { JSONSerializable } from '../../util/json'
import { MigrationInfo as MigrationInfo_pb } from '@initia/opinit.proto/opinit/opchild/v1/types'

/**
 * L2MigrationInfo defines the information for migration.
 */
export class L2MigrationInfo extends JSONSerializable<
  L2MigrationInfo.Amino,
  L2MigrationInfo.Data,
  L2MigrationInfo.Proto
> {
  /**
   * @param denom the denom of the token on l2 chain
   * @param ibc_channel_id the channel id of the ibc
   * @param ibc_port_id the port id of the ibc
   */
  constructor(
    public denom: string,
    public ibc_channel_id: string,
    public ibc_port_id: string
  ) {
    super()
  }

  public static fromAmino(data: L2MigrationInfo.Amino): L2MigrationInfo {
    const { denom, ibc_channel_id, ibc_port_id } = data
    return new L2MigrationInfo(denom, ibc_channel_id, ibc_port_id)
  }

  public toAmino(): L2MigrationInfo.Amino {
    const { denom, ibc_channel_id, ibc_port_id } = this
    return {
      denom,
      ibc_channel_id,
      ibc_port_id,
    }
  }

  public static fromData(data: L2MigrationInfo.Data): L2MigrationInfo {
    const { denom, ibc_channel_id, ibc_port_id } = data
    return new L2MigrationInfo(denom, ibc_channel_id, ibc_port_id)
  }

  public toData(): L2MigrationInfo.Data {
    const { denom, ibc_channel_id, ibc_port_id } = this
    return {
      denom,
      ibc_channel_id,
      ibc_port_id,
    }
  }

  public static fromProto(data: L2MigrationInfo.Proto): L2MigrationInfo {
    return new L2MigrationInfo(data.denom, data.ibcChannelId, data.ibcPortId)
  }

  public toProto(): L2MigrationInfo.Proto {
    const { denom, ibc_channel_id, ibc_port_id } = this
    return MigrationInfo_pb.fromPartial({
      denom,
      ibcChannelId: ibc_channel_id,
      ibcPortId: ibc_port_id,
    })
  }
}

export namespace L2MigrationInfo {
  export interface Amino {
    denom: string
    ibc_channel_id: string
    ibc_port_id: string
  }

  export interface Data {
    denom: string
    ibc_channel_id: string
    ibc_port_id: string
  }

  export type Proto = MigrationInfo_pb
}
