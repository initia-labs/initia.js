import { JSONSerializable } from '../../../../util/json'
import { ErrorReceipt as ErrorReceipt_pb } from '@initia/initia.proto/ibc/core/channel/v1/upgrade'

/**
 * ErrorReceipt defines a type which encapsulates the upgrade sequence and error associated with the
 * upgrade handshake failure. When a channel upgrade handshake is aborted both chains are expected to increment to the
 * next sequence.
 */
export class ErrorReceipt extends JSONSerializable<
  any,
  ErrorReceipt.Data,
  ErrorReceipt.Proto
> {
  /**
   * @param sequence the channel upgrade sequence
   * @param message the error message detailing the cause of failure
   */
  constructor(
    public sequence: number,
    public message: string
  ) {
    super()
  }

  public static fromAmino(_: any): ErrorReceipt {
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(data: ErrorReceipt.Data): ErrorReceipt {
    const { sequence, message } = data
    return new ErrorReceipt(
      Number(sequence),
      message
    )
  }

  public toData(): ErrorReceipt.Data {
    const { sequence, message } = this
    return {
      sequence: sequence.toString(),
      message,
    }
  }

  public static fromProto(proto: ErrorReceipt.Proto): ErrorReceipt {
    return new ErrorReceipt(
      Number(proto.sequence),
      proto.message
    )
  }

  public toProto(): ErrorReceipt.Proto {
    const { sequence, message } = this
    return ErrorReceipt_pb.fromPartial({
      sequence: BigInt(sequence),
      message,
    })
  }
}

export namespace ErrorReceipt {
  export interface Data {
    sequence: string
    message: string
  }

  export type Proto = ErrorReceipt_pb
}
