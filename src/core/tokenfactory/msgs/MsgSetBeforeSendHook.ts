import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgSetBeforeSendHook as MsgSetBeforeSendHook_pb } from '@initia/initia.proto/miniwasm/tokenfactory/v1/tx';

export class MsgSetBeforeSendHook extends JSONSerializable<
  MsgSetBeforeSendHook.Amino,
  MsgSetBeforeSendHook.Data,
  MsgSetBeforeSendHook.Proto
> {
  /**
   * @param sender
   * @param denom
   * @param cosmwasm_address
   */
  constructor(
    public sender: AccAddress,
    public denom: string,
    public cosmwasm_address: AccAddress
  ) {
    super();
  }

  public static fromAmino(
    data: MsgSetBeforeSendHook.Amino
  ): MsgSetBeforeSendHook {
    const {
      value: { sender, denom, cosmwasm_address },
    } = data;

    return new MsgSetBeforeSendHook(sender, denom, cosmwasm_address);
  }

  public toAmino(): MsgSetBeforeSendHook.Amino {
    const { sender, denom, cosmwasm_address } = this;
    return {
      type: 'tokenfactory/MsgSetBeforeSendHook',
      value: {
        sender,
        denom,
        cosmwasm_address,
      },
    };
  }

  public static fromData(
    data: MsgSetBeforeSendHook.Data
  ): MsgSetBeforeSendHook {
    const { sender, denom, cosmwasm_address } = data;
    return new MsgSetBeforeSendHook(sender, denom, cosmwasm_address);
  }

  public toData(): MsgSetBeforeSendHook.Data {
    const { sender, denom, cosmwasm_address } = this;
    return {
      '@type': '/miniwasm.tokenfactory.v1.MsgSetBeforeSendHook',
      sender,
      denom,
      cosmwasm_address,
    };
  }

  public static fromProto(
    data: MsgSetBeforeSendHook.Proto
  ): MsgSetBeforeSendHook {
    return new MsgSetBeforeSendHook(
      data.sender,
      data.denom,
      data.cosmwasmAddress
    );
  }

  public toProto(): MsgSetBeforeSendHook.Proto {
    const { sender, denom, cosmwasm_address } = this;
    return MsgSetBeforeSendHook_pb.fromPartial({
      sender,
      denom,
      cosmwasmAddress: cosmwasm_address,
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/miniwasm.tokenfactory.v1.MsgSetBeforeSendHook',
      value: MsgSetBeforeSendHook_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgSetBeforeSendHook {
    return MsgSetBeforeSendHook.fromProto(
      MsgSetBeforeSendHook_pb.decode(msgAny.value)
    );
  }
}

export namespace MsgSetBeforeSendHook {
  export interface Amino {
    type: 'tokenfactory/MsgSetBeforeSendHook';
    value: {
      sender: AccAddress;
      denom: string;
      cosmwasm_address: AccAddress;
    };
  }

  export interface Data {
    '@type': '/miniwasm.tokenfactory.v1.MsgSetBeforeSendHook';
    sender: AccAddress;
    denom: string;
    cosmwasm_address: AccAddress;
  }

  export type Proto = MsgSetBeforeSendHook_pb;
}
