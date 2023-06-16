import { JSONSerializable } from '../../util/json';
import { Params as Params_pb } from '@initia/initia.proto/cosmos/slashing/v1beta1/slashing';
import Long from 'long';

export class SlashingParams extends JSONSerializable<
  SlashingParams.Amino,
  SlashingParams.Data,
  SlashingParams.Proto
> {
  /**
   * @param signed_blocks_window
   * @param min_signed_per_window
   * @param downtime_jail_duration
   * @param slash_fraction_double_sign
   * @param slash_fraction_downtime
   */
  constructor(
    public signed_blocks_window: number,
    public min_signed_per_window: number,
    public downtime_jail_duration?: number,
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
      Number.parseInt(downtime_jail_duration),
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
        downtime_jail_duration: downtime_jail_duration.toString(),
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
      Number.parseInt(downtime_jail_duration.replace('s', '')),
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
      downtime_jail_duration: downtime_jail_duration.toString() + 's',
      slash_fraction_double_sign: slash_fraction_double_sign.toString(),
      slash_fraction_downtime: slash_fraction_downtime.toString(),
    };
  }

  public static fromProto(data: SlashingParams.Proto): SlashingParams {
    return new SlashingParams(
      data.signedBlocksWindow.toNumber(),
      Number.parseFloat(data.minSignedPerWindow.toString()),
      data.downtimeJailDuration?.seconds.toNumber(),
      data.slashFractionDoubleSign.toNumber(),
      data.slashFractionDowntime.toNumber()
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
      maxMemoCharacters: Long.fromNumber(max_memo_characters),
      txSigLimit: Long.fromNumber(tx_sig_limit),
      txSizeCostPerByte: Long.fromNumber(tx_size_cost_per_byte),
      sigVerifyCostEd25519: Long.fromNumber(sig_verify_cost_ed25519),
      sigVerifyCostSecp256k1: Long.fromNumber(sig_verify_cost_secp256k1),
    });
  }
}

export namespace SlashingParams {
  export interface Amino {
    type: 'cosmos-sdk/x/slashing/Params';
    value: {
      signed_blocks_window: string;
      min_signed_per_window: string;
      downtime_jail_duration: string;
      slash_fraction_double_sign: string;
      slash_fraction_downtime: string;
    };
  }

  export interface Data {
    '@type': '/cosmos.slashing.v1beta1.Params';
    signed_blocks_window: string;
    min_signed_per_window: string;
    downtime_jail_duration: string;
    slash_fraction_double_sign: string;
    slash_fraction_downtime: string;
  }

  export type Proto = Params_pb;
}
