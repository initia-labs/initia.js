import { JSONSerializable } from '../../util/json'
import { base64FromBytes, bytesFromBase64 } from '../../util/polyfill'
import { AccAddress } from '../bech32'
import { Duration } from '../Duration'
import { BridgeConfig as BridgeConfig_pb } from '@initia/opinit.proto/opinit/ophost/v1/types'
import { BatchInfo } from './BatchInfo'
import Long from 'long'

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
   * @param finalization_period the minium time duration that must elapse before a withdrawal can be finalized
   * @param submission_start_height the first l2 block will be recorded on l1
   * @param oracle_enabled flag to enable oracle
   * @param metadata normally IBC channelID for permissioned IBC relayer
   */
  constructor(
    public challenger: AccAddress,
    public proposer: AccAddress,
    public batch_info: BatchInfo,
    public submission_interval: Duration,
    public finalization_period: Duration,
    public submission_start_height: number,
    public oracle_enabled: boolean,
    public metadata?: string
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
    } = data

    return new BridgeConfig(
      challenger,
      proposer,
      BatchInfo.fromAmino(batch_info),
      Duration.fromAmino(submission_interval),
      Duration.fromAmino(finalization_period),
      Number.parseInt(submission_start_height),
      oracle_enabled,
      metadata
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
    } = this

    return {
      challenger,
      proposer,
      batch_info: batch_info.toAmino(),
      submission_interval: submission_interval.toAmino(),
      finalization_period: finalization_period.toAmino(),
      submission_start_height: submission_start_height.toString(),
      oracle_enabled,
      metadata,
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
    } = data

    return new BridgeConfig(
      challenger,
      proposer,
      BatchInfo.fromData(batch_info),
      Duration.fromData(submission_interval),
      Duration.fromData(finalization_period),
      Number.parseInt(submission_start_height),
      oracle_enabled,
      metadata
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
    } = this

    return {
      challenger,
      proposer,
      batch_info: batch_info.toData(),
      submission_interval: submission_interval.toData(),
      finalization_period: finalization_period.toData(),
      submission_start_height: submission_start_height.toString(),
      oracle_enabled,
      metadata,
    }
  }

  public static fromProto(data: BridgeConfig.Proto): BridgeConfig {
    return new BridgeConfig(
      data.challenger,
      data.proposer,
      BatchInfo.fromProto(data.batchInfo as BatchInfo.Proto),
      Duration.fromProto(data.submissionInterval as Duration.Proto),
      Duration.fromProto(data.finalizationPeriod as Duration.Proto),
      data.submissionStartHeight.toNumber(),
      data.oracleEnabled,
      base64FromBytes(data.metadata)
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
    } = this

    return BridgeConfig_pb.fromPartial({
      challenger,
      proposer,
      batchInfo: batch_info.toProto(),
      submissionInterval: submission_interval.toProto(),
      finalizationPeriod: finalization_period.toProto(),
      submissionStartHeight: Long.fromNumber(submission_start_height),
      oracleEnabled: oracle_enabled,
      metadata: metadata ? bytesFromBase64(metadata) : undefined,
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
  }

  export type Proto = BridgeConfig_pb
}
