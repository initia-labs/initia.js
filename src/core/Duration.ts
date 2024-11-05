import { Duration as Duration_pb } from '@initia/initia.proto/google/protobuf/duration'
import Long from 'long'

/**
 * A Duration represents a signed, fixed-length span of time represented
 * as a count of seconds and fractions of seconds at nanosecond
 * resolution. It is independent of any calendar and concepts like "day"
 * or "month". It is related to Timestamp in that the difference between
 * two Timestamp values is a Duration and it can be added or subtracted
 * from a Timestamp. Range is approximately +-10,000 years.
 *
 * # JSON Mapping
 *
 * In JSON format, the Duration type is encoded as a string rather than an
 * object, where the string ends in the suffix "s" (indicating seconds) and
 * is preceded by the number of seconds, with nanoseconds expressed as
 * fractional seconds. For example, 3 seconds with 0 nanoseconds should be
 * encoded in JSON format as "3s", while 3 seconds and 1 nanosecond should
 * be expressed in JSON format as "3.000000001s", and 3 seconds and 1
 * microsecond should be expressed in JSON format as "3.000001s".
 */
export class Duration {
  public seconds: Long
  public nanos: number

  constructor(seconds: number, nanos = 0) {
    const [sec, nano] = (nanos / Math.pow(10, 9) + seconds)
      .toFixed(9)
      .split('.')
    this.seconds = Long.fromString(sec)
    this.nanos = parseInt(nano)
  }

  public static fromString(str: string): Duration {
    const [sec, nano] = parseFloat(str.replace('s', '')).toFixed(9).split('.')
    return new Duration(parseInt(sec), parseInt(nano))
  }

  public toString(): string {
    return `${this.nanos / Math.pow(10, 9) + this.seconds.toNumber()}s`
  }

  public static fromAmino(amino: Duration.Amino): Duration {
    return Duration.fromString(amino)
  }

  public toAmino(): Duration.Amino {
    return this.toString()
  }

  public static fromData(data: Duration.Data): Duration {
    return Duration.fromString(data)
  }

  public toData(): Duration.Data {
    return this.toString()
  }

  public static fromProto(proto: Duration.Proto): Duration {
    return new Duration(proto.seconds.toNumber(), proto.nanos)
  }

  public toProto(): Duration.Proto {
    return { seconds: this.seconds, nanos: this.nanos }
  }
}

export namespace Duration {
  export type Amino = string
  export type Data = string
  export type Proto = Duration_pb
}
