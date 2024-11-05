import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { MsgUpdateOracleConfig as MsgUpdateOracleConfig_pb } from '@initia/opinit.proto/opinit/ophost/v1/tx'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import Long from 'long'

export class MsgUpdateOracleConfig extends JSONSerializable<
  MsgUpdateOracleConfig.Amino,
  MsgUpdateOracleConfig.Data,
  MsgUpdateOracleConfig.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param bridge_id
   * @param oracle_enabled
   */
  constructor(
    public authority: AccAddress,
    public bridge_id: number,
    public oracle_enabled: boolean
  ) {
    super()
  }

  public static fromAmino(
    data: MsgUpdateOracleConfig.Amino
  ): MsgUpdateOracleConfig {
    const {
      value: { authority, bridge_id, oracle_enabled },
    } = data

    return new MsgUpdateOracleConfig(
      authority,
      parseInt(bridge_id),
      oracle_enabled
    )
  }

  public toAmino(): MsgUpdateOracleConfig.Amino {
    const { authority, bridge_id, oracle_enabled } = this
    return {
      type: 'ophost/MsgUpdateOracleConfig',
      value: {
        authority,
        bridge_id: bridge_id.toString(),
        oracle_enabled,
      },
    }
  }

  public static fromData(
    data: MsgUpdateOracleConfig.Data
  ): MsgUpdateOracleConfig {
    const { authority, bridge_id, oracle_enabled } = data
    return new MsgUpdateOracleConfig(
      authority,
      parseInt(bridge_id),
      oracle_enabled
    )
  }

  public toData(): MsgUpdateOracleConfig.Data {
    const { authority, bridge_id, oracle_enabled } = this
    return {
      '@type': '/opinit.ophost.v1.MsgUpdateOracleConfig',
      authority,
      bridge_id: bridge_id.toString(),
      oracle_enabled,
    }
  }

  public static fromProto(
    data: MsgUpdateOracleConfig.Proto
  ): MsgUpdateOracleConfig {
    return new MsgUpdateOracleConfig(
      data.authority,
      data.bridgeId.toNumber(),
      data.oracleEnabled
    )
  }

  public toProto(): MsgUpdateOracleConfig.Proto {
    const { authority, bridge_id, oracle_enabled } = this
    return MsgUpdateOracleConfig_pb.fromPartial({
      authority,
      bridgeId: Long.fromNumber(bridge_id),
      oracleEnabled: oracle_enabled,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.ophost.v1.MsgUpdateOracleConfig',
      value: MsgUpdateOracleConfig_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgUpdateOracleConfig {
    return MsgUpdateOracleConfig.fromProto(
      MsgUpdateOracleConfig_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgUpdateOracleConfig {
  export interface Amino {
    type: 'ophost/MsgUpdateOracleConfig'
    value: {
      authority: AccAddress
      bridge_id: string
      oracle_enabled: boolean
    }
  }

  export interface Data {
    '@type': '/opinit.ophost.v1.MsgUpdateOracleConfig'
    authority: AccAddress
    bridge_id: string
    oracle_enabled: boolean
  }

  export type Proto = MsgUpdateOracleConfig_pb
}
