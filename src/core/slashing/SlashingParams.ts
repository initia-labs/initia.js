import { JSONSerializable } from '../../util/json'
import { Duration } from '../Duration'
import { Params as Params_pb } from '@initia/initia.proto/cosmos/slashing/v1beta1/slashing'

/**
 * SlashingParams defines the set of slashing parameters.
 */
export class SlashingParams extends JSONSerializable<
  SlashingParams.Amino,
  SlashingParams.Data,
  SlashingParams.Proto
> {
  /**
   * @param signed_blocks_window number of blocks over which missed blocks are tallied for downtime
   * @param min_signed_per_window if a validator misses more than this number, they will be penalized and jailed for downtime
   * @param downtime_jail_duration amount of time in seconds after which a jailed validator can be unjailed
   * @param slash_fraction_double_sign ratio of funds slashed for a double-sign infraction
   * @param slash_fraction_downtime ratio of funds slashed for a downtime infraction
   */
  constructor(
    public signed_blocks_window: number,
    public min_signed_per_window: string,
    public downtime_jail_duration: Duration,
    public slash_fraction_double_sign: string,
    public slash_fraction_downtime: string
  ) {
    super()
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
    } = data

    return new SlashingParams(
      parseInt(signed_blocks_window),
      min_signed_per_window,
      Duration.fromAmino(downtime_jail_duration),
      slash_fraction_double_sign,
      slash_fraction_downtime
    )
  }

  public toAmino(): SlashingParams.Amino {
    const {
      signed_blocks_window,
      min_signed_per_window,
      downtime_jail_duration,
      slash_fraction_double_sign,
      slash_fraction_downtime,
    } = this

    return {
      type: 'cosmos-sdk/x/slashing/Params',
      value: {
        signed_blocks_window: signed_blocks_window.toFixed(),
        min_signed_per_window,
        downtime_jail_duration: downtime_jail_duration.toAmino(),
        slash_fraction_double_sign,
        slash_fraction_downtime,
      },
    }
  }

  public static fromData(data: SlashingParams.Data): SlashingParams {
    const {
      signed_blocks_window,
      min_signed_per_window,
      downtime_jail_duration,
      slash_fraction_double_sign,
      slash_fraction_downtime,
    } = data

    return new SlashingParams(
      parseInt(signed_blocks_window),
      min_signed_per_window,
      Duration.fromData(downtime_jail_duration),
      slash_fraction_double_sign,
      slash_fraction_downtime
    )
  }

  public toData(): SlashingParams.Data {
    const {
      signed_blocks_window,
      min_signed_per_window,
      downtime_jail_duration,
      slash_fraction_double_sign,
      slash_fraction_downtime,
    } = this

    return {
      '@type': '/cosmos.slashing.v1beta1.Params',
      signed_blocks_window: signed_blocks_window.toFixed(),
      min_signed_per_window,
      downtime_jail_duration: downtime_jail_duration.toData(),
      slash_fraction_double_sign,
      slash_fraction_downtime,
    }
  }

  public static fromProto(data: SlashingParams.Proto): SlashingParams {
    return new SlashingParams(
      Number(data.signedBlocksWindow),
      data.minSignedPerWindow.toString(),
      Duration.fromProto(data.downtimeJailDuration as Duration.Proto),
      data.slashFractionDoubleSign.toString(),
      data.slashFractionDowntime.toString()
    )
  }

  public toProto(): SlashingParams.Proto {
    const {
      signed_blocks_window,
      min_signed_per_window,
      downtime_jail_duration,
      slash_fraction_double_sign,
      slash_fraction_downtime,
    } = this

    return Params_pb.fromPartial({
      signedBlocksWindow: BigInt(signed_blocks_window),
      minSignedPerWindow: Buffer.from(min_signed_per_window),
      downtimeJailDuration: downtime_jail_duration.toProto(),
      slashFractionDoubleSign: Buffer.from(slash_fraction_double_sign),
      slashFractionDowntime: Buffer.from(slash_fraction_downtime),
    })
  }
}

export namespace SlashingParams {
  export interface Amino {
    type: 'cosmos-sdk/x/slashing/Params'
    value: {
      signed_blocks_window: string
      min_signed_per_window: string
      downtime_jail_duration: Duration.Amino
      slash_fraction_double_sign: string
      slash_fraction_downtime: string
    }
  }

  export interface Data {
    '@type': '/cosmos.slashing.v1beta1.Params'
    signed_blocks_window: string
    min_signed_per_window: string
    downtime_jail_duration: Duration.Data
    slash_fraction_double_sign: string
    slash_fraction_downtime: string
  }

  export type Proto = Params_pb
}
