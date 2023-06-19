import { JSONSerializable } from '../../../../util/json';
import { Params as Params_pb } from '@initia/initia.proto/ibc/applications/sft_transfer/v1/types';

export class IbcSftParams extends JSONSerializable<
  IbcSftParams.Amino,
  IbcSftParams.Data,
  IbcSftParams.Proto
> {
  /**
   * @param send_enabled enables or disables all cross-chain token transfers from this chain
   * @param receive_enabled enables or disables all cross-chain token transfers to this chain
   */
  constructor(public send_enabled: boolean, public receive_enabled: boolean) {
    super();
  }

  public static fromAmino(data: IbcSftParams.Amino): IbcSftParams {
    const {
      value: { send_enabled, receive_enabled },
    } = data;
    return new IbcSftParams(send_enabled, receive_enabled);
  }

  public toAmino(): IbcSftParams.Amino {
    const { send_enabled, receive_enabled } = this;
    return {
      type: 'sft-transfer/Params',
      value: { send_enabled, receive_enabled },
    };
  }

  public static fromData(data: IbcSftParams.Data): IbcSftParams {
    const { send_enabled, receive_enabled } = data;
    return new IbcSftParams(send_enabled, receive_enabled);
  }

  public toData(): IbcSftParams.Data {
    const { send_enabled, receive_enabled } = this;
    return {
      '@type': '/ibc.applications.sft_transfer.v1.Params',
      send_enabled,
      receive_enabled,
    };
  }

  public static fromProto(data: IbcSftParams.Proto): IbcSftParams {
    return new IbcSftParams(data.sendEnabled, data.receiveEnabled);
  }

  public toProto(): IbcSftParams.Proto {
    const { send_enabled, receive_enabled } = this;
    return Params_pb.fromPartial({
      sendEnabled: send_enabled,
      receiveEnabled: receive_enabled,
    });
  }
}

export namespace IbcSftParams {
  export interface Amino {
    type: 'sft-transfer/Params';
    value: {
      send_enabled: boolean;
      receive_enabled: boolean;
    };
  }

  export interface Data {
    '@type': '/ibc.applications.sft_transfer.v1.Params';
    send_enabled: boolean;
    receive_enabled: boolean;
  }

  export type Proto = Params_pb;
}
