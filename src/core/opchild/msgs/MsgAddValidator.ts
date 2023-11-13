import { JSONSerializable } from '../../../util/json';
import { AccAddress, ValAddress } from '../../bech32';
import { ValConsPublicKey } from '../../PublicKey';
import { MsgAddValidator as MsgAddValidator_pb } from '@initia/opinit.proto/opinit/opchild/v1/tx';
import { Any } from '@initia/initia.proto/google/protobuf/any';

export class MsgAddValidator extends JSONSerializable<
  MsgAddValidator.Amino,
  MsgAddValidator.Data,
  MsgAddValidator.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param moniker
   * @param validator_address
   * @param pubkey
   */
  constructor(
    public authority: AccAddress,
    public moniker: string,
    public validator_address: ValAddress,
    public pubkey: ValConsPublicKey
  ) {
    super();
  }

  public static fromAmino(data: MsgAddValidator.Amino): MsgAddValidator {
    const {
      value: { authority, moniker, validator_address, pubkey },
    } = data;

    return new MsgAddValidator(
      authority,
      moniker,
      validator_address,
      ValConsPublicKey.fromAmino(pubkey)
    );
  }

  public toAmino(): MsgAddValidator.Amino {
    const { authority, moniker, validator_address, pubkey } = this;
    return {
      type: 'opchild/MsgAddValidator',
      value: {
        authority,
        moniker,
        validator_address,
        pubkey: pubkey.toAmino(),
      },
    };
  }

  public static fromData(data: MsgAddValidator.Data): MsgAddValidator {
    const { authority, moniker, validator_address, pubkey } = data;
    return new MsgAddValidator(
      authority,
      moniker,
      validator_address,
      ValConsPublicKey.fromData(pubkey)
    );
  }

  public toData(): MsgAddValidator.Data {
    const { authority, moniker, validator_address, pubkey } = this;
    return {
      '@type': '/opinit.opchild.v1.MsgAddValidator',
      authority,
      moniker,
      validator_address,
      pubkey: pubkey.toData(),
    };
  }

  public static fromProto(data: MsgAddValidator.Proto): MsgAddValidator {
    return new MsgAddValidator(
      data.authority,
      data.moniker,
      data.validatorAddress,
      ValConsPublicKey.unpackAny(data.pubkey as Any)
    );
  }

  public toProto(): MsgAddValidator.Proto {
    const { authority, moniker, validator_address, pubkey } = this;
    return MsgAddValidator_pb.fromPartial({
      authority,
      moniker,
      validatorAddress: validator_address,
      pubkey: pubkey.packAny(),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.opchild.v1.MsgAddValidator',
      value: MsgAddValidator_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgAddValidator {
    return MsgAddValidator.fromProto(MsgAddValidator_pb.decode(msgAny.value));
  }
}

export namespace MsgAddValidator {
  export interface Amino {
    type: 'opchild/MsgAddValidator';
    value: {
      authority: AccAddress;
      moniker: string;
      validator_address: ValAddress;
      pubkey: ValConsPublicKey.Amino;
    };
  }

  export interface Data {
    '@type': '/opinit.opchild.v1.MsgAddValidator';
    authority: AccAddress;
    moniker: string;
    validator_address: ValAddress;
    pubkey: ValConsPublicKey.Data;
  }

  export type Proto = MsgAddValidator_pb;
}
