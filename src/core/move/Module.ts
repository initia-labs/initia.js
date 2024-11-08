import { JSONSerializable } from '../../util/json'
import { AccAddress } from '../bech32'
import {
  Module as Module_pb,
  UpgradePolicy,
  upgradePolicyFromJSON,
  upgradePolicyToJSON,
} from '@initia/initia.proto/initia/move/v1/types'

/**
 * Module is the data for the uploaded contract move code.
 */
export class Module extends JSONSerializable<
  Module.Amino,
  Module.Data,
  Module.Proto
> {
  /**
   * @param address
   * @param module_name
   * @param abi
   * @param raw_bytes
   * @param upgrade_policy
   */
  constructor(
    public address: AccAddress,
    public module_name: string,
    public abi: string,
    public raw_bytes: string,
    public upgrade_policy: Module.Policy
  ) {
    super()
  }

  public static fromAmino(data: Module.Amino): Module {
    const { address, module_name, abi, raw_bytes, upgrade_policy } = data
    return new Module(
      address,
      module_name,
      abi,
      raw_bytes,
      upgradePolicyFromJSON(upgrade_policy)
    )
  }

  public toAmino(): Module.Amino {
    const { address, module_name, abi, raw_bytes, upgrade_policy } = this
    return {
      address,
      module_name,
      abi,
      raw_bytes,
      upgrade_policy: upgradePolicyToJSON(upgrade_policy),
    }
  }

  public static fromData(data: Module.Data): Module {
    const { address, module_name, abi, raw_bytes, upgrade_policy } = data
    return new Module(
      address,
      module_name,
      abi,
      raw_bytes,
      upgradePolicyFromJSON(upgrade_policy)
    )
  }

  public toData(): Module.Data {
    const { address, module_name, abi, raw_bytes, upgrade_policy } = this
    return {
      address,
      module_name,
      abi,
      raw_bytes,
      upgrade_policy: upgradePolicyToJSON(upgrade_policy),
    }
  }

  public static fromProto(data: Module.Proto): Module {
    return new Module(
      data.address,
      data.moduleName,
      data.abi,
      Buffer.from(data.rawBytes).toString('base64'),
      data.upgradePolicy
    )
  }

  public toProto(): Module.Proto {
    const { address, module_name, abi, raw_bytes, upgrade_policy } = this
    return Module_pb.fromPartial({
      address,
      moduleName: module_name,
      abi,
      rawBytes: Buffer.from(raw_bytes, 'base64'),
      upgradePolicy: upgrade_policy,
    })
  }
}

export namespace Module {
  export type Policy = UpgradePolicy
  export const Policy = UpgradePolicy

  export interface Amino {
    address: AccAddress
    module_name: string
    abi: string
    raw_bytes: string
    upgrade_policy: string
  }

  export interface Data {
    address: AccAddress
    module_name: string
    abi: string
    raw_bytes: string
    upgrade_policy: string
  }

  export type Proto = Module_pb
}
