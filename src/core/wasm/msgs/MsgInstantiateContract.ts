import { JSONSerializable } from '../../../util/json'
import { Coins } from '../../Coins'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgInstantiateContract as MsgInstantiateContract_pb } from '@initia/initia.proto/cosmwasm/wasm/v1/tx'

/**
 * MsgInstantiateContract creates a new smart contract instance for the given code id.
 */
export class MsgInstantiateContract extends JSONSerializable<
  MsgInstantiateContract.Amino,
  MsgInstantiateContract.Data,
  MsgInstantiateContract.Proto
> {
  public funds: Coins
  /**
   * @param sender the actor that signed the messages
   * @param admin an optional address that can execute migrations
   * @param code_id the reference to the stored WASM code
   * @param label optional metadata to be stored with a contract instance
   * @param msg json encoded message to be passed to the contract on instantiation
   * @param funds coins that are transferred to the contract on instantiation
   */
  constructor(
    public sender: AccAddress,
    public admin: AccAddress | undefined,
    public code_id: number,
    public label: string | undefined,
    public msg: string,
    funds: Coins.Input
  ) {
    super()
    this.funds = new Coins(funds)
  }

  public static fromAmino(
    data: MsgInstantiateContract.Amino
  ): MsgInstantiateContract {
    const {
      value: { sender, admin, code_id, label, msg, funds },
    } = data

    return new MsgInstantiateContract(
      sender,
      admin,
      parseInt(code_id),
      label,
      msg,
      Coins.fromAmino(funds)
    )
  }

  public toAmino(): MsgInstantiateContract.Amino {
    const { sender, admin, code_id, label, msg, funds } = this
    return {
      type: 'wasm/MsgInstantiateContract',
      value: {
        sender,
        admin,
        code_id: code_id.toFixed(),
        label,
        msg,
        funds: funds.toAmino(),
      },
    }
  }

  public static fromData(
    data: MsgInstantiateContract.Data
  ): MsgInstantiateContract {
    const { sender, admin, code_id, label, msg, funds } = data
    return new MsgInstantiateContract(
      sender,
      admin,
      parseInt(code_id),
      label,
      msg,
      Coins.fromData(funds)
    )
  }

  public toData(): MsgInstantiateContract.Data {
    const { sender, admin, code_id, label, msg, funds } = this
    return {
      '@type': '/cosmwasm.wasm.v1.MsgInstantiateContract',
      sender,
      admin,
      code_id: code_id.toFixed(),
      label,
      msg,
      funds: funds.toData(),
    }
  }

  public static fromProto(
    data: MsgInstantiateContract.Proto
  ): MsgInstantiateContract {
    return new MsgInstantiateContract(
      data.sender,
      data.admin,
      data.codeId.toNumber(),
      data.label,
      Buffer.from(data.msg).toString('base64'),
      Coins.fromProto(data.funds)
    )
  }

  public toProto(): MsgInstantiateContract.Proto {
    const { sender, admin, code_id, label, msg, funds } = this
    return MsgInstantiateContract_pb.fromPartial({
      sender,
      admin,
      codeId: code_id,
      label,
      msg: Buffer.from(msg, 'base64'),
      funds: funds.toProto(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmwasm.wasm.v1.MsgInstantiateContract',
      value: MsgInstantiateContract_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgInstantiateContract {
    return MsgInstantiateContract.fromProto(
      MsgInstantiateContract_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgInstantiateContract {
  export interface Amino {
    type: 'wasm/MsgInstantiateContract'
    value: {
      sender: AccAddress
      admin?: AccAddress
      code_id: string
      label?: string
      msg: string
      funds: Coins.Amino
    }
  }

  export interface Data {
    '@type': '/cosmwasm.wasm.v1.MsgInstantiateContract'
    sender: AccAddress
    admin?: AccAddress
    code_id: string
    label?: string
    msg: string
    funds: Coins.Data
  }

  export type Proto = MsgInstantiateContract_pb
}
