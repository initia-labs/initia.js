import { SemiFungibleTokenPacketData as SemiFungibleTokenPacketData_pb } from '@initia/initia.proto/ibc/applications/sft_transfer/v1/packet';
import { JSONSerializable } from '../../../../util/json';

/**
 *  SemiFungibleTokenPacketData defines a struct for the packet payload
 */
export class SemiFungibleTokenPacketData extends JSONSerializable<
  SemiFungibleTokenPacketData.Amino,
  SemiFungibleTokenPacketData.Data,
  SemiFungibleTokenPacketData.Proto
> {
  /**
   * @param class_id collection id == extension struct tag
   * @param class_uri collection url
   * @param class_data collection data
   * @param token_ids sft token ids
   * @param token_amounts sft token amounts
   * @param token_uris sft token uris
   * @param token_data sft token data array
   * @param sender sender of sft
   * @param receiver receiver of sft
   * @param memo optional memo field for future use
   */
  constructor(
    public class_id: string,
    public class_uri: string,
    public class_data: string,
    public token_ids: string[],
    public token_amounts: string[],
    public token_uris: string[],
    public token_data: string[],
    public sender: string,
    public receiver: string,
    public memo?: string
  ) {
    super();
  }

  public static fromAmino(
    data: SemiFungibleTokenPacketData.Amino
  ): SemiFungibleTokenPacketData {
    const {
      class_id,
      class_uri,
      class_data,
      token_ids,
      token_amounts,
      token_uris,
      token_data,
      sender,
      receiver,
      memo,
    } = data;

    return new SemiFungibleTokenPacketData(
      class_id,
      class_uri,
      class_data,
      token_ids,
      token_amounts,
      token_uris,
      token_data,
      sender,
      receiver,
      memo
    );
  }

  public toAmino(): SemiFungibleTokenPacketData.Amino {
    const {
      class_id,
      class_uri,
      class_data,
      token_ids,
      token_amounts,
      token_uris,
      token_data,
      sender,
      receiver,
      memo,
    } = this;

    return {
      class_id,
      class_uri,
      class_data,
      token_ids,
      token_amounts,
      token_uris,
      token_data,
      sender,
      receiver,
      memo,
    };
  }

  public static fromData(
    data: SemiFungibleTokenPacketData.Data
  ): SemiFungibleTokenPacketData {
    const {
      class_id,
      class_uri,
      class_data,
      token_ids,
      token_amounts,
      token_uris,
      token_data,
      sender,
      receiver,
      memo,
    } = data;

    return new SemiFungibleTokenPacketData(
      class_id,
      class_uri,
      class_data,
      token_ids,
      token_amounts,
      token_uris,
      token_data,
      sender,
      receiver,
      memo
    );
  }

  public toData(): SemiFungibleTokenPacketData.Data {
    const {
      class_id,
      class_uri,
      class_data,
      token_ids,
      token_amounts,
      token_uris,
      token_data,
      sender,
      receiver,
      memo,
    } = this;

    return {
      class_id,
      class_uri,
      class_data,
      token_ids,
      token_amounts,
      token_uris,
      token_data,
      sender,
      receiver,
      memo,
    };
  }

  public static fromProto(
    proto: SemiFungibleTokenPacketData.Proto
  ): SemiFungibleTokenPacketData {
    return new SemiFungibleTokenPacketData(
      proto.classId,
      proto.classUri,
      proto.classData,
      proto.tokenIds,
      proto.tokenAmounts,
      proto.tokenUris,
      proto.tokenData,
      proto.sender,
      proto.receiver,
      proto.memo
    );
  }

  public toProto(): SemiFungibleTokenPacketData.Proto {
    const {
      class_id,
      class_uri,
      class_data,
      token_ids,
      token_amounts,
      token_uris,
      token_data,
      sender,
      receiver,
      memo,
    } = this;

    return SemiFungibleTokenPacketData_pb.fromPartial({
      classId: class_id,
      classUri: class_uri,
      classData: class_data,
      tokenIds: token_ids,
      tokenAmounts: token_amounts,
      tokenUris: token_uris,
      tokenData: token_data,
      sender,
      receiver,
      memo,
    });
  }
}

export namespace SemiFungibleTokenPacketData {
  export interface Amino {
    class_id: string;
    class_uri: string;
    class_data: string;
    token_ids: string[];
    token_amounts: string[];
    token_uris: string[];
    token_data: string[];
    sender: string;
    receiver: string;
    memo?: string;
  }

  export interface Data {
    class_id: string;
    class_uri: string;
    class_data: string;
    token_ids: string[];
    token_amounts: string[];
    token_uris: string[];
    token_data: string[];
    sender: string;
    receiver: string;
    memo?: string;
  }

  export type Proto = SemiFungibleTokenPacketData_pb;
}
