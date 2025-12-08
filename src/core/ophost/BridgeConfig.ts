import { JSONSerializable } from '../../util/json'
import { AccAddress } from '../bech32'
import { Duration } from '../Duration'
import { BridgeConfig as BridgeConfig_pb } from '@initia/opinit.proto/opinit/ophost/v1/types'
import { BatchInfo } from './BatchInfo'

/**
 * BridgeConfig defines the set of bridge config.
 */
export class BridgeConfig extends JSONSerializable<
  BridgeConfig.Amino,
  BridgeConfig.Data,
  BridgeConfig.Proto
> {
  /**
   * @param challenger the address of the challenger
   * @param proposer the address of the proposer
   * @param batch_info the information about batch submission
   * @param submission_interval the time interval at which checkpoints must be submitted
   * @param finalization_period the minimum time duration that must elapse before a withdrawal can be finalized
   * @param submission_start_height the first l2 block will be recorded on l1
   * @param oracle_enabled flag to enable oracle
   * @param metadata normally IBC channelID for permissioned IBC relayer
   * @param bridge_disabled flag to disable the bridge
   * @param bridge_disabled_at the timestamp when the bridge is disabled
   */
  constructor(
    public challenger: AccAddress,
    public proposer: AccAddress,
    public batch_info: BatchInfo,
    public submission_interval: Duration,
    public finalization_period: Duration,
    public submission_start_height: number,
    public oracle_enabled: boolean,
    public metadata: string | undefined,
    public bridge_disabled: boolean,
    public bridge_disabled_at: Date
  ) {
    super()
  }

  public static fromAmino(data: BridgeConfig.Amino): BridgeConfig {
    const {
      challenger,
      proposer,
      batch_info,
      submission_interval,
      finalization_period,
      submission_start_height,
      oracle_enabled,
      metadata,
      bridge_disabled,
      bridge_disabled_at,
    } = data

    return new BridgeConfig(
      challenger,
      proposer,
      BatchInfo.fromAmino(batch_info),
      Duration.fromAmino(submission_interval),
      Duration.fromAmino(finalization_period),
      parseInt(submission_start_height),
      oracle_enabled,
      metadata,
      bridge_disabled,
      new Date(bridge_disabled_at)
    )
  }

  public toAmino(): BridgeConfig.Amino {
    const {
      challenger,
      proposer,
      batch_info,
      submission_interval,
      finalization_period,
      submission_start_height,
      oracle_enabled,
      metadata,
      bridge_disabled,
      bridge_disabled_at,
    } = this

    return {
      challenger,
      proposer,
      batch_info: batch_info.toAmino(),
      submission_interval: submission_interval.toAmino(),
      finalization_period: finalization_period.toAmino(),
      submission_start_height: submission_start_height.toFixed(),
      oracle_enabled,
      metadata,
      bridge_disabled,
      bridge_disabled_at: bridge_disabled_at.toISOString(),
    }
  }

  public static fromData(data: BridgeConfig.Data): BridgeConfig {
    const {
      challenger,
      proposer,
      batch_info,
      submission_interval,
      finalization_period,
      submission_start_height,
      oracle_enabled,
      metadata,
      bridge_disabled,
      bridge_disabled_at,
    } = data

    return new BridgeConfig(
      challenger,
      proposer,
      BatchInfo.fromData(batch_info),
      Duration.fromData(submission_interval),
      Duration.fromData(finalization_period),
      parseInt(submission_start_height),
      oracle_enabled,
      metadata,
      bridge_disabled,
      new Date(bridge_disabled_at)
    )
  }

  public toData(): BridgeConfig.Data {
    const {
      challenger,
      proposer,
      batch_info,
      submission_interval,
      finalization_period,
      submission_start_height,
      oracle_enabled,
      metadata,
      bridge_disabled,
      bridge_disabled_at,
    } = this

    return {
      challenger,
      proposer,
      batch_info: batch_info.toData(),
      submission_interval: submission_interval.toData(),
      finalization_period: finalization_period.toData(),
      submission_start_height: submission_start_height.toFixed(),
      oracle_enabled,
      metadata,
      bridge_disabled,
      bridge_disabled_at: bridge_disabled_at.toISOString(),
    }
  }

  public static fromProto(data: BridgeConfig.Proto): BridgeConfig {
    return new BridgeConfig(
      data.challenger,
      data.proposer,
      BatchInfo.fromProto(data.batchInfo as BatchInfo.Proto),
      Duration.fromProto(data.submissionInterval as Duration.Proto),
      Duration.fromProto(data.finalizationPeriod as Duration.Proto),
      Number(data.submissionStartHeight),
      data.oracleEnabled,
      Buffer.from(data.metadata).toString('base64'),
      data.bridgeDisabled,
      data.bridgeDisabledAt as Date
    )
  }

  public toProto(): BridgeConfig.Proto {
    const {
      challenger,
      proposer,
      batch_info,
      submission_interval,
      finalization_period,
      submission_start_height,
      oracle_enabled,
      metadata,
      bridge_disabled,
      bridge_disabled_at,
    } = this

    return BridgeConfig_pb.fromPartial({
      challenger,
      proposer,
      batchInfo: batch_info.toProto(),
      submissionInterval: submission_interval.toProto(),
      finalizationPeriod: finalization_period.toProto(),
      submissionStartHeight: BigInt(submission_start_height),
      oracleEnabled: oracle_enabled,
      metadata: metadata ? Buffer.from(metadata, 'base64') : undefined,
      bridgeDisabled: bridge_disabled,
      bridgeDisabledAt: bridge_disabled_at,
    })
  }
}

export namespace BridgeConfig {
  export interface Amino {
    challenger: AccAddress
    proposer: AccAddress
    batch_info: BatchInfo.Amino
    submission_interval: Duration.Amino
    finalization_period: Duration.Amino
    submission_start_height: string
    oracle_enabled: boolean
    metadata?: string
    bridge_disabled: boolean
    bridge_disabled_at: string
  }

  export interface Data {
    challenger: AccAddress
    proposer: AccAddress
    batch_info: BatchInfo.Data
    submission_interval: Duration.Data
    finalization_period: Duration.Data
    submission_start_height: string
    oracle_enabled: boolean
    metadata?: string
    bridge_disabled: boolean
    bridge_disabled_at: string
  }

  export type Proto = BridgeConfig_pb
}
