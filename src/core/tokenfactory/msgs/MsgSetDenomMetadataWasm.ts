import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { DenomMetadata } from '../../bank/DenomMetadata'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgSetDenomMetadata as MsgSetDenomMetadata_pb } from '@initia/initia.proto/miniwasm/tokenfactory/v1/tx'

/**
 * MsgSetDenomMetadataWasm allows an admin account to set the denom's bank metadata.
 */
export class MsgSetDenomMetadataWasm extends JSONSerializable<
  MsgSetDenomMetadataWasm.Amino,
  MsgSetDenomMetadataWasm.Data,
  MsgSetDenomMetadataWasm.Proto
> {
  /**
   * @param sender
   * @param metadata
   */
  constructor(
    public sender: AccAddress,
    public metadata: DenomMetadata
  ) {
    super()
  }

  public static fromAmino(
    data: MsgSetDenomMetadataWasm.Amino
  ): MsgSetDenomMetadataWasm {
    const {
      value: { sender, metadata },
    } = data
    return new MsgSetDenomMetadataWasm(
      sender,
      DenomMetadata.fromAmino(metadata)
    )
  }

  public toAmino(): MsgSetDenomMetadataWasm.Amino {
    const { sender, metadata } = this
    return {
      type: 'tokenfactory/MsgSetDenomMetadata',
      value: {
        sender,
        metadata: metadata.toAmino(),
      },
    }
  }

  public static fromData(
    data: MsgSetDenomMetadataWasm.Data
  ): MsgSetDenomMetadataWasm {
    const { sender, metadata } = data
    return new MsgSetDenomMetadataWasm(sender, DenomMetadata.fromData(metadata))
  }

  public toData(): MsgSetDenomMetadataWasm.Data {
    const { sender, metadata } = this
    return {
      '@type': '/miniwasm.tokenfactory.v1.MsgSetDenomMetadata',
      sender,
      metadata: metadata.toData(),
    }
  }

  public static fromProto(
    data: MsgSetDenomMetadataWasm.Proto
  ): MsgSetDenomMetadataWasm {
    return new MsgSetDenomMetadataWasm(
      data.sender,
      DenomMetadata.fromProto(data.metadata as DenomMetadata.Proto)
    )
  }

  public toProto(): MsgSetDenomMetadataWasm.Proto {
    const { sender, metadata } = this
    return MsgSetDenomMetadata_pb.fromPartial({
      sender,
      metadata: metadata.toProto(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/miniwasm.tokenfactory.v1.MsgSetDenomMetadata',
      value: MsgSetDenomMetadata_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgSetDenomMetadataWasm {
    return MsgSetDenomMetadataWasm.fromProto(
      MsgSetDenomMetadata_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgSetDenomMetadataWasm {
  export interface Amino {
    type: 'tokenfactory/MsgSetDenomMetadata'
    value: {
      sender: AccAddress
      metadata: DenomMetadata.Amino
    }
  }

  export interface Data {
    '@type': '/miniwasm.tokenfactory.v1.MsgSetDenomMetadata'
    sender: AccAddress
    metadata: DenomMetadata.Data
  }

  export type Proto = MsgSetDenomMetadata_pb
}
