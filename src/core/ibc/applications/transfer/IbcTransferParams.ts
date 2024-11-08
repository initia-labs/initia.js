import { JSONSerializable } from '../../../../util/json'
import { Params as Params_pb } from '@initia/initia.proto/ibc/applications/transfer/v1/transfer'

/**
 * IbcTransferParams defines the set of ibc transfer parameters.
 */
export class IbcTransferParams extends JSONSerializable<
  IbcTransferParams.Amino,
  IbcTransferParams.Data,
  IbcTransferParams.Proto
> {
  /**
   * @param send_enabled enables or disables all cross-chain token transfers from this chain
   * @param receive_enabled enables or disables all cross-chain token transfers to this chain
   */
  constructor(
    public send_enabled: boolean,
    public receive_enabled: boolean
  ) {
    super()
  }

  public static fromAmino(data: IbcTransferParams.Amino): IbcTransferParams {
    const { send_enabled, receive_enabled } = data
    return new IbcTransferParams(send_enabled, receive_enabled)
  }

  public toAmino(): IbcTransferParams.Amino {
    const { send_enabled, receive_enabled } = this
    return {
      send_enabled,
      receive_enabled,
    }
  }

  public static fromData(data: IbcTransferParams.Data): IbcTransferParams {
    const { send_enabled, receive_enabled } = data
    return new IbcTransferParams(send_enabled, receive_enabled)
  }

  public toData(): IbcTransferParams.Data {
    const { send_enabled, receive_enabled } = this
    return {
      send_enabled,
      receive_enabled,
    }
  }

  public static fromProto(data: IbcTransferParams.Proto): IbcTransferParams {
    return new IbcTransferParams(data.sendEnabled, data.receiveEnabled)
  }

  public toProto(): IbcTransferParams.Proto {
    const { send_enabled, receive_enabled } = this
    return Params_pb.fromPartial({
      sendEnabled: send_enabled,
      receiveEnabled: receive_enabled,
    })
  }
}

export namespace IbcTransferParams {
  export interface Amino {
    send_enabled: boolean
    receive_enabled: boolean
  }

  export interface Data {
    send_enabled: boolean
    receive_enabled: boolean
  }

  export type Proto = Params_pb
}
