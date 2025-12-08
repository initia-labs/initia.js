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
   * @param max_wasm_size
   */
  constructor(
    public code_upload_access: AccessConfig,
    public instantiate_default_permission: AccessConfig.Type,
    public max_wasm_size: number
  ) {
    super()
  }

  public static fromAmino(data: WasmParams.Amino): WasmParams {
    const {
      value: {
        code_upload_access,
        instantiate_default_permission,
        max_wasm_size,
      },
    } = data

    return new WasmParams(
      AccessConfig.fromAmino(code_upload_access),
      accessTypeFromJSON(instantiate_default_permission),
      parseInt(max_wasm_size)
    )
  }

  public toAmino(): WasmParams.Amino {
    const {
      code_upload_access,
      instantiate_default_permission,
      max_wasm_size,
    } = this

    return {
      type: 'wasm/Params',
      value: {
        code_upload_access: code_upload_access.toAmino(),
        instantiate_default_permission: accessTypeToJSON(
          instantiate_default_permission
        ),
        max_wasm_size: max_wasm_size.toFixed(),
      },
    }
  }

  public static fromData(data: WasmParams.Data): WasmParams {
    const {
      code_upload_access,
      instantiate_default_permission,
      max_wasm_size,
    } = data

    return new WasmParams(
      AccessConfig.fromData(code_upload_access),
      accessTypeFromJSON(instantiate_default_permission),
      parseInt(max_wasm_size)
    )
  }

  public toData(): WasmParams.Data {
    const {
      code_upload_access,
      instantiate_default_permission,
      max_wasm_size,
    } = this

    return {
      '@type': '/cosmwasm.wasm.v1.Params',
      code_upload_access: code_upload_access.toData(),
      instantiate_default_permission: accessTypeToJSON(
        instantiate_default_permission
      ),
      max_wasm_size: max_wasm_size.toFixed(),
    }
  }

  public static fromProto(data: WasmParams.Proto): WasmParams {
    return new WasmParams(
      AccessConfig.fromProto(data.codeUploadAccess as AccessConfig.Proto),
      data.instantiateDefaultPermission,
      Number(data.maxWasmSize)
    )
  }

  public toProto(): WasmParams.Proto {
    const {
      code_upload_access,
      instantiate_default_permission,
      max_wasm_size,
    } = this

    return Params_pb.fromPartial({
      codeUploadAccess: code_upload_access.toProto(),
      instantiateDefaultPermission: instantiate_default_permission,
      maxWasmSize: BigInt(max_wasm_size),
    })
  }
}

export namespace WasmParams {
  export interface Amino {
    type: 'wasm/Params'
    value: {
      code_upload_access: AccessConfig.Amino
      instantiate_default_permission: string
      max_wasm_size: string
    }
  }

  export interface Data {
    '@type': '/cosmwasm.wasm.v1.Params'
    code_upload_access: AccessConfig.Data
    instantiate_default_permission: string
    max_wasm_size: string
  }

  export type Proto = Params_pb
}
