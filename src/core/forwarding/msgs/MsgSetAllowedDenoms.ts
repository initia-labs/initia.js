import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgSetAllowedDenoms as MsgSetAllowedDenoms_pb } from '@initia/initia.proto/noble/forwarding/v1/tx'

/**
 * MsgSetAllowedDenoms sets allowed denoms.
 */
export class MsgSetAllowedDenoms extends JSONSerializable<
  MsgSetAllowedDenoms.Amino,
  MsgSetAllowedDenoms.Data,
  MsgSetAllowedDenoms.Proto
> {
  /**
   * @param signer
   * @param denoms
   */
  constructor(
    public signer: AccAddress,
    public denoms: string[]
  ) {
    super()
  }

  public static fromAmino(
    data: MsgSetAllowedDenoms.Amino
  ): MsgSetAllowedDenoms {
    const {
      value: { signer, denoms },
    } = data
    return new MsgSetAllowedDenoms(signer, denoms)
  }

  public toAmino(): MsgSetAllowedDenoms.Amino {
    const { signer, denoms } = this
    return {
      type: 'noble/forwarding/SetAllowedDenoms',
      value: {
        signer,
        denoms,
      },
    }
  }

  public static fromData(data: MsgSetAllowedDenoms.Data): MsgSetAllowedDenoms {
    const { signer, denoms } = data
    return new MsgSetAllowedDenoms(signer, denoms)
  }

  public toData(): MsgSetAllowedDenoms.Data {
    const { signer, denoms } = this
    return {
      '@type': '/noble.forwarding.v1.MsgSetAllowedDenoms',
      signer,
      denoms,
    }
  }

  public static fromProto(
    data: MsgSetAllowedDenoms.Proto
  ): MsgSetAllowedDenoms {
    return new MsgSetAllowedDenoms(data.signer, data.denoms)
  }

  public toProto(): MsgSetAllowedDenoms.Proto {
    const { signer, denoms } = this
    return MsgSetAllowedDenoms_pb.fromPartial({
      signer,
      denoms,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/noble.forwarding.v1.MsgSetAllowedDenoms',
      value: MsgSetAllowedDenoms_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgSetAllowedDenoms {
    return MsgSetAllowedDenoms.fromProto(
      MsgSetAllowedDenoms_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgSetAllowedDenoms {
  export interface Amino {
    type: 'noble/forwarding/SetAllowedDenoms'
    value: {
      signer: AccAddress
      denoms: string[]
    }
  }

  export interface Data {
    '@type': '/noble.forwarding.v1.MsgSetAllowedDenoms'
    signer: AccAddress
    denoms: string[]
  }

  export type Proto = MsgSetAllowedDenoms_pb
}
