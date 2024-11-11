import { JSONSerializable } from '../../../util/json'
import { StoreCodeAuthorization as StoreCodeAuthorization_pb } from '@initia/initia.proto/cosmwasm/wasm/v1/authz'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { CodeGrant } from './CodeGrant'

/**
 * StoreCodeAuthorization defines authorization for wasm code upload.
 */
export class StoreCodeAuthorization extends JSONSerializable<
  StoreCodeAuthorization.Amino,
  StoreCodeAuthorization.Data,
  StoreCodeAuthorization.Proto
> {
  /**
   * @param grants grants for code upload
   */
  constructor(public grants: CodeGrant[]) {
    super()
  }

  public static fromAmino(
    data: StoreCodeAuthorization.Amino
  ): StoreCodeAuthorization {
    return new StoreCodeAuthorization(
      data.value.grants.map(CodeGrant.fromAmino)
    )
  }

  public toAmino(): StoreCodeAuthorization.Amino {
    return {
      type: 'wasm/StoreCodeAuthorization',
      value: { grants: this.grants.map((grant) => grant.toAmino()) },
    }
  }

  public static fromData(
    data: StoreCodeAuthorization.Data
  ): StoreCodeAuthorization {
    return new StoreCodeAuthorization(data.grants.map(CodeGrant.fromData))
  }

  public toData(): StoreCodeAuthorization.Data {
    return {
      '@type': '/cosmwasm.wasm.v1.StoreCodeAuthorization',
      grants: this.grants.map((grant) => grant.toData()),
    }
  }

  public static fromProto(
    data: StoreCodeAuthorization.Proto
  ): StoreCodeAuthorization {
    return new StoreCodeAuthorization(data.grants.map(CodeGrant.fromProto))
  }

  public toProto(): StoreCodeAuthorization.Proto {
    return StoreCodeAuthorization_pb.fromPartial({
      grants: this.grants.map((grant) => grant.toProto()),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmwasm.wasm.v1.StoreCodeAuthorization',
      value: StoreCodeAuthorization_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): StoreCodeAuthorization {
    return StoreCodeAuthorization.fromProto(
      StoreCodeAuthorization_pb.decode(msgAny.value)
    )
  }
}

export namespace StoreCodeAuthorization {
  export interface Amino {
    type: 'wasm/StoreCodeAuthorization'
    value: {
      grants: CodeGrant.Amino[]
    }
  }

  export interface Data {
    '@type': '/cosmwasm.wasm.v1.StoreCodeAuthorization'
    grants: CodeGrant.Data[]
  }

  export type Proto = StoreCodeAuthorization_pb
}
