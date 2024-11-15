import { JSONSerializable } from '../../util/json'
import { BridgeInfo as BridgeInfo_pb } from '@initia/opinit.proto/opinit/opchild/v1/types'
import { BridgeConfig } from '../ophost'

/**
 * BridgeInfo defines the information of the bridge.
 */
export class BridgeInfo extends JSONSerializable<
  BridgeInfo.Amino,
  BridgeInfo.Data,
  BridgeInfo.Proto
> {
  /**
   * @param bridge_id the unique identifier of the bridge which is assigned from l1
   * @param bridge_addr the address of the bridge on l1
   * @param l1_chain_id the chain id of the l1 chain
   * @param l1_client_id the IBC client ID, which is allocated for l1 chain, in l2 chain state
   * @param bridge_config the configuration of the bridge
   */
  constructor(
    public bridge_id: number,
    public bridge_addr: string,
    public l1_chain_id: string,
    public l1_client_id: string,
    public bridge_config: BridgeConfig
  ) {
    super()
  }

  public static fromAmino(data: BridgeInfo.Amino): BridgeInfo {
    const { bridge_id, bridge_addr, l1_chain_id, l1_client_id, bridge_config } =
      data
    return new BridgeInfo(
      parseInt(bridge_id),
      bridge_addr,
      l1_chain_id,
      l1_client_id,
      BridgeConfig.fromAmino(bridge_config)
    )
  }

  public toAmino(): BridgeInfo.Amino {
    const { bridge_id, bridge_addr, l1_chain_id, l1_client_id, bridge_config } =
      this
    return {
      bridge_id: bridge_id.toFixed(),
      bridge_addr,
      l1_chain_id,
      l1_client_id,
      bridge_config: bridge_config.toAmino(),
    }
  }

  public static fromData(data: BridgeInfo.Data): BridgeInfo {
    const { bridge_id, bridge_addr, l1_chain_id, l1_client_id, bridge_config } =
      data
    return new BridgeInfo(
      parseInt(bridge_id),
      bridge_addr,
      l1_chain_id,
      l1_client_id,
      BridgeConfig.fromData(bridge_config)
    )
  }

  public toData(): BridgeInfo.Data {
    const { bridge_id, bridge_addr, l1_chain_id, l1_client_id, bridge_config } =
      this
    return {
      bridge_id: bridge_id.toFixed(),
      bridge_addr,
      l1_chain_id,
      l1_client_id,
      bridge_config: bridge_config.toData(),
    }
  }

  public static fromProto(data: BridgeInfo.Proto): BridgeInfo {
    return new BridgeInfo(
      Number(data.bridgeId),
      data.bridgeAddr,
      data.l1ChainId,
      data.l1ClientId,
      BridgeConfig.fromProto(data.bridgeConfig as BridgeConfig.Proto)
    )
  }

  public toProto(): BridgeInfo.Proto {
    const { bridge_id, bridge_addr, l1_chain_id, l1_client_id, bridge_config } =
      this
    return BridgeInfo_pb.fromPartial({
      bridgeId: BigInt(bridge_id),
      bridgeAddr: bridge_addr,
      l1ChainId: l1_chain_id,
      l1ClientId: l1_client_id,
      bridgeConfig: bridge_config.toProto(),
    })
  }
}

export namespace BridgeInfo {
  export interface Amino {
    bridge_id: string
    bridge_addr: string
    l1_chain_id: string
    l1_client_id: string
    bridge_config: BridgeConfig.Amino
  }

  export interface Data {
    bridge_id: string
    bridge_addr: string
    l1_chain_id: string
    l1_client_id: string
    bridge_config: BridgeConfig.Data
  }

  export type Proto = BridgeInfo_pb
}
