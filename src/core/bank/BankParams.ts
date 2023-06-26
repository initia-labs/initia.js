import { JSONSerializable } from '../../util/json';
import { SendEnabled } from './SendEnabled';
import { Params as Params_pb } from '@initia/initia.proto/cosmos/bank/v1beta1/bank';

export class BankParams extends JSONSerializable<
  BankParams.Amino,
  BankParams.Data,
  BankParams.Proto
> {
  /**
   * @param send_enabled
   * @param default_send_enabled
   */
  constructor(
    public send_enabled: SendEnabled[],
    public default_send_enabled: boolean
  ) {
    super();
  }

  public static fromAmino(data: BankParams.Amino): BankParams {
    const {
      value: { send_enabled, default_send_enabled },
    } = data;
    return new BankParams(
      send_enabled.map(SendEnabled.fromAmino),
      default_send_enabled
    );
  }

  public toAmino(): BankParams.Amino {
    const { send_enabled, default_send_enabled } = this;
    return {
      type: 'cosmos-sdk/x/bank/Params',
      value: {
        send_enabled: send_enabled.map(d => d.toAmino()),
        default_send_enabled,
      },
    };
  }

  public static fromData(data: BankParams.Data): BankParams {
    const { send_enabled, default_send_enabled } = data;
    return new BankParams(
      send_enabled.map(SendEnabled.fromData),
      default_send_enabled
    );
  }

  public toData(): BankParams.Data {
    const { send_enabled, default_send_enabled } = this;
    return {
      '@type': '/cosmos.bank.v1beta1.Params',
      send_enabled: send_enabled.map(d => d.toData()),
      default_send_enabled,
    };
  }

  public static fromProto(data: BankParams.Proto): BankParams {
    return new BankParams(
      data.sendEnabled.map(SendEnabled.fromProto),
      data.defaultSendEnabled
    );
  }

  public toProto(): BankParams.Proto {
    const { send_enabled, default_send_enabled } = this;
    return Params_pb.fromPartial({
      sendEnabled: send_enabled.map(d => d.toProto()),
      defaultSendEnabled: default_send_enabled,
    });
  }
}

export namespace BankParams {
  export interface Amino {
    type: 'cosmos-sdk/x/bank/Params';
    value: {
      send_enabled: SendEnabled.Amino[];
      default_send_enabled: boolean;
    };
  }

  export interface Data {
    '@type': '/cosmos.bank.v1beta1.Params';
    send_enabled: SendEnabled.Data[];
    default_send_enabled: boolean;
  }

  export type Proto = Params_pb;
}
