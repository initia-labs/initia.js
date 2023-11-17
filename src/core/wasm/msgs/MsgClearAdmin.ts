import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgClearAdmin as MsgClearAdmin_pb } from '@initia/initia.proto/cosmwasm/wasm/v1/tx';

export class MsgClearAdmin extends JSONSerializable<
  MsgClearAdmin.Amino,
  MsgClearAdmin.Data,
  MsgClearAdmin.Proto
> {
  /**
   * @param sender the actor that signed the messages
   * @param contract the address of the smart contract
   */
  constructor(public sender: AccAddress, public contract: AccAddress) {
    super();
  }

  public static fromAmino(data: MsgClearAdmin.Amino): MsgClearAdmin {
    const {
      value: { sender, contract },
    } = data;

    return new MsgClearAdmin(sender, contract);
  }

  public toAmino(): MsgClearAdmin.Amino {
    const { sender, contract } = this;
    return {
      type: 'wasm/MsgClearAdmin',
      value: {
        sender,
        contract,
      },
    };
  }

  public static fromData(data: MsgClearAdmin.Data): MsgClearAdmin {
    const { sender, contract } = data;
    return new MsgClearAdmin(sender, contract);
  }

  public toData(): MsgClearAdmin.Data {
    const { sender, contract } = this;
    return {
      '@type': '/cosmwasm.wasm.v1.MsgClearAdmin',
      sender,
      contract,
    };
  }

  public static fromProto(data: MsgClearAdmin.Proto): MsgClearAdmin {
    return new MsgClearAdmin(data.sender, data.contract);
  }

  public toProto(): MsgClearAdmin.Proto {
    const { sender, contract } = this;
    return MsgClearAdmin_pb.fromPartial({
      sender,
      contract,
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmwasm.wasm.v1.MsgClearAdmin',
      value: MsgClearAdmin_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgClearAdmin {
    return MsgClearAdmin.fromProto(MsgClearAdmin_pb.decode(msgAny.value));
  }
}

export namespace MsgClearAdmin {
  export interface Amino {
    type: 'wasm/MsgClearAdmin';
    value: {
      sender: AccAddress;
      contract: AccAddress;
    };
  }

  export interface Data {
    '@type': '/cosmwasm.wasm.v1.MsgClearAdmin';
    sender: AccAddress;
    contract: AccAddress;
  }

  export type Proto = MsgClearAdmin_pb;
}
