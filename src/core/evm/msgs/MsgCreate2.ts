import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgCreate2 as MsgCreate2_pb } from '@initia/initia.proto/minievm/evm/v1/tx'

/**
 * MsgCreate2 defines a method calling create2 of EVM.
 */
export class MsgCreate2 extends JSONSerializable<
  MsgCreate2.Amino,
  MsgCreate2.Data,
  MsgCreate2.Proto
> {
  /**
   * @param sender the actor that signed the messages
   * @param code hex encoded raw contract bytes code
   * @param salt random value to distinguish contract creation
   * @param value the amount of fee denom token to transfer to the contract
   */
  constructor(
    public sender: AccAddress,
    public code: string,
    public salt: number,
    public value: string
  ) {
    super()
  }

  public static fromAmino(data: MsgCreate2.Amino): MsgCreate2 {
    const {
      value: { sender, code, salt, value },
    } = data

    return new MsgCreate2(sender, code, parseInt(salt), value)
  }

  public toAmino(): MsgCreate2.Amino {
    const { sender, code, salt, value } = this
    return {
      type: 'evm/MsgCreate2',
      value: {
        sender,
        code,
        salt: salt.toFixed(),
        value,
      },
    }
  }

  public static fromData(data: MsgCreate2.Data): MsgCreate2 {
    const { sender, code, salt, value } = data
    return new MsgCreate2(sender, code, parseInt(salt), value)
  }

  public toData(): MsgCreate2.Data {
    const { sender, code, salt, value } = this
    return {
      '@type': '/minievm.evm.v1.MsgCreate2',
      sender,
      code,
      salt: salt.toFixed(),
      value,
    }
  }

  public static fromProto(data: MsgCreate2.Proto): MsgCreate2 {
    return new MsgCreate2(
      data.sender,
      data.code,
      data.salt.toNumber(),
      data.value
    )
  }

  public toProto(): MsgCreate2.Proto {
    const { sender, code, salt, value } = this
    return MsgCreate2_pb.fromPartial({
      sender,
      code,
      salt,
      value,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/minievm.evm.v1.MsgCreate2',
      value: MsgCreate2_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgCreate2 {
    return MsgCreate2.fromProto(MsgCreate2_pb.decode(msgAny.value))
  }
}

export namespace MsgCreate2 {
  export interface Amino {
    type: 'evm/MsgCreate2'
    value: {
      sender: AccAddress
      code: string
      salt: string
      value: string
    }
  }

  export interface Data {
    '@type': '/minievm.evm.v1.MsgCreate2'
    sender: AccAddress
    code: string
    salt: string
    value: string
  }

  export type Proto = MsgCreate2_pb
}
