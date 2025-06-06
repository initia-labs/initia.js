import { JSONSerializable } from '../../../util/json'
import { ValAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgWithdrawValidatorCommission as MsgWithdrawValidatorCommission_pb } from '@initia/initia.proto/cosmos/distribution/v1beta1/tx'

/**
 * MsgWithdrawValidatorCommission defines a method to withdraw the full commission to the validator address.
 */
export class MsgWithdrawValidatorCommission extends JSONSerializable<
  MsgWithdrawValidatorCommission.Amino,
  MsgWithdrawValidatorCommission.Data,
  MsgWithdrawValidatorCommission.Proto
> {
  /**
   * @param validator_address validator's operator address
   */
  constructor(public validator_address: ValAddress) {
    super()
  }

  public static fromAmino(
    data: MsgWithdrawValidatorCommission.Amino
  ): MsgWithdrawValidatorCommission {
    const {
      value: { validator_address },
    } = data
    return new MsgWithdrawValidatorCommission(validator_address)
  }

  public toAmino(): MsgWithdrawValidatorCommission.Amino {
    const { validator_address } = this
    return {
      type: 'cosmos-sdk/MsgWithdrawValidatorCommission',
      value: {
        validator_address,
      },
    }
  }

  public static fromData(
    proto: MsgWithdrawValidatorCommission.Data
  ): MsgWithdrawValidatorCommission {
    const { validator_address } = proto
    return new MsgWithdrawValidatorCommission(validator_address)
  }

  public toData(): MsgWithdrawValidatorCommission.Data {
    const { validator_address } = this
    return {
      '@type': '/cosmos.distribution.v1beta1.MsgWithdrawValidatorCommission',
      validator_address,
    }
  }

  public static fromProto(
    proto: MsgWithdrawValidatorCommission.Proto
  ): MsgWithdrawValidatorCommission {
    return new MsgWithdrawValidatorCommission(proto.validatorAddress)
  }

  public toProto(): MsgWithdrawValidatorCommission.Proto {
    const { validator_address } = this
    return MsgWithdrawValidatorCommission_pb.fromPartial({
      validatorAddress: validator_address,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawValidatorCommission',
      value: MsgWithdrawValidatorCommission_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgWithdrawValidatorCommission {
    return MsgWithdrawValidatorCommission.fromProto(
      MsgWithdrawValidatorCommission_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgWithdrawValidatorCommission {
  export interface Amino {
    type: 'cosmos-sdk/MsgWithdrawValidatorCommission'
    value: {
      validator_address: ValAddress
    }
  }

  export interface Data {
    '@type': '/cosmos.distribution.v1beta1.MsgWithdrawValidatorCommission'
    validator_address: ValAddress
  }

  export type Proto = MsgWithdrawValidatorCommission_pb
}
