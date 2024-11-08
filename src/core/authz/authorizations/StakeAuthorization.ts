import { JSONSerializable } from '../../../util/json'
import { Coins } from '../../Coins'
import { AccAddress } from '../../bech32'
import {
  StakeAuthorization as StakeAuthorization_pb,
  AuthorizationType,
  StakeAuthorization_Validators as StakeAuthorizationValidators_pb,
  authorizationTypeFromJSON,
  authorizationTypeToJSON,
} from '@initia/initia.proto/initia/mstaking/v1/authz'
import { Any } from '@initia/initia.proto/google/protobuf/any'

/**
 * StakeAuthorization defines authorization for delegate/undelegate/redelegate.
 */
export class StakeAuthorization extends JSONSerializable<
  StakeAuthorization.Amino,
  StakeAuthorization.Data,
  StakeAuthorization.Proto
> {
  public max_tokens: Coins

  /**
   * @param max_tokensthe maximum amount of tokens can be delegate to a validator
   * @param allow_list list of validator addresses to whom grantee can delegate tokens on behalf of granter's account
   * @param deny_list list of validator addresses to whom grantee can not delegate tokens
   * @param authorization_type
   */
  constructor(
    max_tokens: Coins.Input,
    public allow_list: StakeAuthorizationValidators,
    public deny_list: StakeAuthorizationValidators,
    public authorization_type: AuthorizationType
  ) {
    super()
    this.max_tokens = new Coins(max_tokens)
  }

  public static fromAmino(data: StakeAuthorization.Amino): StakeAuthorization {
    const {
      value: { max_tokens, allow_list, deny_list, authorization_type },
    } = data

    return new StakeAuthorization(
      Coins.fromAmino(max_tokens),
      StakeAuthorizationValidators.fromAmino(allow_list),
      StakeAuthorizationValidators.fromAmino(deny_list),
      authorizationTypeFromJSON(authorization_type)
    )
  }

  public toAmino(): StakeAuthorization.Amino {
    const { max_tokens, allow_list, deny_list, authorization_type } = this
    return {
      type: 'mstake/StakeAuthorization',
      value: {
        max_tokens: max_tokens.toAmino(),
        allow_list: allow_list.toAmino(),
        deny_list: deny_list.toAmino(),
        authorization_type: authorizationTypeToJSON(authorization_type),
      },
    }
  }

  public static fromData(data: StakeAuthorization.Data): StakeAuthorization {
    const { max_tokens, allow_list, deny_list, authorization_type } = data

    return new StakeAuthorization(
      Coins.fromData(max_tokens),
      StakeAuthorizationValidators.fromData(allow_list),
      StakeAuthorizationValidators.fromData(deny_list),
      authorizationTypeFromJSON(authorization_type)
    )
  }

  public toData(): StakeAuthorization.Data {
    const { max_tokens, allow_list, deny_list, authorization_type } = this
    return {
      '@type': '/initia.mstaking.v1.StakeAuthorization',
      max_tokens: max_tokens.toData(),
      allow_list: allow_list.toData(),
      deny_list: deny_list.toData(),
      authorization_type: authorizationTypeToJSON(authorization_type),
    }
  }

  public static fromProto(proto: StakeAuthorization.Proto): StakeAuthorization {
    return new StakeAuthorization(
      Coins.fromProto(proto.maxTokens),
      StakeAuthorizationValidators.fromProto(
        proto.allowList as StakeAuthorizationValidators
      ),
      StakeAuthorizationValidators.fromProto(
        proto.denyList as StakeAuthorizationValidators
      ),
      proto.authorizationType
    )
  }

  public toProto(): StakeAuthorization.Proto {
    const { max_tokens, allow_list, deny_list, authorization_type } = this
    return StakeAuthorization_pb.fromPartial({
      maxTokens: max_tokens.toProto(),
      allowList: allow_list.toProto(),
      denyList: deny_list.toProto(),
      authorizationType: authorization_type,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.mstaking.v1.StakeAuthorization',
      value: StakeAuthorization_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): StakeAuthorization {
    return StakeAuthorization.fromProto(
      StakeAuthorization_pb.decode(msgAny.value)
    )
  }
}

export class StakeAuthorizationValidators extends JSONSerializable<
  StakeAuthorizationValidators.Amino,
  StakeAuthorizationValidators.Data,
  StakeAuthorizationValidators.Proto
> {
  constructor(public address: AccAddress[]) {
    super()
  }

  public static fromAmino(
    data: StakeAuthorizationValidators.Amino
  ): StakeAuthorizationValidators {
    return new StakeAuthorizationValidators(data.address)
  }

  public toAmino(): StakeAuthorizationValidators.Amino {
    return { address: this.address }
  }

  public static fromData(
    data: StakeAuthorizationValidators.Data
  ): StakeAuthorizationValidators {
    return new StakeAuthorizationValidators(data.address)
  }

  public toData(): StakeAuthorizationValidators.Data {
    return {
      address: this.address,
    }
  }

  public static fromProto(
    proto: StakeAuthorizationValidators.Proto
  ): StakeAuthorizationValidators {
    return new StakeAuthorizationValidators(proto.address)
  }

  public toProto(): StakeAuthorizationValidators.Proto {
    return StakeAuthorizationValidators_pb.fromPartial({
      address: this.address,
    })
  }
}

export namespace StakeAuthorizationValidators {
  export interface Amino {
    address: AccAddress[]
  }

  export interface Data {
    address: AccAddress[]
  }

  export type Proto = StakeAuthorizationValidators_pb
}

export namespace StakeAuthorization {
  export type Type = AuthorizationType
  export const Type = AuthorizationType

  export interface Amino {
    type: 'mstake/StakeAuthorization'
    value: {
      max_tokens: Coins.Amino
      allow_list: StakeAuthorizationValidators.Amino
      deny_list: StakeAuthorizationValidators.Amino
      authorization_type: string
    }
  }

  export interface Data {
    '@type': '/initia.mstaking.v1.StakeAuthorization'
    max_tokens: Coins.Data
    allow_list: StakeAuthorizationValidators.Data
    deny_list: StakeAuthorizationValidators.Data
    authorization_type: string
  }

  export type Proto = StakeAuthorization_pb
}
