import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgMigrateContract as MsgMigrateContract_pb } from '@initia/initia.proto/cosmwasm/wasm/v1/tx'

/**
 * MsgMigrateContract runs a code upgrade/ downgrade for a smart contract.
 */
export class MsgMigrateContract extends JSONSerializable<
  MsgMigrateContract.Amino,
  MsgMigrateContract.Data,
  MsgMigrateContract.Proto
> {
  /**
   * @param sender the actor that signed the messages
   * @param contract the address of the smart contract
   * @param code_id references the new WASM code
   * @param msg json encoded message to be passed to the contract on migration
   */
  constructor(
    public sender: AccAddress,
    public contract: AccAddress,
    public code_id: number,
    public msg: string
  ) {
    super()
  }

  public static fromAmino(data: MsgMigrateContract.Amino): MsgMigrateContract {
    const {
      value: { sender, contract, code_id, msg },
    } = data

    return new MsgMigrateContract(
      sender,
      contract,
      parseInt(code_id),
      Buffer.from(JSON.stringify(msg)).toString('base64')
    )
  }

  public toAmino(): MsgMigrateContract.Amino {
    const { sender, contract, code_id, msg } = this
    return {
      type: 'wasm/MsgMigrateContract',
      value: {
        sender,
        contract,
        code_id: code_id.toFixed(),
        msg: JSON.parse(Buffer.from(msg, 'base64').toString()),
      },
    }
  }

  public static fromData(data: MsgMigrateContract.Data): MsgMigrateContract {
    const { sender, contract, code_id, msg } = data

    return new MsgMigrateContract(
      sender,
      contract,
      parseInt(code_id),
      Buffer.from(JSON.stringify(msg)).toString('base64')
    )
  }

  public toData(): MsgMigrateContract.Data {
    const { sender, contract, code_id, msg } = this
    return {
      '@type': '/cosmwasm.wasm.v1.MsgMigrateContract',
      sender,
      contract,
      code_id: code_id.toFixed(),
      msg: JSON.parse(Buffer.from(msg, 'base64').toString()),
    }
  }

  public static fromProto(data: MsgMigrateContract.Proto): MsgMigrateContract {
    return new MsgMigrateContract(
      data.sender,
      data.contract,
      Number(data.codeId),
      Buffer.from(data.msg).toString('base64')
    )
  }

  public toProto(): MsgMigrateContract.Proto {
    const { sender, contract, code_id, msg } = this
    return MsgMigrateContract_pb.fromPartial({
      sender,
      contract,
      codeId: BigInt(code_id),
      msg: Buffer.from(msg, 'base64'),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmwasm.wasm.v1.MsgMigrateContract',
      value: MsgMigrateContract_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgMigrateContract {
    return MsgMigrateContract.fromProto(
      MsgMigrateContract_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgMigrateContract {
  export interface Amino {
    type: 'wasm/MsgMigrateContract'
    value: {
      sender: AccAddress
      contract: AccAddress
      code_id: string
      msg: JSON
    }
  }

  export interface Data {
    '@type': '/cosmwasm.wasm.v1.MsgMigrateContract'
    sender: AccAddress
    contract: AccAddress
    code_id: string
    msg: JSON
  }

  export type Proto = MsgMigrateContract_pb
}
