import { JSONSerializable } from '../../util/json'
import { AccAddress } from '../bech32'
import { AccessConfig as AccessConfig_pb } from '@initia/initia.proto/miniwasm/wasmextension/v1/types'
import {
  AccessType,
  accessTypeFromJSON,
  accessTypeToJSON,
} from '@initia/initia.proto/cosmwasm/wasm/v1/types'

/**
 * AccessConfig defines access control type.
 */
export class AccessConfigExt extends JSONSerializable<
  AccessConfigExt.Amino,
  AccessConfigExt.Data,
  AccessConfigExt.Proto
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

  public static fromAmino(data: AccessConfigExt.Amino): AccessConfigExt {
    const { permission, addresses } = data
    return new AccessConfigExt(accessTypeFromJSON(permission), addresses)
  }

  public toAmino(): AccessConfigExt.Amino {
    const { permission, addresses } = this
    return {
      permission: accessTypeToJSON(permission),
      addresses,
    }
  }

  public static fromData(data: AccessConfigExt.Data): AccessConfigExt {
    const { permission, addresses } = data
    return new AccessConfigExt(accessTypeFromJSON(permission), addresses)
  }

  public toData(): AccessConfigExt.Data {
    const { permission, addresses } = this
    return {
      permission: accessTypeToJSON(permission),
      addresses,
    }
  }

  public static fromProto(data: AccessConfigExt.Proto): AccessConfigExt {
    return new AccessConfigExt(data.permission, data.addresses)
  }

  public toProto(): AccessConfigExt.Proto {
    const { permission, addresses } = this
    return AccessConfig_pb.fromPartial({
      permission,
      addresses,
    })
  }
}

export namespace AccessConfigExt {
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
