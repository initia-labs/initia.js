import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgUpdateMaxWasmSize as MsgUpdateMaxWasmSize_pb } from '@initia/initia.proto/cosmwasm/wasm/v1/tx'

/**
 * MsgUpdateMaxWasmSize defines a governance operation for updating the max_wasm_size parameter.
 */
export class MsgUpdateMaxWasmSize extends JSONSerializable<
  MsgUpdateMaxWasmSize.Amino,
  MsgUpdateMaxWasmSize.Data,
  MsgUpdateMaxWasmSize.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param max_wasm_size the maximum size of the wasm bytecode in bytes
   */
  constructor(
    public authority: AccAddress,
    public max_wasm_size: number
  ) {
    super()
  }

  public static fromAmino(
    data: MsgUpdateMaxWasmSize.Amino
  ): MsgUpdateMaxWasmSize {
    const {
      value: { authority, max_wasm_size },
    } = data
    return new MsgUpdateMaxWasmSize(authority, parseInt(max_wasm_size))
  }

  public toAmino(): MsgUpdateMaxWasmSize.Amino {
    const { authority, max_wasm_size } = this
    return {
      type: 'wasm/MsgUpdateMaxWasmSize',
      value: {
        authority,
        max_wasm_size: max_wasm_size.toFixed(),
      },
    }
  }

  public static fromData(
    data: MsgUpdateMaxWasmSize.Data
  ): MsgUpdateMaxWasmSize {
    const { authority, max_wasm_size } = data
    return new MsgUpdateMaxWasmSize(authority, parseInt(max_wasm_size))
  }

  public toData(): MsgUpdateMaxWasmSize.Data {
    const { authority, max_wasm_size } = this
    return {
      '@type': '/cosmwasm.wasm.v1.MsgUpdateMaxWasmSize',
      authority,
      max_wasm_size: max_wasm_size.toFixed(),
    }
  }

  public static fromProto(
    data: MsgUpdateMaxWasmSize.Proto
  ): MsgUpdateMaxWasmSize {
    return new MsgUpdateMaxWasmSize(data.authority, Number(data.maxWasmSize))
  }

  public toProto(): MsgUpdateMaxWasmSize.Proto {
    const { authority, max_wasm_size } = this
    return MsgUpdateMaxWasmSize_pb.fromPartial({
      authority,
      maxWasmSize: BigInt(max_wasm_size),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmwasm.wasm.v1.MsgUpdateMaxWasmSize',
      value: MsgUpdateMaxWasmSize_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgUpdateMaxWasmSize {
    return MsgUpdateMaxWasmSize.fromProto(
      MsgUpdateMaxWasmSize_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgUpdateMaxWasmSize {
  export interface Amino {
    type: 'wasm/MsgUpdateMaxWasmSize'
    value: {
      authority: AccAddress
      max_wasm_size: string
    }
  }

  export interface Data {
    '@type': '/cosmwasm.wasm.v1.MsgUpdateMaxWasmSize'
    authority: AccAddress
    max_wasm_size: string
  }

  export type Proto = MsgUpdateMaxWasmSize_pb
}
