import { Height as Height_pb } from '@initia/initia.proto/ibc/core/client/v1/client'
import { JSONSerializable } from '../../../../util/json'

/**
 * Height is a monotonically increasing data type
 * that can be compared against another Height for the purposes of updating and
 * freezing clients.
 *
 * Normally the RevisionHeight is incremented at each height while keeping
 * RevisionNumber the same. However some consensus algorithms may choose to
 * reset the height in certain conditions e.g. hard forks, state-machine
 * breaking changes In these cases, the RevisionNumber is incremented so that
 * height continues to be monitonically increasing even as the RevisionHeight
 * gets reset.
 */
export class Height extends JSONSerializable<
  Height.Amino,
  Height.Data,
  Height.Proto
> {
  /**
   * @param revision_number the revision that the client is currently on
   * @param revision_height the height within the given revision
   */
  constructor(
    public revision_number: number,
    public revision_height: number
  ) {
    super()
  }

  public static fromAmino(data: Height.Amino): Height {
    const { revision_number, revision_height } = data
    return new Height(
      parseInt(revision_number ?? '0'),
      parseInt(revision_height ?? '0')
    )
  }

  public toAmino(): Height.Amino {
    const { revision_number, revision_height } = this
    return {
      revision_number:
        revision_number > 0 ? revision_number.toFixed() : undefined,
      revision_height:
        revision_height > 0 ? revision_height.toFixed() : undefined,
    }
  }

  public static fromData(data: Height.Data): Height {
    const { revision_number, revision_height } = data
    return new Height(parseInt(revision_number), parseInt(revision_height))
  }

  public toData(): Height.Data {
    const { revision_number, revision_height } = this
    return {
      revision_number: revision_number.toFixed(),
      revision_height: revision_height.toFixed(),
    }
  }

  public static fromProto(proto: Height.Proto): Height {
    return new Height(
      Number(proto.revisionNumber),
      Number(proto.revisionHeight)
    )
  }

  public toProto(): Height.Proto {
    const { revision_number, revision_height } = this
    return Height_pb.fromPartial({
      revisionNumber: BigInt(revision_number),
      revisionHeight: BigInt(revision_height),
    })
  }
}

export namespace Height {
  export interface Amino {
    revision_number?: string
    revision_height?: string
  }

  export interface Data {
    revision_number: string
    revision_height: string
  }

  export type Proto = Height_pb
}
