import { JSONSerializable } from '../../../../util/json';
import { Params as Params_pb } from '@initia/initia.proto/ibc/core/channel/v1/channel';
import { Timeout } from './Timeout';

export class IbcChannelParams extends JSONSerializable<
  IbcChannelParams.Amino,
  IbcChannelParams.Data,
  IbcChannelParams.Proto
> {
  /**
   * @param upgrade_timeout the relative timeout after which channel upgrades will time out
   */
  constructor(public upgrade_timeout: Timeout) {
    super();
  }

  public static fromAmino(data: IbcChannelParams.Amino): IbcChannelParams {
    return new IbcChannelParams(Timeout.fromAmino(data.upgrade_timeout));
  }

  public toAmino(): IbcChannelParams.Amino {
    return {
      upgrade_timeout: this.upgrade_timeout.toAmino(),
    };
  }

  public static fromData(data: IbcChannelParams.Data): IbcChannelParams {
    return new IbcChannelParams(Timeout.fromData(data.upgrade_timeout));
  }

  public toData(): IbcChannelParams.Data {
    return {
      upgrade_timeout: this.upgrade_timeout.toData(),
    };
  }

  public static fromProto(data: IbcChannelParams.Proto): IbcChannelParams {
    return new IbcChannelParams(
      Timeout.fromProto(data.upgradeTimeout as Timeout.Proto)
    );
  }

  public toProto(): IbcChannelParams.Proto {
    return Params_pb.fromPartial({
      upgradeTimeout: this.upgrade_timeout.toProto(),
    });
  }
}

export namespace IbcChannelParams {
  export interface Amino {
    upgrade_timeout: Timeout.Amino;
  }

  export interface Data {
    upgrade_timeout: Timeout.Data;
  }

  export type Proto = Params_pb;
}
