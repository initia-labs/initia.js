import { JSONSerializable } from '../../../util/json';
import { GenericAuthorization } from './GenericAuthorization';
import { SendAuthorization } from './SendAuthorization';
import { StakeAuthorization } from './StakeAuthorization';
import { PublishAuthorization } from './PublishAuthorization';
import { ExecuteAuthorization } from './ExecuteAuthorization';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { Grant as Grant_pb } from '@initia/initia.proto/cosmos/authz/v1beta1/authz';

export class AuthorizationGrant extends JSONSerializable<
  AuthorizationGrant.Amino,
  AuthorizationGrant.Data,
  AuthorizationGrant.Proto
> {
  constructor(public authorization: Authorization, public expiration: Date) {
    super();
  }

  public static fromAmino(amino: AuthorizationGrant.Amino): AuthorizationGrant {
    const { authorization, expiration } = amino;
    return new AuthorizationGrant(
      Authorization.fromAmino(authorization),
      new Date(expiration)
    );
  }

  public toAmino(): AuthorizationGrant.Amino {
    const { authorization, expiration } = this;
    return {
      authorization: authorization.toAmino(),
      expiration: expiration.toISOString().replace(/\.000Z$/, 'Z'),
    };
  }

  public static fromData(data: AuthorizationGrant.Data): AuthorizationGrant {
    const { authorization, expiration } = data;
    return new AuthorizationGrant(
      Authorization.fromData(authorization),
      new Date(expiration)
    );
  }

  public toData(): AuthorizationGrant.Data {
    const { authorization, expiration } = this;
    return {
      authorization: authorization.toData(),
      expiration: expiration.toISOString().replace(/\.000Z$/, 'Z'),
    };
  }

  public static fromProto(proto: AuthorizationGrant.Proto): AuthorizationGrant {
    return new AuthorizationGrant(
      Authorization.fromProto(proto.authorization as Any),
      proto.expiration as Date
    );
  }

  public toProto(): AuthorizationGrant.Proto {
    const { authorization, expiration } = this;
    return Grant_pb.fromPartial({
      authorization: authorization.packAny(),
      expiration,
    });
  }
}

export namespace AuthorizationGrant {
  export interface Amino {
    authorization: Authorization.Amino;
    expiration: string;
  }

  export interface Data {
    authorization: Authorization.Data;
    expiration: string;
  }

  export type Proto = Grant_pb;
}

export type Authorization =
  | SendAuthorization
  | GenericAuthorization
  | StakeAuthorization
  | PublishAuthorization
  | ExecuteAuthorization;

export namespace Authorization {
  export type Amino = SendAuthorization.Amino | GenericAuthorization.Amino;
  export type Data =
    | SendAuthorization.Data
    | GenericAuthorization.Data
    | StakeAuthorization.Data
    | PublishAuthorization.Data
    | ExecuteAuthorization.Data;
  export type Proto = Any;
  export function fromAmino(data: Authorization.Amino): Authorization {
    switch (data.type) {
      case 'cosmos-sdk/SendAuthorization':
        return SendAuthorization.fromAmino(data);
      case 'cosmos-sdk/GenericAuthorization':
        return GenericAuthorization.fromAmino(data);
    }
  }

  export function fromData(data: Authorization.Data): Authorization {
    switch (data['@type']) {
      case '/cosmos.authz.v1beta1.GenericAuthorization':
        return GenericAuthorization.fromData(data);
      case '/cosmos.bank.v1beta1.SendAuthorization':
        return SendAuthorization.fromData(data);
      case '/initia.mstaking.v1.StakeAuthorization':
        return StakeAuthorization.fromData(data);
      case '/initia.move.v1.PublishAuthorization':
        return PublishAuthorization.fromData(data);
      case '/initia.move.v1.ExecuteAuthorization':
        return ExecuteAuthorization.fromData(data);
    }
  }

  export function fromProto(proto: Authorization.Proto): Authorization {
    const typeUrl = proto.typeUrl;
    switch (typeUrl) {
      case '/cosmos.authz.v1beta1.GenericAuthorization':
        return GenericAuthorization.unpackAny(proto);
      case '/cosmos.bank.v1beta1.SendAuthorization':
        return SendAuthorization.unpackAny(proto);
      case '/initia.mstaking.v1.StakeAuthorization':
        return StakeAuthorization.unpackAny(proto);
      case '/initia.move.v1.PublishAuthorization':
        return PublishAuthorization.unpackAny(proto);
      case '/initia.move.v1.ExecuteAuthorization':
        return ExecuteAuthorization.unpackAny(proto);
    }

    throw new Error(`Authorization type ${typeUrl} not recognized`);
  }
}
