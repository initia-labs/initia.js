import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { BridgeConfig } from '../BridgeConfig'
import { MsgCreateBridge as MsgCreateBridge_pb } from '@initia/opinit.proto/opinit/ophost/v1/tx'
import { Any } from '@initia/initia.proto/google/protobuf/any'

/**
 * MsgCreateBridge is a message to register a new bridge with new bridge id.
 */
export class MsgCreateBridge extends JSONSerializable<
  MsgCreateBridge.Amino,
  MsgCreateBridge.Data,
  MsgCreateBridge.Proto
> {
  /**
   * @param creator
   * @param config
   */
  constructor(
    public creator: AccAddress,
    public config: BridgeConfig
  ) {
    super()
  }

  public static fromAmino(data: MsgCreateBridge.Amino): MsgCreateBridge {
    const {
      value: { creator, config },
    } = data

    return new MsgCreateBridge(creator, BridgeConfig.fromAmino(config))
  }

  public toAmino(): MsgCreateBridge.Amino {
    const { creator, config } = this
    return {
      type: 'ophost/MsgCreateBridge',
      value: {
        creator,
        config: config.toAmino(),
      },
    }
  }

  public static fromData(data: MsgCreateBridge.Data): MsgCreateBridge {
    const { creator, config } = data
    return new MsgCreateBridge(creator, BridgeConfig.fromData(config))
  }

  public toData(): MsgCreateBridge.Data {
    const { creator, config } = this
    return {
      '@type': '/opinit.ophost.v1.MsgCreateBridge',
      creator,
      config: config.toData(),
    }
  }

  public static fromProto(data: MsgCreateBridge.Proto): MsgCreateBridge {
    return new MsgCreateBridge(
      data.creator,
      BridgeConfig.fromProto(data.config as BridgeConfig.Proto)
    )
  }

  public toProto(): MsgCreateBridge.Proto {
    const { creator, config } = this
    return MsgCreateBridge_pb.fromPartial({
      creator,
      config: config.toProto(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.ophost.v1.MsgCreateBridge',
      value: MsgCreateBridge_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgCreateBridge {
    return MsgCreateBridge.fromProto(MsgCreateBridge_pb.decode(msgAny.value))
  }
}

export namespace MsgCreateBridge {
  export interface Amino {
    type: 'ophost/MsgCreateBridge'
    value: {
      creator: AccAddress
      config: BridgeConfig.Amino
    }
  }

  export interface Data {
    '@type': '/opinit.ophost.v1.MsgCreateBridge'
    creator: AccAddress
    config: BridgeConfig.Data
  }

  export type Proto = MsgCreateBridge_pb
}
