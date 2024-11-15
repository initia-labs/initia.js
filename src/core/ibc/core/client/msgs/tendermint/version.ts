import { JSONSerializable } from '../../../../../../util/json'
import {
  Consensus as Consensus_pb,
  App as App_pb,
} from '@initia/initia.proto/tendermint/version/types'

/**
 * Consensus captures the consensus rules for processing a block in the blockchain,
 * including all blockchain data structures and the rules of the application's
 * state transition machine.
 */
export class Consensus extends JSONSerializable<
  any,
  Consensus.Data,
  Consensus.Proto
> {
  /**
   * @param block
   * @param app
   */
  constructor(
    public block: number,
    public app: number
  ) {
    super()
  }

  public static fromAmino(_: any): Consensus {
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(data: Consensus.Data): Consensus {
    const { block, app } = data
    return new Consensus(parseInt(block), parseInt(app))
  }

  public toData(): Consensus.Data {
    const { block, app } = this
    return {
      block: block.toFixed(),
      app: app.toFixed(),
    }
  }

  public static fromProto(proto: Consensus.Proto): Consensus {
    return new Consensus(Number(proto.block), Number(proto.app))
  }

  public toProto(): Consensus.Proto {
    const { block, app } = this
    return Consensus_pb.fromPartial({
      block: BigInt(block),
      app: BigInt(app),
    })
  }
}

export namespace Consensus {
  export interface Data {
    block: string
    app: string
  }

  export type Proto = Consensus_pb
}

/**
 * App captures the consensus rules for processing a block in the blockchain,
 * including all blockchain data structures and the rules of the application's
 * state transition machine.
 */
export class App extends JSONSerializable<any, App.Data, App.Proto> {
  /**
   * @param protocol
   * @param software
   */
  constructor(
    public protocol: number,
    public software: string
  ) {
    super()
  }

  public static fromAmino(_: any): App {
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(data: App.Data): App {
    const { protocol, software } = data
    return new App(parseInt(protocol), software)
  }

  public toData(): App.Data {
    const { protocol, software } = this
    return {
      protocol: protocol.toFixed(),
      software,
    }
  }

  public static fromProto(proto: App.Proto): App {
    return new App(Number(proto.protocol), proto.software)
  }

  public toProto(): App.Proto {
    const { protocol, software } = this
    return App_pb.fromPartial({
      protocol: BigInt(protocol),
      software,
    })
  }
}

export namespace App {
  export interface Data {
    protocol: string
    software: string
  }

  export type Proto = App_pb
}
