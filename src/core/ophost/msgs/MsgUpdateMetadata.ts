import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { MsgUpdateMetadata as MsgUpdateMetadata_pb } from '@initia/opinit.proto/opinit/ophost/v1/tx'
import { Any } from '@initia/initia.proto/google/protobuf/any'

export class MsgUpdateMetadata extends JSONSerializable<
  MsgUpdateMetadata.Amino,
  MsgUpdateMetadata.Data,
  MsgUpdateMetadata.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param bridge_id
   * @param metadata
   */
  constructor(
    public authority: AccAddress,
    public bridge_id: number,
    public metadata: string
  ) {
    super()
  }

  public static fromAmino(data: MsgUpdateMetadata.Amino): MsgUpdateMetadata {
    const {
      value: { authority, bridge_id, metadata },
    } = data

    return new MsgUpdateMetadata(authority, parseInt(bridge_id), metadata)
  }

  public toAmino(): MsgUpdateMetadata.Amino {
    const { authority, bridge_id, metadata } = this
    return {
      type: 'ophost/MsgUpdateMetadata',
      value: {
        authority,
        bridge_id: bridge_id.toFixed(),
        metadata,
      },
    }
  }

  public static fromData(data: MsgUpdateMetadata.Data): MsgUpdateMetadata {
    const { authority, bridge_id, metadata } = data
    return new MsgUpdateMetadata(authority, parseInt(bridge_id), metadata)
  }

  public toData(): MsgUpdateMetadata.Data {
    const { authority, bridge_id, metadata } = this
    return {
      '@type': '/opinit.ophost.v1.MsgUpdateMetadata',
      authority,
      bridge_id: bridge_id.toFixed(),
      metadata,
    }
  }

  public static fromProto(data: MsgUpdateMetadata.Proto): MsgUpdateMetadata {
    return new MsgUpdateMetadata(
      data.authority,
      data.bridgeId.toNumber(),
      Buffer.from(data.metadata).toString('base64')
    )
  }

  public toProto(): MsgUpdateMetadata.Proto {
    const { authority, bridge_id, metadata } = this
    return MsgUpdateMetadata_pb.fromPartial({
      authority,
      bridgeId: bridge_id,
      metadata: Buffer.from(metadata, 'base64'),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.ophost.v1.MsgUpdateMetadata',
      value: MsgUpdateMetadata_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgUpdateMetadata {
    return MsgUpdateMetadata.fromProto(
      MsgUpdateMetadata_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgUpdateMetadata {
  export interface Amino {
    type: 'ophost/MsgUpdateMetadata'
    value: {
      authority: AccAddress
      bridge_id: string
      metadata: string
    }
  }

  export interface Data {
    '@type': '/opinit.ophost.v1.MsgUpdateMetadata'
    authority: AccAddress
    bridge_id: string
    metadata: string
  }

  export type Proto = MsgUpdateMetadata_pb
}
