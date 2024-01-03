import { JSONSerializable } from '../../../util/json';
import { Coins } from '../../Coins';
import { ValAddress } from '../../bech32';
import { Validator } from '../Validator';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgCreateValidator as MsgCreateValidator_pb } from '@initia/initia.proto/initia/mstaking/v1/tx';
import { ValConsPublicKey, PublicKey } from '../../PublicKey';

/**
 * For new validators, this message registers a validator address to be a delegate on
 * the blockchain.
 */
export class MsgCreateValidator extends JSONSerializable<
  MsgCreateValidator.Amino,
  MsgCreateValidator.Data,
  MsgCreateValidator.Proto
> {
  public amount: Coins;

  /**
   *
   * @param description validator's delegate information
   * @param commission validator's commission policy
   * @param validator_address validator's operator address
   * @param pubkey validator's consensus public key
   * @param amount amount to use for self-delegation
   */
  constructor(
    public description: Validator.Description,
    public commission: Validator.CommissionRates,
    public validator_address: ValAddress,
    public pubkey: ValConsPublicKey,
    amount: Coins.Input
  ) {
    super();
    this.amount = new Coins(amount);
  }

  public static fromAmino(data: MsgCreateValidator.Amino): MsgCreateValidator {
    const {
      value: { description, commission, validator_address, pubkey, amount },
    } = data;
    return new MsgCreateValidator(
      description,
      Validator.CommissionRates.fromAmino(commission),
      validator_address,
      ValConsPublicKey.fromAmino(pubkey),
      Coins.fromAmino(amount)
    );
  }

  public toAmino(): MsgCreateValidator.Amino {
    const { description, commission, validator_address, pubkey, amount } = this;
    return {
      type: 'mstaking/MsgCreateValidator',
      value: {
        description,
        commission: commission.toAmino(),
        validator_address,
        pubkey: pubkey.toAmino(),
        amount: amount.toAmino(),
      },
    };
  }

  public static fromData(data: MsgCreateValidator.Data): MsgCreateValidator {
    const { description, commission, validator_address, pubkey, amount } = data;
    return new MsgCreateValidator(
      description,
      Validator.CommissionRates.fromData(commission),
      validator_address,
      ValConsPublicKey.fromData(pubkey),
      Coins.fromData(amount)
    );
  }

  public toData(): MsgCreateValidator.Data {
    const { description, commission, validator_address, pubkey, amount } = this;
    return {
      '@type': '/initia.mstaking.v1.MsgCreateValidator',
      description,
      commission: commission.toData(),
      validator_address,
      pubkey: pubkey.toData(),
      amount: amount.toData(),
    };
  }

  public static fromProto(proto: MsgCreateValidator.Proto): MsgCreateValidator {
    return new MsgCreateValidator(
      Validator.Description.fromProto(
        proto.description as Validator.Description.Proto
      ),
      Validator.CommissionRates.fromProto(
        proto.commission as Validator.CommissionRates.Proto
      ),
      proto.validatorAddress,
      PublicKey.fromProto(proto.pubkey as Any) as ValConsPublicKey,
      Coins.fromProto(proto.amount as Coins.Proto)
    );
  }

  public toProto(): MsgCreateValidator.Proto {
    const { description, commission, validator_address, pubkey, amount } = this;
    return MsgCreateValidator_pb.fromPartial({
      commission: commission.toProto(),
      description: description.toProto(),
      pubkey: pubkey.packAny(),
      validatorAddress: validator_address,
      amount: amount.toProto(),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.mstaking.v1.MsgCreateValidator',
      value: MsgCreateValidator_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgCreateValidator {
    return MsgCreateValidator.fromProto(
      MsgCreateValidator_pb.decode(msgAny.value)
    );
  }
}

export namespace MsgCreateValidator {
  export interface Amino {
    type: 'mstaking/MsgCreateValidator';
    value: {
      description: Validator.Description;
      commission: Validator.CommissionRates.Amino;
      validator_address: ValAddress;
      pubkey: ValConsPublicKey.Amino;
      amount: Coins.Amino;
    };
  }

  export interface Data {
    '@type': '/initia.mstaking.v1.MsgCreateValidator';
    description: Validator.Description;
    commission: Validator.CommissionRates.Data;
    validator_address: ValAddress;
    pubkey: ValConsPublicKey.Data;
    amount: Coins.Data;
  }

  export type Proto = MsgCreateValidator_pb;
}
