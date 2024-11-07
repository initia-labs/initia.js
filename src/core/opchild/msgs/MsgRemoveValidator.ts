import { JSONSerializable } from '../../../util/json'
import { AccAddress, ValAddress } from '../../bech32'
import { MsgRemoveValidator as MsgRemoveValidator_pb } from '@initia/opinit.proto/opinit/opchild/v1/tx'
import { Any } from '@initia/initia.proto/google/protobuf/any'

/**
 * MsgRemoveValidator is a message to remove a validator from designated list.
 */
export class MsgRemoveValidator extends JSONSerializable<
  MsgRemoveValidator.Amino,
  MsgRemoveValidator.Data,
  MsgRemoveValidator.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param validator_address
   */
  constructor(
    public authority: AccAddress,
    public validator_address: ValAddress
  ) {
    super()
  }

  public static fromAmino(data: MsgRemoveValidator.Amino): MsgRemoveValidator {
    const {
      value: { authority, validator_address },
    } = data
    return new MsgRemoveValidator(authority, validator_address)
  }

  public toAmino(): MsgRemoveValidator.Amino {
    const { authority, validator_address } = this
    return {
      type: 'opchild/MsgRemoveValidator',
      value: {
        authority,
        validator_address,
      },
    }
  }

  public static fromData(data: MsgRemoveValidator.Data): MsgRemoveValidator {
    const { authority, validator_address } = data
    return new MsgRemoveValidator(authority, validator_address)
  }

  public toData(): MsgRemoveValidator.Data {
    const { authority, validator_address } = this
    return {
      '@type': '/opinit.opchild.v1.MsgRemoveValidator',
      authority,
      validator_address,
    }
  }

  public static fromProto(data: MsgRemoveValidator.Proto): MsgRemoveValidator {
    return new MsgRemoveValidator(data.authority, data.validatorAddress)
  }

  public toProto(): MsgRemoveValidator.Proto {
    const { authority, validator_address } = this
    return MsgRemoveValidator_pb.fromPartial({
      authority,
      validatorAddress: validator_address,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.opchild.v1.MsgRemoveValidator',
      value: MsgRemoveValidator_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgRemoveValidator {
    return MsgRemoveValidator.fromProto(
      MsgRemoveValidator_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgRemoveValidator {
  export interface Amino {
    type: 'opchild/MsgRemoveValidator'
    value: {
      authority: AccAddress
      validator_address: ValAddress
    }
  }

  export interface Data {
    '@type': '/opinit.opchild.v1.MsgRemoveValidator'
    authority: AccAddress
    validator_address: ValAddress
  }

  export type Proto = MsgRemoveValidator_pb
}
