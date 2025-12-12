import { JSONSerializable } from '../../../util/json'
import { AccAddress, ValAddress } from '../../bech32'
import { ValConsPublicKey } from '../../PublicKey'
import { MsgAddAttestor as MsgAddAttestor_pb } from '@initia/opinit.proto/opinit/opchild/v1/tx'
import { Any } from '@initia/initia.proto/google/protobuf/any'

/**
 * MsgAddAttestor defines a SDK message for adding a new attestor.
 */
export class MsgAddAttestor extends JSONSerializable<
  MsgAddAttestor.Amino,
  MsgAddAttestor.Data,
  MsgAddAttestor.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param moniker
   * @param attestor_address
   * @param pubkey
   */
  constructor(
    public authority: AccAddress,
    public moniker: string,
    public attestor_address: ValAddress,
    public pubkey: ValConsPublicKey
  ) {
    super()
  }

  public static fromAmino(data: MsgAddAttestor.Amino): MsgAddAttestor {
    const {
      value: { authority, moniker, attestor_address, pubkey },
    } = data

    return new MsgAddAttestor(
      authority,
      moniker,
      attestor_address,
      ValConsPublicKey.fromAmino(pubkey)
    )
  }

  public toAmino(): MsgAddAttestor.Amino {
    const { authority, moniker, attestor_address, pubkey } = this
    return {
      type: 'opchild/MsgAddAttestor',
      value: {
        authority,
        moniker,
        attestor_address,
        pubkey: pubkey.toAmino(),
      },
    }
  }

  public static fromData(data: MsgAddAttestor.Data): MsgAddAttestor {
    const { authority, moniker, attestor_address, pubkey } = data
    return new MsgAddAttestor(
      authority,
      moniker,
      attestor_address,
      ValConsPublicKey.fromData(pubkey)
    )
  }

  public toData(): MsgAddAttestor.Data {
    const { authority, moniker, attestor_address, pubkey } = this
    return {
      '@type': '/opinit.opchild.v1.MsgAddAttestor',
      authority,
      moniker,
      attestor_address,
      pubkey: pubkey.toData(),
    }
  }

  public static fromProto(data: MsgAddAttestor.Proto): MsgAddAttestor {
    return new MsgAddAttestor(
      data.authority,
      data.moniker,
      data.attestorAddress,
      ValConsPublicKey.unpackAny(data.pubkey as Any)
    )
  }

  public toProto(): MsgAddAttestor.Proto {
    const { authority, moniker, attestor_address, pubkey } = this
    return MsgAddAttestor_pb.fromPartial({
      authority,
      moniker,
      attestorAddress: attestor_address,
      pubkey: pubkey.packAny(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.opchild.v1.MsgAddAttestor',
      value: MsgAddAttestor_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgAddAttestor {
    return MsgAddAttestor.fromProto(MsgAddAttestor_pb.decode(msgAny.value))
  }
}

export namespace MsgAddAttestor {
  export interface Amino {
    type: 'opchild/MsgAddAttestor'
    value: {
      authority: AccAddress
      moniker: string
      attestor_address: ValAddress
      pubkey: ValConsPublicKey.Amino
    }
  }

  export interface Data {
    '@type': '/opinit.opchild.v1.MsgAddAttestor'
    authority: AccAddress
    moniker: string
    attestor_address: ValAddress
    pubkey: ValConsPublicKey.Data
  }

  export type Proto = MsgAddAttestor_pb
}
