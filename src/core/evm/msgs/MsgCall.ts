import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { AccessTuple } from '../AccessTuple'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgCall as MsgCall_pb } from '@initia/initia.proto/minievm/evm/v1/tx'
import { SetCodeAuthorization } from '../SetCodeAuthorization'

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
   * @param auth_list list of authorizations that allow code deployment at specific addresses
   */
  constructor(
    public sender: AccAddress,
    public contract_addr: AccAddress,
    public input: string,
    public value: string,
    public access_list: AccessTuple[],
    public auth_list?: SetCodeAuthorization[]
  ) {
    super()
  }

  public static fromAmino(data: MsgCall.Amino): MsgCall {
    const {
      value: { sender, contract_addr, input, value, access_list, auth_list },
    } = data

    return new MsgCall(
      sender,
      contract_addr,
      input,
      value,
      access_list?.map(AccessTuple.fromAmino) ?? [],
      auth_list?.map(SetCodeAuthorization.fromAmino)
    )
  }

  public toAmino(): MsgCall.Amino {
    const { sender, contract_addr, input, value, access_list, auth_list } = this
    return {
      type: 'evm/MsgCall',
      value: {
        sender,
        contract_addr,
        input,
        value,
        access_list:
          access_list.length > 0
            ? access_list.map((acc) => acc.toAmino())
            : null,
        auth_list: auth_list?.map((auth) => auth.toAmino()),
      },
    }
  }

  public static fromData(data: MsgCall.Data): MsgCall {
    const { sender, contract_addr, input, value, access_list, auth_list } = data
    return new MsgCall(
      sender,
      contract_addr,
      input,
      value,
      access_list.map(AccessTuple.fromData),
      auth_list?.map(SetCodeAuthorization.fromData)
    )
  }

  public toData(): MsgCall.Data {
    const { sender, contract_addr, input, value, access_list, auth_list } = this
    return {
      '@type': '/minievm.evm.v1.MsgCall',
      sender,
      contract_addr,
      input,
      value,
      access_list: access_list.map((acc) => acc.toData()),
      auth_list: auth_list?.map((auth) => auth.toData()),
    }
  }

  public static fromProto(data: MsgCall.Proto): MsgCall {
    return new MsgCall(
      data.sender,
      data.contractAddr,
      data.input,
      data.value,
      data.accessList.map(AccessTuple.fromProto),
      data.authList?.map(SetCodeAuthorization.fromProto)
    )
  }

  public toProto(): MsgCall.Proto {
    const { sender, contract_addr, input, value, access_list, auth_list } = this
    return MsgCall_pb.fromPartial({
      sender,
      contractAddr: contract_addr,
      input,
      value,
      accessList: access_list.map((acc) => acc.toProto()),
      authList: auth_list?.map((auth) => auth.toProto()),
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
      access_list: AccessTuple.Amino[] | null
      auth_list?: SetCodeAuthorization.Amino[]
    }
  }

  export interface Data {
    '@type': '/minievm.evm.v1.MsgCall'
    sender: AccAddress
    contract_addr: AccAddress
    input: string
    value: string
    access_list: AccessTuple.Data[]
    auth_list?: SetCodeAuthorization.Data[]
  }

  export type Proto = MsgCall_pb
}
