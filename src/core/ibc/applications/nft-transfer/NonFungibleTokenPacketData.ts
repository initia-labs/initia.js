import { NonFungibleTokenPacketData as NonFungibleTokenPacketData_pb } from '@initia/initia.proto/ibc/applications/nft_transfer/v1/packet'
import { JSONSerializable } from '../../../../util/json'

/**
 * NonFungibleTokenPacketData defines a struct for the packet payload.
 * See NonFungibleTokenPacketData spec:
 * https://github.com/cosmos/ibc/tree/main/spec/app/ics-721-nft-transfer
 */
export class NonFungibleTokenPacketData extends JSONSerializable<
  NonFungibleTokenPacketData.Amino,
  NonFungibleTokenPacketData.Data,
  NonFungibleTokenPacketData.Proto
> {
  /**
   * @param class_id collection id == extension struct tag
   * @param class_uri collection url
   * @param class_data collection data
   * @param token_ids nft token ids
   * @param token_uris nft token uris
   * @param token_data nft token data array
   * @param sender sender of nft
   * @param receiver receiver of nft
   * @param memo optional memo field for future use
   */
  constructor(
    public class_id: string,
    public class_uri: string,
    public class_data: string,
    public token_ids: string[],
    public token_uris: string[],
    public token_data: string[],
    public sender: string,
    public receiver: string,
    public memo?: string
  ) {
    super()
  }

  public static fromAmino(
    data: NonFungibleTokenPacketData.Amino
  ): NonFungibleTokenPacketData {
    const {
      class_id,
      class_uri,
      class_data,
      token_ids,
      token_uris,
      token_data,
      sender,
      receiver,
      memo,
    } = data

    return new NonFungibleTokenPacketData(
      class_id,
      class_uri,
      class_data,
      token_ids,
      token_uris,
      token_data,
      sender,
      receiver,
      memo
    )
  }

  public toAmino(): NonFungibleTokenPacketData.Amino {
    const {
      class_id,
      class_uri,
      class_data,
      token_ids,
      token_uris,
      token_data,
      sender,
      receiver,
      memo,
    } = this

    return {
      class_id,
      class_uri,
      class_data,
      token_ids,
      token_uris,
      token_data,
      sender,
      receiver,
      memo,
    }
  }

  public static fromData(
    data: NonFungibleTokenPacketData.Data
  ): NonFungibleTokenPacketData {
    const {
      class_id,
      class_uri,
      class_data,
      token_ids,
      token_uris,
      token_data,
      sender,
      receiver,
      memo,
    } = data

    return new NonFungibleTokenPacketData(
      class_id,
      class_uri,
      class_data,
      token_ids,
      token_uris,
      token_data,
      sender,
      receiver,
      memo
    )
  }

  public toData(): NonFungibleTokenPacketData.Data {
    const {
      class_id,
      class_uri,
      class_data,
      token_ids,
      token_uris,
      token_data,
      sender,
      receiver,
      memo,
    } = this

    return {
      class_id,
      class_uri,
      class_data,
      token_ids,
      token_uris,
      token_data,
      sender,
      receiver,
      memo,
    }
  }

  public static fromProto(
    proto: NonFungibleTokenPacketData.Proto
  ): NonFungibleTokenPacketData {
    return new NonFungibleTokenPacketData(
      proto.classId,
      proto.classUri,
      proto.classData,
      proto.tokenIds,
      proto.tokenUris,
      proto.tokenData,
      proto.sender,
      proto.receiver,
      proto.memo
    )
  }

  public toProto(): NonFungibleTokenPacketData.Proto {
    const {
      class_id,
      class_uri,
      class_data,
      token_ids,
      token_uris,
      token_data,
      sender,
      receiver,
      memo,
    } = this

    return NonFungibleTokenPacketData_pb.fromPartial({
      classId: class_id,
      classUri: class_uri,
      classData: class_data,
      tokenIds: token_ids,
      tokenUris: token_uris,
      tokenData: token_data,
      sender,
      receiver,
      memo,
    })
  }
}

export namespace NonFungibleTokenPacketData {
  export interface Amino {
    class_id: string
    class_uri: string
    class_data: string
    token_ids: string[]
    token_uris: string[]
    token_data: string[]
    sender: string
    receiver: string
    memo?: string
  }

  export interface Data {
    class_id: string
    class_uri: string
    class_data: string
    token_ids: string[]
    token_uris: string[]
    token_data: string[]
    sender: string
    receiver: string
    memo?: string
  }

  export type Proto = NonFungibleTokenPacketData_pb
}
