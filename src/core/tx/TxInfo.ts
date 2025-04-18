import { Tx } from './Tx'
import {
  ABCIMessageLog as ABCIMessageLog_pb,
  TxResponse as TxResponse_pb,
} from '@initia/initia.proto/cosmos/base/abci/v1beta1/abci'
import { Any } from '@initia/initia.proto/google/protobuf/any'

/**
 * TxInfo is used to capture information from a transaction lookup for
 * a transaction already included in a block
 */
export class TxInfo {
  /**
   * @param height height of the block in which the transaction was included
   * @param txhash transaction's hash
   * @param raw_log raw log information, as a string
   * @param logs log information
   * @param gas_wanted gas limited submitted in fee
   * @param gas_used actual gas consumption
   * @param tx transaction content
   * @param timestamp time of inclusion
   * @param events events
   * @param code error code
   * @param codespace error codespace
   */
  constructor(
    public height: number,
    public txhash: string,
    public raw_log: string,
    public logs: TxLog[] | undefined,
    public gas_wanted: number,
    public gas_used: number,
    public tx: Tx,
    public timestamp: string,
    public events: Event[],
    public code?: number,
    public codespace?: string
  ) {}

  public static fromProto(proto: TxInfo.Proto): TxInfo {
    return new TxInfo(
      Number(proto.height),
      proto.txhash,
      proto.rawLog,
      proto.logs.map(TxLog.fromProto),
      Number(proto.gasWanted),
      Number(proto.gasUsed),
      Tx.unpackAny(proto.tx as Any),
      proto.timestamp,
      proto.events,
      proto.code,
      proto.codespace
    )
  }

  public static fromData(data: TxInfo.Data): TxInfo {
    return new TxInfo(
      parseInt(data.height),
      data.txhash,
      data.raw_log,
      data.logs.map(TxLog.fromData),
      parseInt(data.gas_wanted),
      parseInt(data.gas_used),
      Tx.fromData(data.tx),
      data.timestamp,
      data.events,
      data.code,
      data.codespace
    )
  }
}

export interface EventKV {
  key: string
  value: string
}

export interface Event {
  type: string
  attributes: EventKV[]
}

// Record<EvnetType, Map<AttributeKey, AttributeValue[]>>
export type EventsByType = Record<
  /*eventType*/ string,
  /*attributes*/ Map</*key*/ string, /*value*/ string[]>
>

export namespace EventsByType {
  export function parse(eventAmino: Event[]): EventsByType {
    const events: EventsByType = {}
    eventAmino.forEach((ev) => {
      ev.attributes.forEach((attr) => {
        if (!(ev.type in events)) {
          events[ev.type] = new Map<string, string[]>()
        }

        if (!(attr.key in events[ev.type])) {
          events[ev.type].set(attr.key, [])
        }
        events[ev.type].get(attr.key)!.push(attr.value)
      })
    })
    return events
  }
}

export class TxLog {
  public eventsByType: EventsByType

  constructor(
    public msg_index: number,
    public log: string,
    public events: Event[]
  ) {
    this.eventsByType = EventsByType.parse(this.events)
  }

  public static fromData(data: TxLog.Data): TxLog {
    return new TxLog(
      data.msg_index,
      data.log,
      data.events.map((e) => {
        return {
          type: e.type,
          attributes: e.attributes.map((attr) => {
            return {
              key: attr.key,
              value: attr.value,
            }
          }),
        }
      })
    )
  }

  public toData(): TxLog.Data {
    const { msg_index, log, events, eventsByType } = this
    return {
      msg_index,
      log,
      events,
      eventsByType,
    }
  }

  public static fromProto(proto: TxLog.Proto): TxLog {
    return new TxLog(
      proto.msgIndex,
      proto.log,
      proto.events.map((e) => {
        return {
          type: e.type,
          attributes: e.attributes.map((attr) => {
            return {
              key: attr.key,
              value: attr.value,
            }
          }),
        }
      })
    )
  }

  public toProto(): TxLog.Proto {
    const { msg_index, log, events } = this
    return ABCIMessageLog_pb.fromPartial({
      msgIndex: msg_index,
      log,
      events,
    })
  }
}

export namespace TxLog {
  export interface Data {
    msg_index: number
    log: string
    events: { type: string; attributes: { key: string; value: string }[] }[]
    eventsByType: EventsByType
  }
  export type Proto = ABCIMessageLog_pb
}

export namespace TxInfo {
  export interface Data {
    height: string
    txhash: string
    codespace: string
    code: number
    data: string
    raw_log: string
    logs: TxLog.Data[]
    info: string
    gas_wanted: string
    gas_used: string
    tx: Tx.Data
    timestamp: string
    events: Event[]
  }
  export type Proto = TxResponse_pb
}
