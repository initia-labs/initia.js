import { JSONSerializable } from '../../util/json'
import { ABCIParams as ABCIParams_pb } from '@initia/initia.proto/tendermint/types/params'

/**
 * ABCIParams defines the set of abci parameters.
 */
export class ABCIParams extends JSONSerializable<
  ABCIParams.Amino,
  ABCIParams.Data,
  ABCIParams.Proto
> {
  /**
   * @param vote_extensions_enable_height
   */
  constructor(public vote_extensions_enable_height: number) {
    super()
  }

  public static fromAmino(data: ABCIParams.Amino): ABCIParams {
    return new ABCIParams(parseInt(data.vote_extensions_enable_height))
  }

  public toAmino(): ABCIParams.Amino {
    return {
      vote_extensions_enable_height:
        this.vote_extensions_enable_height.toFixed(),
    }
  }

  public static fromData(data: ABCIParams.Data): ABCIParams {
    return new ABCIParams(parseInt(data.vote_extensions_enable_height))
  }

  public toData(): ABCIParams.Data {
    return {
      vote_extensions_enable_height:
        this.vote_extensions_enable_height.toFixed(),
    }
  }

  public static fromProto(data: ABCIParams.Proto): ABCIParams {
    return new ABCIParams(Number(data.voteExtensionsEnableHeight))
  }

  public toProto(): ABCIParams.Proto {
    return ABCIParams_pb.fromPartial({
      voteExtensionsEnableHeight: BigInt(this.vote_extensions_enable_height),
    })
  }
}

export namespace ABCIParams {
  export interface Amino {
    vote_extensions_enable_height: string
  }

  export interface Data {
    vote_extensions_enable_height: string
  }

  export type Proto = ABCIParams_pb
}
