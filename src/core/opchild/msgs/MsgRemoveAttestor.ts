import { JSONSerializable } from '../../../util/json'
import { AccAddress, ValAddress } from '../../bech32'
import { MsgRemoveAttestor as MsgRemoveAttestor_pb } from '@initia/opinit.proto/opinit/opchild/v1/tx'
import { Any } from '@initia/initia.proto/google/protobuf/any'

/**
 * MsgRemoveAttestor is a message to remove a attestor from the validator set.
 */
export class MsgRemoveAttestor extends JSONSerializable<
  MsgRemoveAttestor.Amino,
  MsgRemoveAttestor.Data,
  MsgRemoveAttestor.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param attestor_address
   */
  constructor(
    public authority: AccAddress,
    public attestor_address: ValAddress
  ) {
    super()
  }

  public static fromAmino(data: MsgRemoveAttestor.Amino): MsgRemoveAttestor {
    const {
      value: { authority, attestor_address },
    } = data
    return new MsgRemoveAttestor(authority, attestor_address)
  }

  public toAmino(): MsgRemoveAttestor.Amino {
    const { authority, attestor_address } = this
    return {
      type: 'opchild/MsgRemoveAttestor',
      value: {
        authority,
        attestor_address,
      },
    }
  }

  public static fromData(data: MsgRemoveAttestor.Data): MsgRemoveAttestor {
    const { authority, attestor_address } = data
    return new MsgRemoveAttestor(authority, attestor_address)
  }

  public toData(): MsgRemoveAttestor.Data {
    const { authority, attestor_address } = this
    return {
      '@type': '/opinit.opchild.v1.MsgRemoveAttestor',
      authority,
      attestor_address,
    }
  }

  public static fromProto(data: MsgRemoveAttestor.Proto): MsgRemoveAttestor {
    return new MsgRemoveAttestor(data.authority, data.attestorAddress)
  }

  public toProto(): MsgRemoveAttestor.Proto {
    const { authority, attestor_address } = this
    return MsgRemoveAttestor_pb.fromPartial({
      authority,
      attestorAddress: attestor_address,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.opchild.v1.MsgRemoveAttestor',
      value: MsgRemoveAttestor_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgRemoveAttestor {
    return MsgRemoveAttestor.fromProto(
      MsgRemoveAttestor_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgRemoveAttestor {
  export interface Amino {
    type: 'opchild/MsgRemoveAttestor'
    value: {
      authority: AccAddress
      attestor_address: ValAddress
    }
  }

  export interface Data {
    '@type': '/opinit.opchild.v1.MsgRemoveAttestor'
    authority: AccAddress
    attestor_address: ValAddress
  }

  export type Proto = MsgRemoveAttestor_pb
}
