import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Denom } from '../../Denom'
import { SendEnabled } from '../SendEnabled'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgSetSendEnabled as MsgSetSendEnabled_pb } from '@initia/initia.proto/cosmos/bank/v1beta1/tx'

export class MsgSetSendEnabled extends JSONSerializable<
  MsgSetSendEnabled.Amino,
  MsgSetSendEnabled.Data,
  MsgSetSendEnabled.Proto
> {
  /**
   * @param authority
   * @param send_enabled the list of entries to add or update
   * @param use_default_for a list of denoms that should use the params.default_send_enabled value
   */
  constructor(
    public authority: AccAddress,
    public send_enabled: SendEnabled[],
    public use_default_for: Denom[]
  ) {
    super()
  }

  public static fromAmino(data: MsgSetSendEnabled.Amino): MsgSetSendEnabled {
    const {
      value: { authority, send_enabled, use_default_for },
    } = data

    return new MsgSetSendEnabled(
      authority,
      send_enabled.map(SendEnabled.fromAmino),
      use_default_for
    )
  }

  public toAmino(): MsgSetSendEnabled.Amino {
    const { authority, send_enabled, use_default_for } = this
    return {
      type: 'cosmos-sdk/MsgSetSendEnabled',
      value: {
        authority,
        send_enabled: send_enabled.map((d) => d.toAmino()),
        use_default_for,
      },
    }
  }

  public static fromData(data: MsgSetSendEnabled.Data): MsgSetSendEnabled {
    const { authority, send_enabled, use_default_for } = data
    return new MsgSetSendEnabled(
      authority,
      send_enabled.map(SendEnabled.fromData),
      use_default_for
    )
  }

  public toData(): MsgSetSendEnabled.Data {
    const { authority, send_enabled, use_default_for } = this
    return {
      '@type': '/cosmos.bank.v1beta1.MsgSetSendEnabled',
      authority,
      send_enabled: send_enabled.map((d) => d.toData()),
      use_default_for,
    }
  }

  public static fromProto(data: MsgSetSendEnabled.Proto): MsgSetSendEnabled {
    return new MsgSetSendEnabled(
      data.authority,
      data.sendEnabled.map(SendEnabled.fromProto),
      data.useDefaultFor
    )
  }

  public toProto(): MsgSetSendEnabled.Proto {
    const { authority, send_enabled, use_default_for } = this
    return MsgSetSendEnabled_pb.fromPartial({
      authority,
      sendEnabled: send_enabled.map((d) => d.toProto()),
      useDefaultFor: use_default_for,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.bank.v1beta1.MsgSetSendEnabled',
      value: MsgSetSendEnabled_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgSetSendEnabled {
    return MsgSetSendEnabled.fromProto(
      MsgSetSendEnabled_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgSetSendEnabled {
  export interface Amino {
    type: 'cosmos-sdk/MsgSetSendEnabled'
    value: {
      authority: AccAddress
      send_enabled: SendEnabled.Amino[]
      use_default_for: Denom[]
    }
  }

  export interface Data {
    '@type': '/cosmos.bank.v1beta1.MsgSetSendEnabled'
    authority: AccAddress
    send_enabled: SendEnabled.Amino[]
    use_default_for: Denom[]
  }

  export type Proto = MsgSetSendEnabled_pb
}
