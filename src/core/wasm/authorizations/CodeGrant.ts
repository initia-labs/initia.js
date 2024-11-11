import { JSONSerializable } from '../../../util/json'
import { CodeGrant as CodeGrant_pb } from '@initia/initia.proto/cosmwasm/wasm/v1/authz'
import { AccessConfig } from '../AccessConfig'

/**
 * CodeGrant is a granted permission for a single code.
 */
export class CodeGrant extends JSONSerializable<
  CodeGrant.Amino,
  CodeGrant.Data,
  CodeGrant.Proto
> {
  /**
   * @param code_hash the unique identifier created by wasmvm (wildcard "*" is used to specify any kind of grant)
   * @param instantiate_permission the superset access control to apply on contract creation (optional)
   */
  constructor(
    public code_hash: string,
    public instantiate_permission?: AccessConfig
  ) {
    super()
  }

  public static fromAmino(data: CodeGrant.Amino): CodeGrant {
    const { code_hash, instantiate_permission } = data
    return new CodeGrant(
      code_hash,
      instantiate_permission
        ? AccessConfig.fromAmino(instantiate_permission)
        : undefined
    )
  }

  public toAmino(): CodeGrant.Amino {
    const { code_hash, instantiate_permission } = this
    return {
      code_hash,
      instantiate_permission: instantiate_permission?.toAmino(),
    }
  }

  public static fromData(data: CodeGrant.Data): CodeGrant {
    const { code_hash, instantiate_permission } = data
    return new CodeGrant(
      code_hash,
      instantiate_permission
        ? AccessConfig.fromData(instantiate_permission)
        : undefined
    )
  }

  public toData(): CodeGrant.Data {
    const { code_hash, instantiate_permission } = this
    return {
      code_hash,
      instantiate_permission: instantiate_permission?.toData(),
    }
  }

  public static fromProto(data: CodeGrant.Proto): CodeGrant {
    return new CodeGrant(
      Buffer.from(data.codeHash).toString('base64'),
      data.instantiatePermission
        ? AccessConfig.fromProto(data.instantiatePermission)
        : undefined
    )
  }

  public toProto(): CodeGrant.Proto {
    const { code_hash, instantiate_permission } = this
    return CodeGrant_pb.fromPartial({
      codeHash: Buffer.from(code_hash, 'base64'),
      instantiatePermission: instantiate_permission?.toProto(),
    })
  }
}

export namespace CodeGrant {
  export interface Amino {
    code_hash: string
    instantiate_permission?: AccessConfig.Amino
  }

  export interface Data {
    code_hash: string
    instantiate_permission?: AccessConfig.Data
  }

  export type Proto = CodeGrant_pb
}
