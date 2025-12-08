import { JSONSerializable } from '../../util/json'
import { MigrationInfo as MigrationInfo_pb } from '@initia/opinit.proto/opinit/ophost/v1/types'

/**
 * L1MigrationInfo defines the information for migration.
 */
export class L1MigrationInfo extends JSONSerializable<
  L1MigrationInfo.Amino,
  L1MigrationInfo.Data,
  L1MigrationInfo.Proto
> {
  /**
   * @param bridge_id the id of the bridge
   * @param ibc_channel_id the channel id of the ibc
   * @param ibc_port_id the port id of the ibc
   * @param l1_denom the denom of the l1
   */
  constructor(
    public bridge_id: number,
    public ibc_channel_id: string,
    public ibc_port_id: string,
    public l1_denom: string
  ) {
    super()
  }

  public static fromAmino(data: L1MigrationInfo.Amino): L1MigrationInfo {
    const { bridge_id, ibc_channel_id, ibc_port_id, l1_denom } = data
    return new L1MigrationInfo(
      parseInt(bridge_id),
      ibc_channel_id,
      ibc_port_id,
      l1_denom
    )
  }

  public toAmino(): L1MigrationInfo.Amino {
    const { bridge_id, ibc_channel_id, ibc_port_id, l1_denom } = this
    return {
      bridge_id: bridge_id.toFixed(),
      ibc_channel_id,
      ibc_port_id,
      l1_denom,
    }
  }

  public static fromData(data: L1MigrationInfo.Data): L1MigrationInfo {
    const { bridge_id, ibc_channel_id, ibc_port_id, l1_denom } = data
    return new L1MigrationInfo(
      parseInt(bridge_id),
      ibc_channel_id,
      ibc_port_id,
      l1_denom
    )
  }

  public toData(): L1MigrationInfo.Data {
    const { bridge_id, ibc_channel_id, ibc_port_id, l1_denom } = this
    return {
      bridge_id: bridge_id.toFixed(),
      ibc_channel_id,
      ibc_port_id,
      l1_denom,
    }
  }

  public static fromProto(data: L1MigrationInfo.Proto): L1MigrationInfo {
    return new L1MigrationInfo(
      Number(data.bridgeId),
      data.ibcChannelId,
      data.ibcPortId,
      data.l1Denom
    )
  }

  public toProto(): L1MigrationInfo.Proto {
    const { bridge_id, ibc_channel_id, ibc_port_id, l1_denom } = this
    return MigrationInfo_pb.fromPartial({
      bridgeId: BigInt(bridge_id),
      ibcChannelId: ibc_channel_id,
      ibcPortId: ibc_port_id,
      l1Denom: l1_denom,
    })
  }
}

export namespace L1MigrationInfo {
  export interface Amino {
    bridge_id: string
    ibc_channel_id: string
    ibc_port_id: string
    l1_denom: string
  }

  export interface Data {
    bridge_id: string
    ibc_channel_id: string
    ibc_port_id: string
    l1_denom: string
  }

  export type Proto = MigrationInfo_pb
}
