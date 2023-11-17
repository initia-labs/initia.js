import { JSONSerializable } from '../../util/json';
import { AccAddress } from '../bech32';
import { Duration } from '../Duration';
import { BridgeConfig as BridgeConfig_pb } from '@initia/opinit.proto/opinit/ophost/v1/types';

export class BridgeConfig extends JSONSerializable<
  BridgeConfig.Amino,
  BridgeConfig.Data,
  BridgeConfig.Proto
> {
  /**
   * @param challenger the address of the challenger
   * @param proposer the address of the proposer
   * @param submission_interval the time interval at which checkpoints must be submitted
   * @param finalization_period the minium time duration that must elapse before a withdrawal can be finalized
   * @param submission_start_time the time of the first l2 block recorded
   * @param metadata normally IBC channelID for permissioned IBC relayer
   */
  constructor(
    public challenger: AccAddress,
    public proposer: AccAddress,
    public submission_interval: Duration,
    public finalization_period: Duration,
    public submission_start_time: Date,
    public metadata?: string
  ) {
    super();
  }

  public static fromAmino(data: BridgeConfig.Amino): BridgeConfig {
    const {
      challenger,
      proposer,
      submission_interval,
      finalization_period,
      submission_start_time,
      metadata,
    } = data;

    return new BridgeConfig(
      challenger,
      proposer,
      Duration.fromAmino(submission_interval),
      Duration.fromAmino(finalization_period),
      new Date(submission_start_time),
      metadata
    );
  }

  public toAmino(): BridgeConfig.Amino {
    const {
      challenger,
      proposer,
      submission_interval,
      finalization_period,
      submission_start_time,
      metadata,
    } = this;

    return {
      challenger,
      proposer,
      submission_interval: submission_interval.toAmino(),
      finalization_period: finalization_period.toAmino(),
      submission_start_time: submission_start_time.toISOString(),
      metadata,
    };
  }

  public static fromData(data: BridgeConfig.Data): BridgeConfig {
    const {
      challenger,
      proposer,
      submission_interval,
      finalization_period,
      submission_start_time,
      metadata,
    } = data;

    return new BridgeConfig(
      challenger,
      proposer,
      Duration.fromData(submission_interval),
      Duration.fromData(finalization_period),
      new Date(submission_start_time),
      metadata
    );
  }

  public toData(): BridgeConfig.Data {
    const {
      challenger,
      proposer,
      submission_interval,
      finalization_period,
      submission_start_time,
      metadata,
    } = this;

    return {
      challenger,
      proposer,
      submission_interval: submission_interval.toData(),
      finalization_period: finalization_period.toData(),
      submission_start_time: submission_start_time.toISOString(),
      metadata,
    };
  }

  public static fromProto(data: BridgeConfig.Proto): BridgeConfig {
    return new BridgeConfig(
      data.challenger,
      data.proposer,
      Duration.fromProto(data.submissionInterval as Duration.Proto),
      Duration.fromProto(data.finalizationPeriod as Duration.Proto),
      data.submissionStartTime as Date,
      Buffer.from(data.metadata).toString('base64')
    );
  }

  public toProto(): BridgeConfig.Proto {
    const {
      challenger,
      proposer,
      submission_interval,
      finalization_period,
      submission_start_time,
      metadata,
    } = this;

    return BridgeConfig_pb.fromPartial({
      challenger,
      proposer,
      submissionInterval: submission_interval.toProto(),
      finalizationPeriod: finalization_period.toProto(),
      submissionStartTime: submission_start_time,
      metadata: metadata ? Buffer.from(metadata, 'base64') : undefined,
    });
  }
}

export namespace BridgeConfig {
  export interface Amino {
    challenger: AccAddress;
    proposer: AccAddress;
    submission_interval: Duration.Amino;
    finalization_period: Duration.Amino;
    submission_start_time: string;
    metadata?: string;
  }

  export interface Data {
    challenger: AccAddress;
    proposer: AccAddress;
    submission_interval: Duration.Data;
    finalization_period: Duration.Data;
    submission_start_time: string;
    metadata?: string;
  }

  export type Proto = BridgeConfig_pb;
}
