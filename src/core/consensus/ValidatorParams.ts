import { JSONSerializable } from '../../util/json'
import { ValidatorParams as ValidatorParams_pb } from '@initia/initia.proto/tendermint/types/params'

/**
 * ValidatorParams defines the set of validator parameters.
 */
export class ValidatorParams extends JSONSerializable<
  ValidatorParams.Amino,
  ValidatorParams.Data,
  ValidatorParams.Proto
> {
  /**
   * @param pub_key_types
   */
  constructor(public pub_key_types: string[]) {
    super()
  }

  public static fromAmino(data: ValidatorParams.Amino): ValidatorParams {
    return new ValidatorParams(data.pub_key_types)
  }

  public toAmino(): ValidatorParams.Amino {
    return {
      pub_key_types: this.pub_key_types,
    }
  }

  public static fromData(data: ValidatorParams.Data): ValidatorParams {
    return new ValidatorParams(data.pub_key_types)
  }

  public toData(): ValidatorParams.Data {
    return {
      pub_key_types: this.pub_key_types,
    }
  }

  public static fromProto(data: ValidatorParams.Proto): ValidatorParams {
    return new ValidatorParams(data.pubKeyTypes)
  }

  public toProto(): ValidatorParams.Proto {
    return ValidatorParams_pb.fromPartial({
      pubKeyTypes: this.pub_key_types,
    })
  }
}

export namespace ValidatorParams {
  export interface Amino {
    pub_key_types: string[]
  }

  export interface Data {
    pub_key_types: string[]
  }

  export type Proto = ValidatorParams_pb
}
