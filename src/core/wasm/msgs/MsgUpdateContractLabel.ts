import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgUpdateContractLabel as MsgUpdateContractLabel_pb } from '@initia/initia.proto/cosmwasm/wasm/v1/tx'

export class MsgUpdateContractLabel extends JSONSerializable<
  MsgUpdateContractLabel.Amino,
  MsgUpdateContractLabel.Data,
  MsgUpdateContractLabel.Proto
> {
  /**
   * @param sender the actor that signed the messages
   * @param new_label string to be set
   * @param contract the address of the smart contract
   */
  constructor(
    public sender: AccAddress,
    public new_label: string,
    public contract: AccAddress
  ) {
    super()
  }

  public static fromAmino(
    data: MsgUpdateContractLabel.Amino
  ): MsgUpdateContractLabel {
    const {
      value: { sender, new_label, contract },
    } = data

    return new MsgUpdateContractLabel(sender, new_label, contract)
  }

  public toAmino(): MsgUpdateContractLabel.Amino {
    const { sender, new_label, contract } = this
    return {
      type: 'wasm/MsgUpdateContractLabel',
      value: {
        sender,
        new_label,
        contract,
      },
    }
  }

  public static fromData(
    data: MsgUpdateContractLabel.Data
  ): MsgUpdateContractLabel {
    const { sender, new_label, contract } = data
    return new MsgUpdateContractLabel(sender, new_label, contract)
  }

  public toData(): MsgUpdateContractLabel.Data {
    const { sender, new_label, contract } = this
    return {
      '@type': '/cosmwasm.wasm.v1.MsgUpdateContractLabel',
      sender,
      new_label,
      contract,
    }
  }

  public static fromProto(
    data: MsgUpdateContractLabel.Proto
  ): MsgUpdateContractLabel {
    return new MsgUpdateContractLabel(data.sender, data.newLabel, data.contract)
  }

  public toProto(): MsgUpdateContractLabel.Proto {
    const { sender, new_label, contract } = this
    return MsgUpdateContractLabel_pb.fromPartial({
      sender,
      newLabel: new_label,
      contract,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmwasm.wasm.v1.MsgUpdateContractLabel',
      value: MsgUpdateContractLabel_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgUpdateContractLabel {
    return MsgUpdateContractLabel.fromProto(
      MsgUpdateContractLabel_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgUpdateContractLabel {
  export interface Amino {
    type: 'wasm/MsgUpdateContractLabel'
    value: {
      sender: AccAddress
      new_label: string
      contract: AccAddress
    }
  }

  export interface Data {
    '@type': '/cosmwasm.wasm.v1.MsgUpdateContractLabel'
    sender: AccAddress
    new_label: string
    contract: AccAddress
  }

  export type Proto = MsgUpdateContractLabel_pb
}
