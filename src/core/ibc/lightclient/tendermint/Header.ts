import { JSONSerializable } from '../../../../util/json'
import { Header as Header_pb } from '@initia/initia.proto/ibc/lightclients/tendermint/v1/tendermint'
import { Height } from '../../core/client/Height'
import {
  SignedHeader,
  ValidatorSet,
} from '../../core/client/msgs/tendermint/types'
import { Any } from '@initia/initia.proto/google/protobuf/any'

/**
 * Header defines the Tendermint client consensus Header.
 * It encapsulates all the information necessary to update from a trusted
 * Tendermint ConsensusState. The inclusion of TrustedHeight and
 * TrustedValidators allows this update to process correctly, so long as the
 * ConsensusState for the TrustedHeight exists, this removes race conditions
 * among relayers The SignedHeader and ValidatorSet are the new untrusted update
 * fields for the client. The TrustedHeight is the height of a stored
 * ConsensusState on the client that will be used to verify the new untrusted
 * header. The Trusted ConsensusState must be within the unbonding period of
 * current time in order to correctly verify, and the TrustedValidators must
 * hash to TrustedConsensusState.NextValidatorsHash since that is the last
 * trusted validator set at the TrustedHeight.
 */
export class Header extends JSONSerializable<any, Header.Data, Header.Proto> {
  /**
   * @param signed_header
   * @param validator_set
   * @param trusted_height
   * @param trusted_validators
   */
  constructor(
    public signed_header?: SignedHeader,
    public validator_set?: ValidatorSet,
    public trusted_height?: Height,
    public trusted_validators?: ValidatorSet
  ) {
    super()
  }

  public static fromAmino(_: any): Header {
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(data: Header.Data): Header {
    const { signed_header, validator_set, trusted_height, trusted_validators } =
      data
    return new Header(
      signed_header ? SignedHeader.fromData(signed_header) : undefined,
      validator_set ? ValidatorSet.fromData(validator_set) : undefined,
      trusted_height ? Height.fromData(trusted_height) : undefined,
      trusted_validators ? ValidatorSet.fromData(trusted_validators) : undefined
    )
  }

  public toData(): Header.Data {
    const { signed_header, validator_set, trusted_height, trusted_validators } =
      this
    return {
      signed_header: signed_header?.toData(),
      validator_set: validator_set?.toData(),
      trusted_height: trusted_height?.toData(),
      trusted_validators: trusted_validators?.toData(),
    }
  }

  public static fromProto(proto: Header.Proto): Header {
    const { signedHeader, validatorSet, trustedHeight, trustedValidators } =
      proto
    return new Header(
      signedHeader ? SignedHeader.fromProto(signedHeader) : undefined,
      validatorSet ? ValidatorSet.fromProto(validatorSet) : undefined,
      trustedHeight ? Height.fromProto(trustedHeight) : undefined,
      trustedValidators ? ValidatorSet.fromProto(trustedValidators) : undefined
    )
  }

  public toProto(): Header.Proto {
    const { signed_header, validator_set, trusted_height, trusted_validators } =
      this
    return Header_pb.fromPartial({
      signedHeader: signed_header?.toProto(),
      validatorSet: validator_set?.toProto(),
      trustedHeight: trusted_height?.toProto(),
      trustedValidators: trusted_validators?.toProto(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: 'ibc.lightclients.tendermint.v1.Header',
      value: Header_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): Header {
    return Header.fromProto(Header_pb.decode(msgAny.value))
  }
}

export namespace Header {
  export interface Data {
    signed_header?: SignedHeader.Data
    validator_set?: ValidatorSet.Data
    trusted_height?: Height.Data
    trusted_validators?: ValidatorSet.Data
  }

  export type Proto = Header_pb
}
