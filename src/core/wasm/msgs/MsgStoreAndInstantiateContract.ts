import { JSONSerializable } from '../../../util/json'
import { Coins } from '../../Coins'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgStoreAndInstantiateContract as MsgStoreAndInstantiateContract_pb } from '@initia/initia.proto/cosmwasm/wasm/v1/tx'
import { AccessConfig } from '../AccessConfig'

/**
 * MsgStoreAndInstantiateContract defines a governance operation for storing
 * and instantiating the contract. The authority is defined in the keeper.
 */
export class MsgStoreAndInstantiateContract extends JSONSerializable<
  MsgStoreAndInstantiateContract.Amino,
  MsgStoreAndInstantiateContract.Data,
  MsgStoreAndInstantiateContract.Proto
> {
  public funds: Coins
  /**
   * @param authority the address of the governance account
   * @param wasm_byte_code can be raw or gzip compressed
   * @param instantiate_permission access control to apply on contract creation, optional
   * @param unpin_code code on upload, optional; as default the uploaded contract is pinned to cache
   * @param admin an optional address that can execute migrations
   * @param label optional metadata to be stored with a contract instance
   * @param msg json encoded message to be passed to the contract on instantiation
   * @param funds coins that are transferred from the authority account to the contract on instantiation
   * @param source the URL where the code is hosted
   * @param builder the docker image used to build the code deterministically, used for smart contract verification
   * @param code_hash the SHA256 sum of the code outputted by builder, used for smart contract verification
   */
  constructor(
    public authority: AccAddress,
    public wasm_byte_code: string,
    public instantiate_permission: AccessConfig | undefined,
    public unpin_code: boolean | undefined,
    public admin: AccAddress | undefined,
    public label: string | undefined,
    public msg: string,
    funds: Coins.Input,
    public source: string,
    public builder: string,
    public code_hash: string
  ) {
    super()
    this.funds = new Coins(funds)
  }

  public static fromAmino(
    data: MsgStoreAndInstantiateContract.Amino
  ): MsgStoreAndInstantiateContract {
    const {
      value: {
        authority,
        wasm_byte_code,
        instantiate_permission,
        unpin_code,
        admin,
        label,
        msg,
        funds,
        source,
        builder,
        code_hash,
      },
    } = data

    return new MsgStoreAndInstantiateContract(
      authority,
      wasm_byte_code,
      instantiate_permission
        ? AccessConfig.fromAmino(instantiate_permission)
        : undefined,
      unpin_code,
      admin,
      label,
      Buffer.from(JSON.stringify(msg)).toString('base64'),
      Coins.fromAmino(funds),
      source,
      builder,
      code_hash
    )
  }

  public toAmino(): MsgStoreAndInstantiateContract.Amino {
    const {
      authority,
      wasm_byte_code,
      instantiate_permission,
      unpin_code,
      admin,
      label,
      msg,
      funds,
      source,
      builder,
      code_hash,
    } = this

    return {
      type: 'wasm/MsgStoreAndInstantiateContract',
      value: {
        authority,
        wasm_byte_code,
        instantiate_permission: instantiate_permission?.toAmino(),
        unpin_code,
        admin,
        label,
        msg: JSON.parse(Buffer.from(msg, 'base64').toString()),
        funds: funds.toAmino(),
        source,
        builder,
        code_hash,
      },
    }
  }

  public static fromData(
    data: MsgStoreAndInstantiateContract.Data
  ): MsgStoreAndInstantiateContract {
    const {
      authority,
      wasm_byte_code,
      instantiate_permission,
      unpin_code,
      admin,
      label,
      msg,
      funds,
      source,
      builder,
      code_hash,
    } = data

    return new MsgStoreAndInstantiateContract(
      authority,
      wasm_byte_code,
      instantiate_permission
        ? AccessConfig.fromData(instantiate_permission)
        : undefined,
      unpin_code,
      admin,
      label,
      Buffer.from(JSON.stringify(msg)).toString('base64'),
      Coins.fromData(funds),
      source,
      builder,
      code_hash
    )
  }

  public toData(): MsgStoreAndInstantiateContract.Data {
    const {
      authority,
      wasm_byte_code,
      instantiate_permission,
      unpin_code,
      admin,
      label,
      msg,
      funds,
      source,
      builder,
      code_hash,
    } = this

    return {
      '@type': '/cosmwasm.wasm.v1.MsgStoreAndInstantiateContract',
      authority,
      wasm_byte_code,
      instantiate_permission: instantiate_permission?.toData(),
      unpin_code,
      admin,
      label,
      msg: JSON.parse(Buffer.from(msg, 'base64').toString()),
      funds: funds.toData(),
      source,
      builder,
      code_hash,
    }
  }

  public static fromProto(
    data: MsgStoreAndInstantiateContract.Proto
  ): MsgStoreAndInstantiateContract {
    return new MsgStoreAndInstantiateContract(
      data.authority,
      Buffer.from(data.wasmByteCode).toString('base64'),
      data.instantiatePermission
        ? AccessConfig.fromProto(data.instantiatePermission)
        : undefined,
      data.unpinCode,
      data.admin,
      data.label,
      Buffer.from(data.msg).toString('base64'),
      Coins.fromProto(data.funds),
      data.source,
      data.builder,
      Buffer.from(data.codeHash).toString('base64')
    )
  }

  public toProto(): MsgStoreAndInstantiateContract.Proto {
    const {
      authority,
      wasm_byte_code,
      instantiate_permission,
      unpin_code,
      admin,
      label,
      msg,
      funds,
      source,
      builder,
      code_hash,
    } = this

    return MsgStoreAndInstantiateContract_pb.fromPartial({
      authority,
      wasmByteCode: Buffer.from(wasm_byte_code, 'base64'),
      instantiatePermission: instantiate_permission?.toProto(),
      unpinCode: unpin_code,
      admin,
      label,
      msg: Buffer.from(msg, 'base64'),
      funds: funds.toProto(),
      source,
      builder,
      codeHash: Buffer.from(code_hash, 'base64'),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmwasm.wasm.v1.MsgStoreAndInstantiateContract',
      value: MsgStoreAndInstantiateContract_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgStoreAndInstantiateContract {
    return MsgStoreAndInstantiateContract.fromProto(
      MsgStoreAndInstantiateContract_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgStoreAndInstantiateContract {
  export interface Amino {
    type: 'wasm/MsgStoreAndInstantiateContract'
    value: {
      authority: AccAddress
      wasm_byte_code: string
      instantiate_permission?: AccessConfig.Amino
      unpin_code?: boolean
      admin?: AccAddress
      label?: string
      msg: JSON
      funds: Coins.Amino
      source: string
      builder: string
      code_hash: string
    }
  }

  export interface Data {
    '@type': '/cosmwasm.wasm.v1.MsgStoreAndInstantiateContract'
    authority: AccAddress
    wasm_byte_code: string
    instantiate_permission?: AccessConfig.Data
    unpin_code?: boolean
    admin?: AccAddress
    label?: string
    msg: JSON
    funds: Coins.Amino
    source: string
    builder: string
    code_hash: string
  }

  export type Proto = MsgStoreAndInstantiateContract_pb
}
