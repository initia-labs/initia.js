import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Coins } from '../../Coins'
import { SendAuthorization as SendAuthorization_pb } from '@initia/initia.proto/cosmos/bank/v1beta1/authz'
import { Any } from '@initia/initia.proto/google/protobuf/any'

/**
 * SendAuthorization allows the grantee to spend up to spend_limit coins from the granter's account.
 */
export class SendAuthorization extends JSONSerializable<
  SendAuthorization.Amino,
  SendAuthorization.Data,
  SendAuthorization.Proto
> {
  public spend_limit: Coins

  /**
   * @param spend_limit
   * @param allow_list an optional list of addresses to whom the grantee can send tokens on behalf of the granter
   */
  constructor(
    spend_limit: Coins.Input,
    public allow_list: AccAddress[]
  ) {
    super()
    this.spend_limit = new Coins(spend_limit)
  }

  public static fromAmino(data: SendAuthorization.Amino): SendAuthorization {
    return new SendAuthorization(
      Coins.fromAmino(data.value.spend_limit),
      data.value.allow_list
    )
  }

  public toAmino(): SendAuthorization.Amino {
    const { spend_limit, allow_list } = this
    return {
      type: 'cosmos-sdk/SendAuthorization',
      value: {
        spend_limit: spend_limit.toAmino(),
        allow_list,
      },
    }
  }

  public static fromData(data: SendAuthorization.Data): SendAuthorization {
    return new SendAuthorization(
      Coins.fromData(data.spend_limit),
      data.allow_list
    )
  }

  public toData(): SendAuthorization.Data {
    const { spend_limit, allow_list } = this
    return {
      '@type': '/cosmos.bank.v1beta1.SendAuthorization',
      spend_limit: spend_limit.toAmino(),
      allow_list,
    }
  }

  public static fromProto(proto: SendAuthorization.Proto): SendAuthorization {
    return new SendAuthorization(
      Coins.fromProto(proto.spendLimit),
      proto.allowList
    )
  }

  public toProto(): SendAuthorization.Proto {
    return SendAuthorization_pb.fromPartial({
      spendLimit: this.spend_limit.toProto(),
      allowList: this.allow_list,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.bank.v1beta1.SendAuthorization',
      value: SendAuthorization_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): SendAuthorization {
    return SendAuthorization.fromProto(
      SendAuthorization_pb.decode(msgAny.value)
    )
  }
}

export namespace SendAuthorization {
  export interface Amino {
    type: 'cosmos-sdk/SendAuthorization'
    value: {
      spend_limit: Coins.Amino
      allow_list: AccAddress[]
    }
  }

  export interface Data {
    '@type': '/cosmos.bank.v1beta1.SendAuthorization'
    spend_limit: Coins.Data
    allow_list: AccAddress[]
  }

  export type Proto = SendAuthorization_pb
}
