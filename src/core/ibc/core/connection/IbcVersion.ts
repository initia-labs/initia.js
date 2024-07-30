import { Version as Version_pb } from '@initia/initia.proto/ibc/core/connection/v1/connection'
import { JSONSerializable } from '../../../../util/json'

/*
 * IbcVersion defines the versioning scheme used to negotiate the IBC version in the connection handshake.
 */
export class IbcVersion extends JSONSerializable<
  IbcVersion.Amino,
  IbcVersion.Data,
  IbcVersion.Proto
> {
  /**
   * @param identifier unique version identifier
   * @param features list of features compatible with the specified identifier
   */
  constructor(
    public identifier: string,
    public features: string[]
  ) {
    super()
  }

  public static fromAmino(data: IbcVersion.Amino): IbcVersion {
    const { identifier, features } = data
    return new IbcVersion(identifier, features)
  }

  public toAmino(): IbcVersion.Amino {
    const { identifier, features } = this
    const res: IbcVersion.Amino = {
      identifier,
      features,
    }
    return res
  }

  public static fromData(data: IbcVersion.Data): IbcVersion {
    const { identifier, features } = data
    return new IbcVersion(identifier, features)
  }

  public toData(): IbcVersion.Data {
    const { identifier, features } = this
    const res: IbcVersion.Data = {
      identifier,
      features,
    }
    return res
  }

  public static fromProto(proto: IbcVersion.Proto): IbcVersion {
    return new IbcVersion(proto.identifier, proto.features)
  }

  public toProto(): IbcVersion.Proto {
    const { identifier, features } = this
    return Version_pb.fromPartial({ identifier, features })
  }
}

export namespace IbcVersion {
  export interface Amino {
    identifier: string
    features: string[]
  }

  export interface Data {
    identifier: string
    features: string[]
  }

  export type Proto = Version_pb
}
