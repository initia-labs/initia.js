import { JSONSerializable } from '../../../util/json';
import { num } from '../../num';
import { ValAddress } from '../../bech32';
import { Validator } from '../Validator';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgEditValidator as MsgEditValidator_pb } from '@initia/initia.proto/initia/mstaking/v1/tx';

/**
 * A validator can edit its delegate information, such as moniker, website, commission
 * rate, etc.
 *
 * You must use special or sentinel values to inform that you want to leave the current
 * field untouched. For `Description`,` you should start with [[MsgEditValidator.DESC_DO_NOT_MODIFY]] and
 * change each field you wish to modify individually.
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
    super();
  }

  public static fromAmino(data: MsgEditValidator.Amino): MsgEditValidator {
    const {
      value: {
        description,
        validator_address,
        commission_rate,
      },
    } = data;
    return new MsgEditValidator(
      Validator.Description.fromAmino(description),
      validator_address,
      commission_rate
    );
  }

  public toAmino(): MsgEditValidator.Amino {
    const {
      description,
      validator_address,
      commission_rate,
    } = this;
    return {
      type: 'mstaking/MsgEditValidator',
      value: {
        description,
        validator_address,
        commission_rate: commission_rate
          ? num(commission_rate).toFixed(18)
          : undefined,
      },
    };
  }

  public static fromProto(data: MsgEditValidator.Proto): MsgEditValidator {
    return new MsgEditValidator(
      Validator.Description.fromProto(
        data.description as Validator.Description.Proto
      ),
      data.validatorAddress,
      data.commissionRate !== '' ? data.commissionRate : undefined,
    );
  }

  public toProto(): MsgEditValidator.Proto {
    const {
      description,
      validator_address,
      commission_rate,
    } = this;
    return MsgEditValidator_pb.fromPartial({
      description: description.toProto(),
      commissionRate: commission_rate?.toString() || '',
      validatorAddress: validator_address,
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.mstaking.v1.MsgEditValidator',
      value: MsgEditValidator_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgEditValidator {
    return MsgEditValidator.fromProto(MsgEditValidator_pb.decode(msgAny.value));
  }

  public static fromData(data: MsgEditValidator.Data): MsgEditValidator {
    const {
      description,
      validator_address,
      commission_rate,
    } = data;
    return new MsgEditValidator(
      Validator.Description.fromData(description),
      validator_address,
      commission_rate,
    );
  }

  public toData(): MsgEditValidator.Data {
    const {
      description,
      validator_address,
      commission_rate,
    } = this;
    return {
      '@type': '/initia.mstaking.v1.MsgEditValidator',
      description,
      validator_address,
      commission_rate: commission_rate
        ? num(commission_rate).toFixed(18)
        : undefined,
    };
  }
}

export namespace MsgEditValidator {
  export const DESC_DO_NOT_MODIFY: Validator.Description.Amino = {
    moniker: '[do-not-modify]',
    website: '[do-not-modify]',
    identity: '[do-not-modify]',
    details: '[do-not-modify]',
    security_contact: '[do-not-modify]',
  };

  export interface Amino {
    type: 'mstaking/MsgEditValidator';
    value: {
      description: Validator.Description.Amino;
      validator_address: ValAddress;
      commission_rate?: string;
    };
  }

  export interface Data {
    '@type': '/initia.mstaking.v1.MsgEditValidator';
    description: Validator.Description.Data;
    validator_address: ValAddress;
    commission_rate?: string;
  }

  export type Proto = MsgEditValidator_pb;
}
