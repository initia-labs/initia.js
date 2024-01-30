import { JSONSerializable } from '../../../../util/json';
import { Duration } from '../../../Duration';
import { Params as Params_pb } from '@initia/initia.proto/ibc/applications/fetchprice/v1/types';

export class IbcFetchpriceParams extends JSONSerializable<
  IbcFetchpriceParams.Amino,
  IbcFetchpriceParams.Data,
  IbcFetchpriceParams.Proto
> {
  /**
   * @param fetch_enabled enables or disables cross-chain oracle price icq query from this chain
   * @param fetch_activated enables or disables all cross-chain token transfers to this chain
   * @param timeout_duration duration of the fetchprice timeout
   */
  constructor(
    public fetch_enabled: boolean,
    public fetch_activated: boolean,
    public timeout_duration: Duration
  ) {
    super();
  }

  public static fromAmino(
    data: IbcFetchpriceParams.Amino
  ): IbcFetchpriceParams {
    const { fetch_enabled, fetch_activated, timeout_duration } = data;
    return new IbcFetchpriceParams(
      fetch_enabled,
      fetch_activated,
      Duration.fromAmino(timeout_duration)
    );
  }

  public toAmino(): IbcFetchpriceParams.Amino {
    const { fetch_enabled, fetch_activated, timeout_duration } = this;
    return {
      fetch_enabled,
      fetch_activated,
      timeout_duration: timeout_duration.toAmino(),
    };
  }

  public static fromData(data: IbcFetchpriceParams.Data): IbcFetchpriceParams {
    const { fetch_enabled, fetch_activated, timeout_duration } = data;
    return new IbcFetchpriceParams(
      fetch_enabled,
      fetch_activated,
      Duration.fromData(timeout_duration)
    );
  }

  public toData(): IbcFetchpriceParams.Data {
    const { fetch_enabled, fetch_activated, timeout_duration } = this;
    return {
      fetch_enabled,
      fetch_activated,
      timeout_duration: timeout_duration.toData(),
    };
  }

  public static fromProto(
    data: IbcFetchpriceParams.Proto
  ): IbcFetchpriceParams {
    return new IbcFetchpriceParams(
      data.fetchEnabled,
      data.fetchActivated,
      Duration.fromProto(data.timeoutDuration as Duration.Proto)
    );
  }

  public toProto(): IbcFetchpriceParams.Proto {
    const { fetch_enabled, fetch_activated, timeout_duration } = this;
    return Params_pb.fromPartial({
      fetchEnabled: fetch_enabled,
      fetchActivated: fetch_activated,
      timeoutDuration: timeout_duration.toProto(),
    });
  }
}

export namespace IbcFetchpriceParams {
  export interface Amino {
    fetch_enabled: boolean;
    fetch_activated: boolean;
    timeout_duration: Duration.Amino;
  }

  export interface Data {
    fetch_enabled: boolean;
    fetch_activated: boolean;
    timeout_duration: Duration.Data;
  }

  export type Proto = Params_pb;
}
