import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { AccessTuple } from '../AccessTuple'
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
   * @param access_list predefined list of Ethereum addresses and their corresponding storage slots that a transaction will interact with during its execution
   */
  constructor(
    public sender: AccAddress,
    public code: string,
    public salt: number,
    public value: string,
    public access_list: AccessTuple[]
  ) {
    super()
  }

  public static fromAmino(data: MsgCreate2.Amino): MsgCreate2 {
    const {
      value: { sender, code, salt, value, access_list },
    } = data

    return new MsgCreate2(
      sender,
      code,
      parseInt(salt),
      value,
      access_list?.map(AccessTuple.fromAmino) ?? []
    )
  }

  public toAmino(): MsgCreate2.Amino {
    const { sender, code, salt, value, access_list } = this
    return {
      type: 'evm/MsgCreate2',
      value: {
        sender,
        code,
        salt: salt.toFixed(),
        value,
        access_list:
          access_list.length > 0
            ? access_list.map((acc) => acc.toAmino())
            : null,
      },
    }
  }

  public static fromData(data: MsgCreate2.Data): MsgCreate2 {
    const { sender, code, salt, value, access_list } = data
    return new MsgCreate2(
      sender,
      code,
      parseInt(salt),
      value,
      access_list.map(AccessTuple.fromData)
    )
  }

  public toData(): MsgCreate2.Data {
    const { sender, code, salt, value, access_list } = this
    return {
      '@type': '/minievm.evm.v1.MsgCreate2',
      sender,
      code,
      salt: salt.toFixed(),
      value,
      access_list: access_list.map((acc) => acc.toData()),
    }
  }

  public static fromProto(data: MsgCreate2.Proto): MsgCreate2 {
    return new MsgCreate2(
      data.sender,
      data.code,
      Number(data.salt),
      data.value,
      data.accessList.map(AccessTuple.fromProto)
    )
  }

  public toProto(): MsgCreate2.Proto {
    const { sender, code, salt, value, access_list } = this
    return MsgCreate2_pb.fromPartial({
      sender,
      code,
      salt: BigInt(salt),
      value,
      accessList: access_list.map((acc) => acc.toProto()),
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
      access_list: AccessTuple.Amino[] | null
    }
  }

  export interface Data {
    '@type': '/minievm.evm.v1.MsgCreate2'
    sender: AccAddress
    code: string
    salt: string
    value: string
    access_list: AccessTuple.Data[]
  }

  export type Proto = MsgCreate2_pb
}
