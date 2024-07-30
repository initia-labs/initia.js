import { JSONSerializable } from '../../../util/json'
import { Coins } from '../../Coins'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgInstantiateContract2 as MsgInstantiateContract2_pb } from '@initia/initia.proto/cosmwasm/wasm/v1/tx'
import Long from 'long'

export class MsgInstantiateContractV2 extends JSONSerializable<
  MsgInstantiateContractV2.Amino,
  MsgInstantiateContractV2.Data,
  MsgInstantiateContractV2.Proto
> {
  public funds: Coins
  /**
   * @param sender the actor that signed the messages
   * @param admin an optional address that can execute migrations
   * @param code_id the reference to the stored WASM code
   * @param label optional metadata to be stored with a contract instance
   * @param msg json encoded message to be passed to the contract on instantiation
   * @param funds coins that are transferred to the contract on instantiation
   * @param salt an arbitrary value provided by the sender, can be 1 to 64
   * @param fix_msg include the msg value into the hash for the predictable address, default is false
   */
  constructor(
    public sender: AccAddress,
    public admin: AccAddress | undefined,
    public code_id: number,
    public label: string | undefined,
    public msg: string,
    funds: Coins.Input,
    public salt: string,
    public fix_msg: boolean
  ) {
    super()
    this.funds = new Coins(funds)
  }

  public static fromAmino(
    data: MsgInstantiateContractV2.Amino
  ): MsgInstantiateContractV2 {
    const {
      value: { sender, admin, code_id, label, msg, funds, salt, fix_msg },
    } = data

    return new MsgInstantiateContractV2(
      sender,
      admin,
      Number.parseInt(code_id),
      label,
      msg,
      Coins.fromAmino(funds),
      salt,
      fix_msg
    )
  }

  public toAmino(): MsgInstantiateContractV2.Amino {
    const { sender, admin, code_id, label, msg, funds, salt, fix_msg } = this
    return {
      type: 'wasm/MsgInstantiateContract2',
      value: {
        sender,
        admin,
        code_id: code_id.toString(),
        label,
        msg,
        funds: funds.toAmino(),
        salt,
        fix_msg,
      },
    }
  }

  public static fromData(
    data: MsgInstantiateContractV2.Data
  ): MsgInstantiateContractV2 {
    const { sender, admin, code_id, label, msg, funds, salt, fix_msg } = data
    return new MsgInstantiateContractV2(
      sender,
      admin,
      Number.parseInt(code_id),
      label,
      msg,
      Coins.fromData(funds),
      salt,
      fix_msg
    )
  }

  public toData(): MsgInstantiateContractV2.Data {
    const { sender, admin, code_id, label, msg, funds, salt, fix_msg } = this
    return {
      '@type': '/cosmwasm.wasm.v1.MsgInstantiateContract2',
      sender,
      admin,
      code_id: code_id.toString(),
      label,
      msg,
      funds: funds.toData(),
      salt,
      fix_msg,
    }
  }

  public static fromProto(
    data: MsgInstantiateContractV2.Proto
  ): MsgInstantiateContractV2 {
    return new MsgInstantiateContractV2(
      data.sender,
      data.admin,
      data.codeId.toNumber(),
      data.label,
      Buffer.from(data.msg).toString('base64'),
      Coins.fromProto(data.funds),
      Buffer.from(data.salt).toString('base64'),
      data.fixMsg
    )
  }

  public toProto(): MsgInstantiateContractV2.Proto {
    const { sender, admin, code_id, label, msg, funds, salt, fix_msg } = this
    return MsgInstantiateContract2_pb.fromPartial({
      sender,
      admin,
      codeId: Long.fromNumber(code_id),
      label,
      msg: Buffer.from(msg, 'base64'),
      funds: funds.toProto(),
      salt: Buffer.from(salt, 'base64'),
      fixMsg: fix_msg,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmwasm.wasm.v1.MsgInstantiateContract2',
      value: MsgInstantiateContract2_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgInstantiateContractV2 {
    return MsgInstantiateContractV2.fromProto(
      MsgInstantiateContract2_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgInstantiateContractV2 {
  export interface Amino {
    type: 'wasm/MsgInstantiateContract2'
    value: {
      sender: AccAddress
      admin?: AccAddress
      code_id: string
      label?: string
      msg: string
      funds: Coins.Amino
      salt: string
      fix_msg: boolean
    }
  }

  export interface Data {
    '@type': '/cosmwasm.wasm.v1.MsgInstantiateContract2'
    sender: AccAddress
    admin?: AccAddress
    code_id: string
    label?: string
    msg: string
    funds: Coins.Data
    salt: string
    fix_msg: boolean
  }

  export type Proto = MsgInstantiateContract2_pb
}
