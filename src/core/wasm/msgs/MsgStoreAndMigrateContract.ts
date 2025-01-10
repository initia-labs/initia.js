import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgStoreAndMigrateContract as MsgStoreAndMigrateContract_pb } from '@initia/initia.proto/cosmwasm/wasm/v1/tx'
import { AccessConfig } from '../AccessConfig'

/**
 * MsgStoreAndMigrateContract defines a governance operation for storing
 * and migrating the contract. The authority is defined in the keeper.
 */
export class MsgStoreAndMigrateContract extends JSONSerializable<
  MsgStoreAndMigrateContract.Amino,
  MsgStoreAndMigrateContract.Data,
  MsgStoreAndMigrateContract.Proto
> {
  /**
   * @param authority the address of the governance account
   * @param wasm_byte_code can be raw or gzip compressed
   * @param instantiate_permission access control to apply on contract creation, optional
   * @param contract the address of the smart contract
   * @param msg json encoded message to be passed to the contract on migration
   */
  constructor(
    public authority: AccAddress,
    public wasm_byte_code: string,
    public instantiate_permission: AccessConfig | undefined,
    public contract: AccAddress,
    public msg: string
  ) {
    super()
  }

  public static fromAmino(
    data: MsgStoreAndMigrateContract.Amino
  ): MsgStoreAndMigrateContract {
    const {
      value: {
        authority,
        wasm_byte_code,
        instantiate_permission,
        contract,
        msg,
      },
    } = data

    return new MsgStoreAndMigrateContract(
      authority,
      wasm_byte_code,
      instantiate_permission
        ? AccessConfig.fromAmino(instantiate_permission)
        : undefined,
      contract,
      Buffer.from(JSON.stringify(msg)).toString('base64')
    )
  }

  public toAmino(): MsgStoreAndMigrateContract.Amino {
    const { authority, wasm_byte_code, instantiate_permission, contract, msg } =
      this

    return {
      type: 'wasm/MsgStoreAndMigrateContract',
      value: {
        authority,
        wasm_byte_code,
        instantiate_permission: instantiate_permission?.toAmino(),
        contract,
        msg: JSON.parse(Buffer.from(msg, 'base64').toString()),
      },
    }
  }

  public static fromData(
    data: MsgStoreAndMigrateContract.Data
  ): MsgStoreAndMigrateContract {
    const { authority, wasm_byte_code, instantiate_permission, contract, msg } =
      data

    return new MsgStoreAndMigrateContract(
      authority,
      wasm_byte_code,
      instantiate_permission
        ? AccessConfig.fromData(instantiate_permission)
        : undefined,
      contract,
      Buffer.from(JSON.stringify(msg)).toString('base64')
    )
  }

  public toData(): MsgStoreAndMigrateContract.Data {
    const { authority, wasm_byte_code, instantiate_permission, contract, msg } =
      this

    return {
      '@type': '/cosmwasm.wasm.v1.MsgStoreAndMigrateContract',
      authority,
      wasm_byte_code,
      instantiate_permission: instantiate_permission?.toData(),
      contract,
      msg: JSON.parse(Buffer.from(msg, 'base64').toString()),
    }
  }

  public static fromProto(
    data: MsgStoreAndMigrateContract.Proto
  ): MsgStoreAndMigrateContract {
    return new MsgStoreAndMigrateContract(
      data.authority,
      Buffer.from(data.wasmByteCode).toString('base64'),
      data.instantiatePermission
        ? AccessConfig.fromProto(data.instantiatePermission)
        : undefined,
      data.contract,
      Buffer.from(data.msg).toString('base64')
    )
  }

  public toProto(): MsgStoreAndMigrateContract.Proto {
    const { authority, wasm_byte_code, instantiate_permission, contract, msg } =
      this

    return MsgStoreAndMigrateContract_pb.fromPartial({
      authority,
      wasmByteCode: Buffer.from(wasm_byte_code, 'base64'),
      instantiatePermission: instantiate_permission?.toProto(),
      contract,
      msg: Buffer.from(msg, 'base64'),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmwasm.wasm.v1.MsgStoreAndMigrateContract',
      value: MsgStoreAndMigrateContract_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgStoreAndMigrateContract {
    return MsgStoreAndMigrateContract.fromProto(
      MsgStoreAndMigrateContract_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgStoreAndMigrateContract {
  export interface Amino {
    type: 'wasm/MsgStoreAndMigrateContract'
    value: {
      authority: AccAddress
      wasm_byte_code: string
      instantiate_permission?: AccessConfig.Amino
      contract: AccAddress
      msg: JSON
    }
  }

  export interface Data {
    '@type': '/cosmwasm.wasm.v1.MsgStoreAndMigrateContract'
    authority: AccAddress
    wasm_byte_code: string
    instantiate_permission?: AccessConfig.Data
    contract: AccAddress
    msg: JSON
  }

  export type Proto = MsgStoreAndMigrateContract_pb
}
