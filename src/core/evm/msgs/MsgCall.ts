import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { AccessTuple } from '../AccessTuple'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgCall as MsgCall_pb } from '@initia/initia.proto/minievm/evm/v1/tx'

/**
 * MsgCall defines a method submitting Ethereum transactions.
 */
export class MsgCall extends JSONSerializable<
  MsgCall.Amino,
  MsgCall.Data,
  MsgCall.Proto
> {
  /**
   * @param sender the actor that signed the messages
   * @param contract_addr the contract address to be executed, can be cosmos address or hex encoded address
   * @param input hex encoded execution input bytes
   * @param value the amount of fee denom token to transfer to the contract
   * @param access_list predefined list of Ethereum addresses and their corresponding storage slots that a transaction will interact with during its execution
   */
  constructor(
    public sender: AccAddress,
    public contract_addr: AccAddress,
    public input: string,
    public value: string,
    public access_list: AccessTuple[]
  ) {
    super()
  }

  public static fromAmino(data: MsgCall.Amino): MsgCall {
    const {
      value: { sender, contract_addr, input, value, access_list },
    } = data

    return new MsgCall(
      sender,
      contract_addr,
      input,
      value,
      access_list.map(AccessTuple.fromAmino)
    )
  }

  public toAmino(): MsgCall.Amino {
    const { sender, contract_addr, input, value, access_list } = this
    return {
      type: 'evm/MsgCall',
      value: {
        sender,
        contract_addr,
        input,
        value,
        access_list: access_list.map((acc) => acc.toAmino()),
      },
    }
  }

  public static fromData(data: MsgCall.Data): MsgCall {
    const { sender, contract_addr, input, value, access_list } = data
    return new MsgCall(
      sender,
      contract_addr,
      input,
      value,
      access_list.map(AccessTuple.fromData)
    )
  }

  public toData(): MsgCall.Data {
    const { sender, contract_addr, input, value, access_list } = this
    return {
      '@type': '/minievm.evm.v1.MsgCall',
      sender,
      contract_addr,
      input,
      value,
      access_list: access_list.map((acc) => acc.toData()),
    }
  }

  public static fromProto(data: MsgCall.Proto): MsgCall {
    return new MsgCall(
      data.sender,
      data.contractAddr,
      data.input,
      data.value,
      data.accessList.map(AccessTuple.fromProto)
    )
  }

  public toProto(): MsgCall.Proto {
    const { sender, contract_addr, input, value, access_list } = this
    return MsgCall_pb.fromPartial({
      sender,
      contractAddr: contract_addr,
      input,
      value,
      accessList: access_list.map((acc) => acc.toProto()),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/minievm.evm.v1.MsgCall',
      value: MsgCall_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgCall {
    return MsgCall.fromProto(MsgCall_pb.decode(msgAny.value))
  }
}

export namespace MsgCall {
  export interface Amino {
    type: 'evm/MsgCall'
    value: {
      sender: AccAddress
      contract_addr: AccAddress
      input: string
      value: string
      access_list: AccessTuple.Amino[]
    }
  }

  export interface Data {
    '@type': '/minievm.evm.v1.MsgCall'
    sender: AccAddress
    contract_addr: AccAddress
    input: string
    value: string
    access_list: AccessTuple.Data[]
  }

  export type Proto = MsgCall_pb
}
