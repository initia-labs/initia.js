import { JSONSerializable } from '../../../util/json'
import { GenericAuthorization as GenericAuthorization_pb } from '@initia/initia.proto/cosmos/authz/v1beta1/authz'
import { Any } from '@initia/initia.proto/google/protobuf/any'

/**
 * GenericAuthorization gives the grantee unrestricted permissions to execute the provided method on behalf of the granter's account.
 */
export class GenericAuthorization extends JSONSerializable<
  GenericAuthorization.Amino,
  GenericAuthorization.Data,
  GenericAuthorization.Proto
> {
  /**
   * @param msg msg, identified by it's type URL, to grant unrestricted permissions to execute
   */
  constructor(public msg: string) {
    super()
  }

  public static fromAmino(
    data: GenericAuthorization.Amino
  ): GenericAuthorization {
    return new GenericAuthorization(data.value.msg)
  }

  public toAmino(): GenericAuthorization.Amino {
    const { msg } = this
    return {
      type: 'cosmos-sdk/GenericAuthorization',
      value: {
        msg,
      },
    }
  }

  public static fromData(
    data: GenericAuthorization.Data
  ): GenericAuthorization {
    return new GenericAuthorization(data.msg)
  }

  public toData(): GenericAuthorization.Data {
    const { msg } = this
    return {
      '@type': '/cosmos.authz.v1beta1.GenericAuthorization',
      msg,
    }
  }

  public static fromProto(
    data: GenericAuthorization.Proto
  ): GenericAuthorization {
    return new GenericAuthorization(data.msg)
  }

  public toProto(): GenericAuthorization.Proto {
    return GenericAuthorization_pb.fromPartial({
      msg: this.msg,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.authz.v1beta1.GenericAuthorization',
      value: GenericAuthorization_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): GenericAuthorization {
    return GenericAuthorization.fromProto(
      GenericAuthorization_pb.decode(msgAny.value)
    )
  }
}

export namespace GenericAuthorization {
  export interface Amino {
    type: 'cosmos-sdk/GenericAuthorization'
    value: {
      msg: string
    }
  }

  export interface Data {
    '@type': '/cosmos.authz.v1beta1.GenericAuthorization'
    msg: string
  }

  export type Proto = GenericAuthorization_pb
}
