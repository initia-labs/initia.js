import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgSudoContract as MsgSudoContract_pb } from '@initia/initia.proto/cosmwasm/wasm/v1/tx'

/**
 * MsgSudoContract defines a governance operation for calling sudo
 * on a contract. The authority is defined in the keeper.
 */
export class MsgSudoContract extends JSONSerializable<
  MsgSudoContract.Amino,
  MsgSudoContract.Data,
  MsgSudoContract.Proto
> {
  /**
   * @param authority the address of the governance account
   * @param contract the address of the smart contract
   * @param msg json encoded message to be passed to the contract as sudo
   */
  constructor(
    public authority: AccAddress,
    public contract: AccAddress,
    public msg: string
  ) {
    super()
  }

  public static fromAmino(data: MsgSudoContract.Amino): MsgSudoContract {
    const {
      value: { authority, contract, msg },
    } = data
    return new MsgSudoContract(
      authority,
      contract,
      Buffer.from(JSON.stringify(msg)).toString('base64')
    )
  }

  public toAmino(): MsgSudoContract.Amino {
    const { authority, contract, msg } = this
    return {
      type: 'wasm/MsgSudoContract',
      value: {
        authority,
        contract,
        msg: JSON.parse(Buffer.from(msg, 'base64').toString()),
      },
    }
  }

  public static fromData(data: MsgSudoContract.Data): MsgSudoContract {
    const { authority, contract, msg } = data
    return new MsgSudoContract(
      authority,
      contract,
      Buffer.from(JSON.stringify(msg)).toString('base64')
    )
  }

  public toData(): MsgSudoContract.Data {
    const { authority, contract, msg } = this
    return {
      '@type': '/cosmwasm.wasm.v1.MsgSudoContract',
      authority,
      contract,
      msg: JSON.parse(Buffer.from(msg, 'base64').toString()),
    }
  }

  public static fromProto(data: MsgSudoContract.Proto): MsgSudoContract {
    return new MsgSudoContract(
      data.authority,
      data.contract,
      Buffer.from(data.msg).toString('base64')
    )
  }

  public toProto(): MsgSudoContract.Proto {
    const { authority, contract, msg } = this
    return MsgSudoContract_pb.fromPartial({
      authority,
      contract,
      msg: Buffer.from(msg, 'base64'),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmwasm.wasm.v1.MsgSudoContract',
      value: MsgSudoContract_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgSudoContract {
    return MsgSudoContract.fromProto(MsgSudoContract_pb.decode(msgAny.value))
  }
}

export namespace MsgSudoContract {
  export interface Amino {
    type: 'wasm/MsgSudoContract'
    value: {
      authority: AccAddress
      contract: AccAddress
      msg: JSON
    }
  }

  export interface Data {
    '@type': '/cosmwasm.wasm.v1.MsgSudoContract'
    authority: AccAddress
    contract: AccAddress
    msg: JSON
  }

  export type Proto = MsgSudoContract_pb
}
