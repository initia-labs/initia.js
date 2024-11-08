import { JSONSerializable } from '../../../../util/json'
import { Params as Params_pb } from '@initia/initia.proto/ibc/applications/nft_transfer/v1/types'

/**
 * IbcNftParams defines the set of ibc nft parameters.
 */
export class IbcNftParams extends JSONSerializable<
  IbcNftParams.Amino,
  IbcNftParams.Data,
  IbcNftParams.Proto
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

  public static fromAmino(data: IbcNftParams.Amino): IbcNftParams {
    const {
      value: { send_enabled, receive_enabled },
    } = data
    return new IbcNftParams(send_enabled, receive_enabled)
  }

  public toAmino(): IbcNftParams.Amino {
    const { send_enabled, receive_enabled } = this
    return {
      type: 'nft-transfer/Params',
      value: { send_enabled, receive_enabled },
    }
  }

  public static fromData(data: IbcNftParams.Data): IbcNftParams {
    const { send_enabled, receive_enabled } = data
    return new IbcNftParams(send_enabled, receive_enabled)
  }

  public toData(): IbcNftParams.Data {
    const { send_enabled, receive_enabled } = this
    return {
      '@type': '/ibc.applications.nft_transfer.v1.Params',
      send_enabled,
      receive_enabled,
    }
  }

  public static fromProto(data: IbcNftParams.Proto): IbcNftParams {
    return new IbcNftParams(data.sendEnabled, data.receiveEnabled)
  }

  public toProto(): IbcNftParams.Proto {
    const { send_enabled, receive_enabled } = this
    return Params_pb.fromPartial({
      sendEnabled: send_enabled,
      receiveEnabled: receive_enabled,
    })
  }
}

export namespace IbcNftParams {
  export interface Amino {
    type: 'nft-transfer/Params'
    value: {
      send_enabled: boolean
      receive_enabled: boolean
    }
  }

  export interface Data {
    '@type': '/ibc.applications.nft_transfer.v1.Params'
    send_enabled: boolean
    receive_enabled: boolean
  }

  export type Proto = Params_pb
}
