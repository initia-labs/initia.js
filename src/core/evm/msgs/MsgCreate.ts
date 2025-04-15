import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { AccessTuple } from '../AccessTuple'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgCreate as MsgCreate_pb } from '@initia/initia.proto/minievm/evm/v1/tx'

/**
 * MsgCreate defines a method calling create of EVM.
 */
export class MsgCreate extends JSONSerializable<
  MsgCreate.Amino,
  MsgCreate.Data,
  MsgCreate.Proto
> {
  /**
   * @param sender the actor that signed the messages
   * @param code hex encoded raw contract bytes code
   * @param value the amount of fee denom token to transfer to the contract
   * @param access_list predefined list of Ethereum addresses and their corresponding storage slots that a transaction will interact with during its execution
   */
  constructor(
    public sender: AccAddress,
    public code: string,
    public value: string,
    public access_list: AccessTuple[]
  ) {
    super()
  }

  public static fromAmino(data: MsgCreate.Amino): MsgCreate {
    const {
      value: { sender, code, value, access_list },
    } = data

    return new MsgCreate(
      sender,
      code,
      value,
      access_list?.map(AccessTuple.fromAmino) ?? []
    )
  }

  public toAmino(): MsgCreate.Amino {
    const { sender, code, value, access_list } = this
    return {
      type: 'evm/MsgCreate',
      value: {
        sender,
        code,
        value,
        access_list:
          access_list.length > 0
            ? access_list.map((acc) => acc.toAmino())
            : null,
      },
    }
  }

  public static fromData(data: MsgCreate.Data): MsgCreate {
    const { sender, code, value, access_list } = data
    return new MsgCreate(
      sender,
      code,
      value,
      access_list.map(AccessTuple.fromData)
    )
  }

  public toData(): MsgCreate.Data {
    const { sender, code, value, access_list } = this
    return {
      '@type': '/minievm.evm.v1.MsgCreate',
      sender,
      code,
      value,
      access_list: access_list.map((acc) => acc.toData()),
    }
  }

  public static fromProto(data: MsgCreate.Proto): MsgCreate {
    return new MsgCreate(
      data.sender,
      data.code,
      data.value,
      data.accessList.map(AccessTuple.fromProto)
    )
  }

  public toProto(): MsgCreate.Proto {
    const { sender, code, value, access_list } = this
    return MsgCreate_pb.fromPartial({
      sender,
      code,
      value,
      accessList: access_list.map((acc) => acc.toProto()),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/minievm.evm.v1.MsgCreate',
      value: MsgCreate_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgCreate {
    return MsgCreate.fromProto(MsgCreate_pb.decode(msgAny.value))
  }
}

export namespace MsgCreate {
  export interface Amino {
    type: 'evm/MsgCreate'
    value: {
      sender: AccAddress
      code: string
      value: string
      access_list: AccessTuple.Amino[] | null
    }
  }

  export interface Data {
    '@type': '/minievm.evm.v1.MsgCreate'
    sender: AccAddress
    code: string
    value: string
    access_list: AccessTuple.Data[]
  }

  export type Proto = MsgCreate_pb
}
