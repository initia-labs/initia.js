import { JSONSerializable } from '../../util/json'
import { AbsoluteTxPosition as AbsoluteTxPosition_pb } from '@initia/initia.proto/cosmwasm/wasm/v1/types'

export class AbsoluteTxPosition extends JSONSerializable<
  AbsoluteTxPosition.Amino,
  AbsoluteTxPosition.Data,
  AbsoluteTxPosition.Proto
> {
  /**
   * @param block_height the block the contract was created at
   * @param tx_index a monotonic counter within the block (actual transaction index, or gas consumed)
   */
  constructor(
    public block_height: number,
    public tx_index: number
  ) {
    super()
  }

  public static fromAmino(data: AbsoluteTxPosition.Amino): AbsoluteTxPosition {
    const { block_height, tx_index } = data
    return new AbsoluteTxPosition(parseInt(block_height), parseInt(tx_index))
  }

  public toAmino(): AbsoluteTxPosition.Amino {
    const { block_height, tx_index } = this
    return {
      block_height: block_height.toFixed(),
      tx_index: tx_index.toFixed(),
    }
  }

  public static fromData(data: AbsoluteTxPosition.Data): AbsoluteTxPosition {
    const { block_height, tx_index } = data
    return new AbsoluteTxPosition(parseInt(block_height), parseInt(tx_index))
  }

  public toData(): AbsoluteTxPosition.Data {
    const { block_height, tx_index } = this
    return {
      block_height: block_height.toFixed(),
      tx_index: tx_index.toFixed(),
    }
  }

  public static fromProto(data: AbsoluteTxPosition.Proto): AbsoluteTxPosition {
    return new AbsoluteTxPosition(
      data.blockHeight.toNumber(),
      data.txIndex.toNumber()
    )
  }

  public toProto(): AbsoluteTxPosition.Proto {
    const { block_height, tx_index } = this
    return AbsoluteTxPosition_pb.fromPartial({
      blockHeight: block_height,
      txIndex: tx_index,
    })
  }
}

export namespace AbsoluteTxPosition {
  export interface Amino {
    block_height: string
    tx_index: string
  }

  export interface Data {
    block_height: string
    tx_index: string
  }

  export type Proto = AbsoluteTxPosition_pb
}
