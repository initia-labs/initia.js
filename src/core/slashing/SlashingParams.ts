import { JSONSerializable } from '../../util/json';
import { Duration } from '../Duration';
import { Params as Params_pb } from '@initia/initia.proto/cosmos/slashing/v1beta1/slashing';
import Long from 'long';

export class SlashingParams extends JSONSerializable<
  SlashingParams.Amino,
  SlashingParams.Data,
  SlashingParams.Proto
> {
  /**
   * @param signed_blocks_window Number of blocks over which missed blocks are tallied for downtime
   * @param min_signed_per_window If a validator misses more than this number, they will be penalized and jailed for downtime
   * @param downtime_jail_duration Amount of time in seconds after which a jailed validator can be unjailed
   * @param slash_fraction_double_sign Ratio of funds slashed for a double-sign infraction
   * @param slash_fraction_downtime Ratio of funds slashed for a downtime infraction
   */
  constructor(
    public signed_blocks_window: number,
    public min_signed_per_window: number,
    public downtime_jail_duration: Duration,
    public slash_fraction_double_sign: number,
    public slash_fraction_downtime: number
  ) {
    super();
  }

  public static fromAmino(data: SlashingParams.Amino): SlashingParams {
    const {
      value: {
        signed_blocks_window,
        min_signed_per_window,
        downtime_jail_duration,
        slash_fraction_double_sign,
        slash_fraction_downtime,
      },
    } = data;

    return new SlashingParams(
      Number.parseInt(signed_blocks_window),
      Number.parseInt(min_signed_per_window),
      Duration.fromAmino(downtime_jail_duration),
      Number.parseInt(slash_fraction_double_sign),
      Number.parseInt(slash_fraction_downtime)
    );
  }

  public toAmino(): SlashingParams.Amino {
    const {
      signed_blocks_window,
      min_signed_per_window,
      downtime_jail_duration,
      slash_fraction_double_sign,
      slash_fraction_downtime,
    } = this;

    return {
      type: 'cosmos-sdk/x/slashing/Params',
      value: {
        signed_blocks_window: signed_blocks_window.toString(),
        min_signed_per_window: min_signed_per_window.toString(),
        downtime_jail_duration: downtime_jail_duration.toAmino(),
        slash_fraction_double_sign: slash_fraction_double_sign.toString(),
        slash_fraction_downtime: slash_fraction_downtime.toString(),
      },
    };
  }

  public static fromData(data: SlashingParams.Data): SlashingParams {
    const {
      signed_blocks_window,
      min_signed_per_window,
      downtime_jail_duration,
      slash_fraction_double_sign,
      slash_fraction_downtime,
    } = data;

    return new SlashingParams(
      Number.parseInt(signed_blocks_window),
      Number.parseInt(min_signed_per_window),
      Duration.fromData(downtime_jail_duration),
      Number.parseInt(slash_fraction_double_sign),
      Number.parseInt(slash_fraction_downtime)
    );
  }

  public toData(): SlashingParams.Data {
    const {
      signed_blocks_window,
      min_signed_per_window,
      downtime_jail_duration,
      slash_fraction_double_sign,
      slash_fraction_downtime,
    } = this;

    return {
      '@type': '/cosmos.slashing.v1beta1.Params',
      signed_blocks_window: signed_blocks_window.toString(),
      min_signed_per_window: min_signed_per_window.toString(),
      downtime_jail_duration: downtime_jail_duration.toData(),
      slash_fraction_double_sign: slash_fraction_double_sign.toString(),
      slash_fraction_downtime: slash_fraction_downtime.toString(),
    };
  }

  public static fromProto(data: SlashingParams.Proto): SlashingParams {
    return new SlashingParams(
      data.signedBlocksWindow.toNumber(),
      Number.parseFloat(data.minSignedPerWindow.toString()),
      Duration.fromProto(data.downtimeJailDuration as Duration.Proto),
      Number.parseFloat(data.slashFractionDoubleSign.toString()),
      Number.parseFloat(data.slashFractionDowntime.toString())
    );
  }

  public toProto(): SlashingParams.Proto {
    const {
      signed_blocks_window,
      min_signed_per_window,
      downtime_jail_duration,
      slash_fraction_double_sign,
      slash_fraction_downtime,
    } = this;

    return Params_pb.fromPartial({
      signedBlocksWindow: Long.fromNumber(signed_blocks_window),
      minSignedPerWindow: Buffer.from(min_signed_per_window.toString()),
      downtimeJailDuration: downtime_jail_duration.toProto(),
      slashFractionDoubleSign: Buffer.from(
        slash_fraction_double_sign.toString()
      ),
      slashFractionDowntime: Buffer.from(slash_fraction_downtime.toString()),
    });
  }
}

export namespace SlashingParams {
  export interface Amino {
    type: 'cosmos-sdk/x/slashing/Params';
    value: {
      signed_blocks_window: string;
      min_signed_per_window: string;
      downtime_jail_duration: Duration.Amino;
      slash_fraction_double_sign: string;
      slash_fraction_downtime: string;
    };
  }

  export interface Data {
    '@type': '/cosmos.slashing.v1beta1.Params';
    signed_blocks_window: string;
    min_signed_per_window: string;
    downtime_jail_duration: Duration.Data;
    slash_fraction_double_sign: string;
    slash_fraction_downtime: string;
  }

  export type Proto = Params_pb;
}
