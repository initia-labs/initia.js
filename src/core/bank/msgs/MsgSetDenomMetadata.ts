import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { DenomMetadata } from '../DenomMetadata'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgSetDenomMetadata as MsgSetDenomMetadata_pb } from '@initia/initia.proto/initia/bank/v1/tx'

/**
 * MsgSetDenomMetadata defines a governance operation for updating the bank
 * denom metadata. The authority is defined in the keeper.
 */
export class MsgSetDenomMetadata extends JSONSerializable<
  MsgSetDenomMetadata.Amino,
  MsgSetDenomMetadata.Data,
  MsgSetDenomMetadata.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param metadata the bank denom metadata to update
   */
  constructor(
    public authority: AccAddress,
    public metadata: DenomMetadata
  ) {
    super()
  }

  public static fromAmino(
    data: MsgSetDenomMetadata.Amino
  ): MsgSetDenomMetadata {
    const {
      value: { authority, metadata },
    } = data
    return new MsgSetDenomMetadata(authority, DenomMetadata.fromAmino(metadata))
  }

  public toAmino(): MsgSetDenomMetadata.Amino {
    const { authority, metadata } = this
    return {
      type: 'bank/MsgSetDenomMetadata',
      value: {
        authority,
        metadata: metadata.toAmino(),
      },
    }
  }

  public static fromData(data: MsgSetDenomMetadata.Data): MsgSetDenomMetadata {
    const { authority, metadata } = data
    return new MsgSetDenomMetadata(authority, DenomMetadata.fromData(metadata))
  }

  public toData(): MsgSetDenomMetadata.Data {
    const { authority, metadata } = this
    return {
      '@type': '/initia.bank.v1.MsgSetDenomMetadata',
      authority,
      metadata: metadata.toData(),
    }
  }

  public static fromProto(
    data: MsgSetDenomMetadata.Proto
  ): MsgSetDenomMetadata {
    return new MsgSetDenomMetadata(
      data.authority,
      DenomMetadata.fromProto(data.metadata as DenomMetadata.Proto)
    )
  }

  public toProto(): MsgSetDenomMetadata.Proto {
    const { authority, metadata } = this
    return MsgSetDenomMetadata_pb.fromPartial({
      authority,
      metadata: metadata.toProto(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.bank.v1.MsgSetDenomMetadata',
      value: MsgSetDenomMetadata_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgSetDenomMetadata {
    return MsgSetDenomMetadata.fromProto(
      MsgSetDenomMetadata_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgSetDenomMetadata {
  export interface Amino {
    type: 'bank/MsgSetDenomMetadata'
    value: {
      authority: AccAddress
      metadata: DenomMetadata.Amino
    }
  }

  export interface Data {
    '@type': '/initia.bank.v1.MsgSetDenomMetadata'
    authority: AccAddress
    metadata: DenomMetadata.Data
  }

  export type Proto = MsgSetDenomMetadata_pb
}
