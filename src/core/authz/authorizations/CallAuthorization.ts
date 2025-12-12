import { JSONSerializable } from '../../../util/json'
import { CallAuthorization as CallAuthorization_pb } from '@initia/initia.proto/minievm/evm/v1/authz'
import { Any } from '@initia/initia.proto/google/protobuf/any'

/**
 * CallAuthorization defines authorization for calling a contract.
 */
export class CallAuthorization extends JSONSerializable<
  CallAuthorization.Amino,
  CallAuthorization.Data,
  CallAuthorization.Proto
> {
  /**
   * @param contracts empty means all contracts are allowed
   */
  constructor(public contracts: string[]) {
    super()
  }

  public static fromAmino(data: CallAuthorization.Amino): CallAuthorization {
    return new CallAuthorization(data.value.contracts ?? [])
  }

  public toAmino(): CallAuthorization.Amino {
    return {
      type: 'evm/CallAuthorization',
      value: {
        contracts: this.contracts.length > 0 ? this.contracts : null,
      },
    }
  }

  public static fromData(data: CallAuthorization.Data): CallAuthorization {
    return new CallAuthorization(data.contracts)
  }

  public toData(): CallAuthorization.Data {
    return {
      '@type': '/minievm.evm.v1.CallAuthorization',
      contracts: this.contracts,
    }
  }

  public static fromProto(proto: CallAuthorization.Proto): CallAuthorization {
    return new CallAuthorization(proto.contracts)
  }

  public toProto(): CallAuthorization.Proto {
    return CallAuthorization_pb.fromPartial({
      contracts: this.contracts,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/minievm.evm.v1.CallAuthorization',
      value: CallAuthorization_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): CallAuthorization {
    return CallAuthorization.fromProto(
      CallAuthorization_pb.decode(msgAny.value)
    )
  }
}

export namespace CallAuthorization {
  export interface Amino {
    type: 'evm/CallAuthorization'
    value: {
      contracts: string[] | null
    }
  }

  export interface Data {
    '@type': '/minievm.evm.v1.CallAuthorization'
    contracts: string[]
  }

  export type Proto = CallAuthorization_pb
}
