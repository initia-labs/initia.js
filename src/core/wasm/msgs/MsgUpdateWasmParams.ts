import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { WasmParams } from '../WasmParams'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgUpdateParams as MsgUpdateParams_pb } from '@initia/initia.proto/cosmwasm/wasm/v1/tx'

export class MsgUpdateWasmParams extends JSONSerializable<
  MsgUpdateWasmParams.Amino,
  MsgUpdateWasmParams.Data,
  MsgUpdateWasmParams.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param params the move parameters to update
   */
  constructor(
    public authority: AccAddress,
    public params: WasmParams
  ) {
    super()
  }

  public static fromAmino(
    data: MsgUpdateWasmParams.Amino
  ): MsgUpdateWasmParams {
    const {
      value: { authority, params },
    } = data
    return new MsgUpdateWasmParams(authority, WasmParams.fromAmino(params))
  }

  public toAmino(): MsgUpdateWasmParams.Amino {
    const { authority, params } = this
    return {
      type: 'wasm/MsgUpdateParams',
      value: {
        authority,
        params: params.toAmino(),
      },
    }
  }

  public static fromData(data: MsgUpdateWasmParams.Data): MsgUpdateWasmParams {
    const { authority, params } = data
    return new MsgUpdateWasmParams(authority, WasmParams.fromData(params))
  }

  public toData(): MsgUpdateWasmParams.Data {
    const { authority, params } = this
    return {
      '@type': '/cosmwasm.wasm.v1.MsgUpdateParams',
      authority,
      params: params.toData(),
    }
  }

  public static fromProto(
    data: MsgUpdateWasmParams.Proto
  ): MsgUpdateWasmParams {
    return new MsgUpdateWasmParams(
      data.authority,
      WasmParams.fromProto(data.params as WasmParams.Proto)
    )
  }

  public toProto(): MsgUpdateWasmParams.Proto {
    const { authority, params } = this
    return MsgUpdateParams_pb.fromPartial({
      authority,
      params: params.toProto(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmwasm.wasm.v1.MsgUpdateParams',
      value: MsgUpdateParams_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgUpdateWasmParams {
    return MsgUpdateWasmParams.fromProto(
      MsgUpdateParams_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgUpdateWasmParams {
  export interface Amino {
    type: 'wasm/MsgUpdateParams'
    value: {
      authority: AccAddress
      params: WasmParams.Amino
    }
  }

  export interface Data {
    '@type': '/cosmwasm.wasm.v1.MsgUpdateParams'
    authority: AccAddress
    params: WasmParams.Data
  }

  export type Proto = MsgUpdateParams_pb
}
