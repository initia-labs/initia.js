import { JSONSerializable } from '../../util/json'
import { AccAddress } from '../bech32'
import { AccessTuple as AccessTuple_pb } from '@initia/initia.proto/minievm/evm/v1/types'

/**
 * AccessTuple is the tuple for address and storage keys.
 */
export class AccessTuple extends JSONSerializable<
  AccessTuple.Amino,
  AccessTuple.Data,
  AccessTuple.Proto
> {
  /**
   * @param address address of the contract that will be accessed during the transaction execution
   * @param storage_keys list of storage keys that the transaction will interact with within the specified contract
   */
  constructor(
    public address: AccAddress,
    public storage_keys: string[]
  ) {
    super()
  }

  public static fromAmino(data: AccessTuple.Amino): AccessTuple {
    const { address, storage_keys } = data
    return new AccessTuple(address, storage_keys)
  }

  public toAmino(): AccessTuple.Amino {
    const { address, storage_keys } = this
    return { address, storage_keys }
  }

  public static fromData(data: AccessTuple.Data): AccessTuple {
    const { address, storage_keys } = data
    return new AccessTuple(address, storage_keys)
  }

  public toData(): AccessTuple.Data {
    const { address, storage_keys } = this
    return { address, storage_keys }
  }

  public static fromProto(data: AccessTuple.Proto): AccessTuple {
    return new AccessTuple(data.address, data.storageKeys)
  }

  public toProto(): AccessTuple.Proto {
    const { address, storage_keys } = this
    return AccessTuple_pb.fromPartial({
      address,
      storageKeys: storage_keys,
    })
  }
}

export namespace AccessTuple {
  export interface Amino {
    address: AccAddress
    storage_keys: string[]
  }

  export interface Data {
    address: AccAddress
    storage_keys: string[]
  }

  export type Proto = AccessTuple_pb
}
