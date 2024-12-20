import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
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
   */
  constructor(
    public sender: AccAddress,
    public contract_addr: AccAddress,
    public input: string,
    public value: string
  ) {
    super()
  }

  public static fromAmino(data: MsgCall.Amino): MsgCall {
    const {
      value: { sender, contract_addr, input, value },
    } = data

    return new MsgCall(sender, contract_addr, input, value)
  }

  public toAmino(): MsgCall.Amino {
    const { sender, contract_addr, input, value } = this
    return {
      type: 'evm/MsgCall',
      value: {
        sender,
        contract_addr,
        input,
        value,
      },
    }
  }

  public static fromData(data: MsgCall.Data): MsgCall {
    const { sender, contract_addr, input, value } = data
    return new MsgCall(sender, contract_addr, input, value)
  }

  public toData(): MsgCall.Data {
    const { sender, contract_addr, input, value } = this
    return {
      '@type': '/minievm.evm.v1.MsgCall',
      sender,
      contract_addr,
      input,
      value,
    }
  }

  public static fromProto(data: MsgCall.Proto): MsgCall {
    return new MsgCall(data.sender, data.contractAddr, data.input, data.value)
  }

  public toProto(): MsgCall.Proto {
    const { sender, contract_addr, input, value } = this
    return MsgCall_pb.fromPartial({
      sender,
      contractAddr: contract_addr,
      input,
      value,
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
    }
  }

  export interface Data {
    '@type': '/minievm.evm.v1.MsgCall'
    sender: AccAddress
    contract_addr: AccAddress
    input: string
    value: string
  }

  export type Proto = MsgCall_pb
}
