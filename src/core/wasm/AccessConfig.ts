import { JSONSerializable } from '../../util/json'
import { AccAddress } from '../bech32'
import {
  AccessConfig as AccessConfig_pb,
  AccessType,
  accessTypeFromJSON,
  accessTypeToJSON,
} from '@initia/initia.proto/cosmwasm/wasm/v1/types'

export class AccessConfig extends JSONSerializable<
  AccessConfig.Amino,
  AccessConfig.Data,
  AccessConfig.Proto
> {
  /**
   * @param permission
   * @param addresses
   */
  constructor(
    public permission: AccessType,
    public addresses: AccAddress[]
  ) {
    super()
  }

  public static fromAmino(data: AccessConfig.Amino): AccessConfig {
    const { permission, addresses } = data
    return new AccessConfig(accessTypeFromJSON(permission), addresses)
  }

  public toAmino(): AccessConfig.Amino {
    const { permission, addresses } = this
    return {
      permission: accessTypeToJSON(permission),
      addresses,
    }
  }

  public static fromData(data: AccessConfig.Data): AccessConfig {
    const { permission, addresses } = data
    return new AccessConfig(accessTypeFromJSON(permission), addresses)
  }

  public toData(): AccessConfig.Data {
    const { permission, addresses } = this
    return {
      permission: accessTypeToJSON(permission),
      addresses,
    }
  }

  public static fromProto(data: AccessConfig.Proto): AccessConfig {
    return new AccessConfig(data.permission, data.addresses)
  }

  public toProto(): AccessConfig.Proto {
    const { permission, addresses } = this
    return AccessConfig_pb.fromPartial({
      permission,
      addresses,
    })
  }
}

export namespace AccessConfig {
  export type Type = AccessType
  export const Type = AccessType

  export interface Amino {
    permission: string
    addresses: AccAddress[]
  }

  export interface Data {
    permission: string
    addresses: AccAddress[]
  }

  export type Proto = AccessConfig_pb
}
