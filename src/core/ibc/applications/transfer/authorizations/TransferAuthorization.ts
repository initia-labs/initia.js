import { JSONSerializable } from '../../../../../util/json'
import { TransferAuthorization as TransferAuthorization_pb } from '@initia/initia.proto/ibc/applications/transfer/v1/authz'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { Allocation } from './Allocation'

/**
 * TransferAuthorization allows the grantee to spend up to spend_limit coins from
 * the granter's account for ibc transfer on a specific channel.
 */
export class TransferAuthorization extends JSONSerializable<
  any,
  TransferAuthorization.Data,
  TransferAuthorization.Proto
> {
  /**
   * @param allocations port and channel amounts
   */
  constructor(public allocations: Allocation[]) {
    super()
  }

  public static fromAmino(_: any): TransferAuthorization {
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(
    data: TransferAuthorization.Data
  ): TransferAuthorization {
    return new TransferAuthorization(data.allocations.map(Allocation.fromData))
  }

  public toData(): TransferAuthorization.Data {
    return {
      '@type': '/ibc.applications.transfer.v1.TransferAuthorization',
      allocations: this.allocations.map((alloc) => alloc.toData()),
    }
  }

  public static fromProto(
    data: TransferAuthorization.Proto
  ): TransferAuthorization {
    return new TransferAuthorization(data.allocations.map(Allocation.fromProto))
  }

  public toProto(): TransferAuthorization.Proto {
    return TransferAuthorization_pb.fromPartial({
      allocations: this.allocations.map((alloc) => alloc.toProto()),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.applications.transfer.v1.TransferAuthorization',
      value: TransferAuthorization_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): TransferAuthorization {
    return TransferAuthorization.fromProto(
      TransferAuthorization_pb.decode(msgAny.value)
    )
  }
}

export namespace TransferAuthorization {
  export interface Data {
    '@type': '/ibc.applications.transfer.v1.TransferAuthorization'
    allocations: Allocation.Data[]
  }

  export type Proto = TransferAuthorization_pb
}
