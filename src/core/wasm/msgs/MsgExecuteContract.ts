import { JSONSerializable } from '../../../util/json';
import { Coins } from '../../Coins';
import { AccAddress } from '../../bech32';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgExecuteContract as MsgExecuteContract_pb } from '@initia/initia.proto/cosmwasm/wasm/v1/tx';

export class MsgExecuteContract extends JSONSerializable<
  MsgExecuteContract.Amino,
  MsgExecuteContract.Data,
  MsgExecuteContract.Proto
> {
  public funds: Coins;
  /**
   * @param sender the actor that signed the messages
   * @param contract the address of the smart contract
   * @param msg json encoded message to be passed to the contract
   * @param funds coins that are transferred to the contract on execution
   */
  constructor(
    public sender: AccAddress,
    public contract: AccAddress,
    public msg: string,
    funds: Coins.Input
  ) {
    super();
    this.funds = new Coins(funds);
  }

  public static fromAmino(data: MsgExecuteContract.Amino): MsgExecuteContract {
    const {
      value: { sender, contract, msg, funds },
    } = data;

    return new MsgExecuteContract(
      sender,
      contract,
      msg,
      Coins.fromAmino(funds)
    );
  }

  public toAmino(): MsgExecuteContract.Amino {
    const { sender, contract, msg, funds } = this;
    return {
      type: 'wasm/MsgExecuteContract',
      value: {
        sender,
        contract,
        msg,
        funds: funds.toAmino(),
      },
    };
  }

  public static fromData(data: MsgExecuteContract.Data): MsgExecuteContract {
    const { sender, contract, msg, funds } = data;
    return new MsgExecuteContract(sender, contract, msg, Coins.fromData(funds));
  }

  public toData(): MsgExecuteContract.Data {
    const { sender, contract, msg, funds } = this;
    return {
      '@type': '/cosmwasm.wasm.v1.MsgExecuteContract',
      sender,
      contract,
      msg,
      funds: funds.toData(),
    };
  }

  public static fromProto(data: MsgExecuteContract.Proto): MsgExecuteContract {
    return new MsgExecuteContract(
      data.sender,
      data.contract,
      Buffer.from(data.msg).toString('base64'),
      Coins.fromProto(data.funds)
    );
  }

  public toProto(): MsgExecuteContract.Proto {
    const { sender, contract, msg, funds } = this;
    return MsgExecuteContract_pb.fromPartial({
      sender,
      contract,
      msg: Buffer.from(msg, 'base64'),
      funds: funds.toProto(),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
      value: MsgExecuteContract_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgExecuteContract {
    return MsgExecuteContract.fromProto(
      MsgExecuteContract_pb.decode(msgAny.value)
    );
  }
}

export namespace MsgExecuteContract {
  export interface Amino {
    type: 'wasm/MsgExecuteContract';
    value: {
      sender: AccAddress;
      contract: AccAddress;
      msg: string;
      funds: Coins.Amino;
    };
  }

  export interface Data {
    '@type': '/cosmwasm.wasm.v1.MsgExecuteContract';
    sender: AccAddress;
    contract: AccAddress;
    msg: string;
    funds: Coins.Data;
  }

  export type Proto = MsgExecuteContract_pb;
}
