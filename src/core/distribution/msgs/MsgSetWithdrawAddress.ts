import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgSetWithdrawAddress as MsgSetWithdrawAddress_pb } from '@initia/initia.proto/cosmos/distribution/v1beta1/tx'

/**
 * MsgSetWithdrawAddress defines a method to change the withdraw address for a delegator (or validator self-delegation).
 */
export class MsgSetWithdrawAddress extends JSONSerializable<
  MsgSetWithdrawAddress.Amino,
  MsgSetWithdrawAddress.Data,
  MsgSetWithdrawAddress.Proto
> {
  /**
   * @param delegator_address delegator's account address
   * @param withdraw_address desired new withdraw address
   */
  constructor(
    public delegator_address: AccAddress,
    public withdraw_address: AccAddress
  ) {
    super()
  }

  public static fromAmino(
    data: MsgSetWithdrawAddress.Amino
  ): MsgSetWithdrawAddress {
    const {
      value: { delegator_address, withdraw_address },
    } = data
    return new MsgSetWithdrawAddress(delegator_address, withdraw_address)
  }

  public toAmino(): MsgSetWithdrawAddress.Amino {
    const { delegator_address, withdraw_address } = this
    return {
      type: 'cosmos-sdk/MsgModifyWithdrawAddress',
      value: {
        delegator_address,
        withdraw_address,
      },
    }
  }

  public static fromData(
    data: MsgSetWithdrawAddress.Data
  ): MsgSetWithdrawAddress {
    const { delegator_address, withdraw_address } = data
    return new MsgSetWithdrawAddress(delegator_address, withdraw_address)
  }

  public toData(): MsgSetWithdrawAddress.Data {
    const { delegator_address, withdraw_address } = this
    return {
      '@type': '/cosmos.distribution.v1beta1.MsgSetWithdrawAddress',
      delegator_address,
      withdraw_address,
    }
  }

  public static fromProto(
    proto: MsgSetWithdrawAddress.Proto
  ): MsgSetWithdrawAddress {
    return new MsgSetWithdrawAddress(
      proto.delegatorAddress,
      proto.withdrawAddress
    )
  }

  public toProto(): MsgSetWithdrawAddress.Proto {
    const { delegator_address, withdraw_address } = this
    return MsgSetWithdrawAddress_pb.fromPartial({
      delegatorAddress: delegator_address,
      withdrawAddress: withdraw_address,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.distribution.v1beta1.MsgSetWithdrawAddress',
      value: MsgSetWithdrawAddress_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgSetWithdrawAddress {
    return MsgSetWithdrawAddress.fromProto(
      MsgSetWithdrawAddress_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgSetWithdrawAddress {
  export interface Amino {
    type: 'cosmos-sdk/MsgModifyWithdrawAddress'
    value: {
      delegator_address: AccAddress
      withdraw_address: AccAddress
    }
  }

  export interface Data {
    '@type': '/cosmos.distribution.v1beta1.MsgSetWithdrawAddress'
    delegator_address: AccAddress
    withdraw_address: AccAddress
  }

  export type Proto = MsgSetWithdrawAddress_pb
}
