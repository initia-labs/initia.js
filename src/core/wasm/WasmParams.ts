import { JSONSerializable } from '../../util/json'
import {
  Params as Params_pb,
  accessTypeFromJSON,
  accessTypeToJSON,
} from '@initia/initia.proto/cosmwasm/wasm/v1/types'
import { AccessConfig } from './AccessConfig'

/**
 * WasmParams defines the set of wasm parameters.
 */
export class WasmParams extends JSONSerializable<
  WasmParams.Amino,
  WasmParams.Data,
  WasmParams.Proto
> {
  /**
   * @param code_upload_access
   * @param instantiate_default_permission
   */
  constructor(
    public code_upload_access: AccessConfig,
    public instantiate_default_permission: AccessConfig.Type
  ) {
    super()
  }

  public static fromAmino(data: WasmParams.Amino): WasmParams {
    const {
      value: { code_upload_access, instantiate_default_permission },
    } = data

    return new WasmParams(
      AccessConfig.fromAmino(code_upload_access),
      accessTypeFromJSON(instantiate_default_permission)
    )
  }

  public toAmino(): WasmParams.Amino {
    const { code_upload_access, instantiate_default_permission } = this

    return {
      type: 'wasm/Params',
      value: {
        code_upload_access: code_upload_access.toAmino(),
        instantiate_default_permission: accessTypeToJSON(
          instantiate_default_permission
        ),
      },
    }
  }

  public static fromData(data: WasmParams.Data): WasmParams {
    const { code_upload_access, instantiate_default_permission } = data

    return new WasmParams(
      AccessConfig.fromData(code_upload_access),
      accessTypeFromJSON(instantiate_default_permission)
    )
  }

  public toData(): WasmParams.Data {
    const { code_upload_access, instantiate_default_permission } = this

    return {
      '@type': '/cosmwasm.wasm.v1.Params',
      code_upload_access: code_upload_access.toData(),
      instantiate_default_permission: accessTypeToJSON(
        instantiate_default_permission
      ),
    }
  }

  public static fromProto(data: WasmParams.Proto): WasmParams {
    return new WasmParams(
      AccessConfig.fromProto(data.codeUploadAccess as AccessConfig.Proto),
      data.instantiateDefaultPermission
    )
  }

  public toProto(): WasmParams.Proto {
    const { code_upload_access, instantiate_default_permission } = this

    return Params_pb.fromPartial({
      codeUploadAccess: code_upload_access.toProto(),
      instantiateDefaultPermission: instantiate_default_permission,
    })
  }
}

export namespace WasmParams {
  export interface Amino {
    type: 'wasm/Params'
    value: {
      code_upload_access: AccessConfig.Amino
      instantiate_default_permission: string
    }
  }

  export interface Data {
    '@type': '/cosmwasm.wasm.v1.Params'
    code_upload_access: AccessConfig.Data
    instantiate_default_permission: string
  }

  export type Proto = Params_pb
}
