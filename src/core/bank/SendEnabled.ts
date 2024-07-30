import { JSONSerializable } from '../../util/json'
import { Denom } from '../Denom'
import { SendEnabled as SendEnabled_pb } from '@initia/initia.proto/cosmos/bank/v1beta1/bank'

export class SendEnabled extends JSONSerializable<
  SendEnabled.Amino,
  SendEnabled.Data,
  SendEnabled.Proto
> {
  /**
   * @param denom
   * @param enabled
   */
  constructor(
    public denom: Denom,
    public enabled: boolean
  ) {
    super()
  }

  public static fromAmino(data: SendEnabled.Amino): SendEnabled {
    const { denom, enabled } = data
    return new SendEnabled(denom, enabled)
  }

  public toAmino(): SendEnabled.Amino {
    const { denom, enabled } = this
    return { denom, enabled }
  }

  public static fromData(data: SendEnabled.Data): SendEnabled {
    const { denom, enabled } = data
    return new SendEnabled(denom, enabled)
  }

  public toData(): SendEnabled.Data {
    const { denom, enabled } = this
    return { denom, enabled }
  }

  public static fromProto(data: SendEnabled.Proto): SendEnabled {
    return new SendEnabled(data.denom, data.enabled)
  }

  public toProto(): SendEnabled.Proto {
    const { denom, enabled } = this
    return SendEnabled_pb.fromPartial({
      denom,
      enabled,
    })
  }
}

export namespace SendEnabled {
  export interface Amino {
    denom: Denom
    enabled: boolean
  }

  export interface Data {
    denom: Denom
    enabled: boolean
  }

  export type Proto = SendEnabled_pb
}
