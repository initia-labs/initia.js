import { JSONSerializable } from '../../util/json'
import { AccAddress } from '../bech32'
import { Vesting as Vesting_pb } from '@initia/initia.proto/initia/gov/v1/gov'

/**
 * Defines an amount Vestinged by an account address to an active proposal
 */
export class Vesting extends JSONSerializable<
  Vesting.Amino,
  Vesting.Data,
  Vesting.Proto
> {
  /**
   * @param module_addr the address of the vesting module
   * @param module_name the name of the vesting module
   * @param creator_addr the address of the creator of the vesting contract
   */
  constructor(
    public module_addr: AccAddress,
    public module_name: string,
    public creator_addr: AccAddress
  ) {
    super()
  }

  public static fromAmino(data: Vesting.Amino): Vesting {
    const { module_addr, module_name, creator_addr } = data
    return new Vesting(module_addr, module_name, creator_addr)
  }

  public toAmino(): Vesting.Amino {
    const { module_addr, module_name, creator_addr } = this
    return {
      module_addr,
      module_name,
      creator_addr,
    }
  }

  public static fromData(data: Vesting.Data): Vesting {
    const { module_addr, module_name, creator_addr } = data
    return new Vesting(module_addr, module_name, creator_addr)
  }

  public toData(): Vesting.Data {
    const { module_addr, module_name, creator_addr } = this
    return {
      module_addr,
      module_name,
      creator_addr,
    }
  }

  public static fromProto(data: Vesting.Proto): Vesting {
    return new Vesting(data.moduleAddr, data.moduleName, data.creatorAddr)
  }

  public toProto(): Vesting.Proto {
    const { module_addr, module_name, creator_addr } = this
    return Vesting_pb.fromPartial({
      moduleAddr: module_addr,
      moduleName: module_name,
      creatorAddr: creator_addr,
    })
  }
}

export namespace Vesting {
  export interface Amino {
    module_addr: AccAddress
    module_name: string
    creator_addr: AccAddress
  }

  export interface Data {
    module_addr: AccAddress
    module_name: string
    creator_addr: AccAddress
  }

  export type Proto = Vesting_pb
}
