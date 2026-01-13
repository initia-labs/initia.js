import { JSONSerializable } from '../../../util/json'
import { ValAddress } from '../../bech32'
import { num } from '../../num'
import { Validator } from '../Validator'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgEditValidator as MsgEditValidator_pb } from '@initia/initia.proto/initia/mstaking/v1/tx'

/**
 * MsgEditValidator defines a method for editing an existing validator.
 */
export class MsgEditValidator extends JSONSerializable<
  MsgEditValidator.Amino,
  MsgEditValidator.Data,
  MsgEditValidator.Proto
> {
  /**
   * @param description new description to apply
   * @param validator_address new address to apply
   * @param commission_rate new commission rates to apply
   */
  constructor(
    public description: Validator.Description,
    public validator_address: ValAddress,
    public commission_rate?: string
  ) {
    super()
  }

  public static fromAmino(data: MsgEditValidator.Amino): MsgEditValidator {
    const {
      value: { description, validator_address, commission_rate },
    } = data
    return new MsgEditValidator(
      Validator.Description.fromAmino(description),
      validator_address,
      commission_rate
    )
  }

  public toAmino(): MsgEditValidator.Amino {
    const { description, validator_address, commission_rate } = this
    return {
      type: 'mstaking/MsgEditValidator',
      value: {
        description,
        validator_address,
        commission_rate: commission_rate
          ? num(commission_rate).toFixed(18)
          : undefined,
      },
    }
  }

  public static fromData(data: MsgEditValidator.Data): MsgEditValidator {
    const { description, validator_address, commission_rate } = data
    return new MsgEditValidator(
      Validator.Description.fromData(description),
      validator_address,
      commission_rate
    )
  }

  public toData(): MsgEditValidator.Data {
    const { description, validator_address, commission_rate } = this
    return {
      '@type': '/initia.mstaking.v1.MsgEditValidator',
      description,
      validator_address,
      commission_rate,
    }
  }

  public static fromProto(data: MsgEditValidator.Proto): MsgEditValidator {
    return new MsgEditValidator(
      Validator.Description.fromProto(
        data.description as Validator.Description.Proto
      ),
      data.validatorAddress,
      data.commissionRate !== ''
        ? num(data.commissionRate).shiftedBy(-18).toFixed()
        : undefined
    )
  }

  public toProto(): MsgEditValidator.Proto {
    const { description, validator_address, commission_rate } = this
    return MsgEditValidator_pb.fromPartial({
      description: description.toProto(),
      commissionRate: commission_rate
        ? num(commission_rate).shiftedBy(18).toFixed(0)
        : undefined,
      validatorAddress: validator_address,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.mstaking.v1.MsgEditValidator',
      value: MsgEditValidator_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgEditValidator {
    return MsgEditValidator.fromProto(MsgEditValidator_pb.decode(msgAny.value))
  }
}

export namespace MsgEditValidator {
  export const DESC_DO_NOT_MODIFY: Validator.Description.Amino = {
    moniker: '[do-not-modify]',
    website: '[do-not-modify]',
    identity: '[do-not-modify]',
    details: '[do-not-modify]',
    security_contact: '[do-not-modify]',
  }

  export interface Amino {
    type: 'mstaking/MsgEditValidator'
    value: {
      description: Validator.Description.Amino
      validator_address: ValAddress
      commission_rate?: string
    }
  }

  export interface Data {
    '@type': '/initia.mstaking.v1.MsgEditValidator'
    description: Validator.Description.Data
    validator_address: ValAddress
    commission_rate?: string
  }

  export type Proto = MsgEditValidator_pb
}
