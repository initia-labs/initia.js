import { JSONSerializable } from '../../util/json'
import { Params as Params_pb } from '@initia/initia.proto/minievm/evm/v1/types'

export class EvmParams extends JSONSerializable<
  EvmParams.Amino,
  EvmParams.Data,
  EvmParams.Proto
> {
  /**
   * @param extra_eips the additional EIPs for the vm.Config
   * @param allowed_publishers list of addresses with permission to distribute contracts
   * @param allow_custom_erc20 whether the chain allows custom erc20 tokens to be registered on cosmos bank interface
   * @param allowed_custom_erc20s
   * @param fee_denom the fee denom for the evm transactions
   */
  constructor(
    public extra_eips: number[],
    public allowed_publishers: string[],
    public allow_custom_erc20: boolean,
    public allowed_custom_erc20s: string[],
    public fee_denom: string
  ) {
    super()
  }

  public static fromAmino(data: EvmParams.Amino): EvmParams {
    const {
      extra_eips,
      allowed_publishers,
      allow_custom_erc20,
      allowed_custom_erc20s,
      fee_denom,
    } = data
    return new EvmParams(
      extra_eips.map(parseInt),
      allowed_publishers,
      allow_custom_erc20,
      allowed_custom_erc20s,
      fee_denom
    )
  }

  public toAmino(): EvmParams.Amino {
    const {
      extra_eips,
      allowed_publishers,
      allow_custom_erc20,
      allowed_custom_erc20s,
      fee_denom,
    } = this
    return {
      extra_eips: extra_eips.map((eip) => eip.toString()),
      allowed_publishers,
      allow_custom_erc20,
      allowed_custom_erc20s,
      fee_denom,
    }
  }

  public static fromData(data: EvmParams.Data): EvmParams {
    const {
      extra_eips,
      allowed_publishers,
      allow_custom_erc20,
      allowed_custom_erc20s,
      fee_denom,
    } = data
    return new EvmParams(
      extra_eips.map(parseInt),
      allowed_publishers,
      allow_custom_erc20,
      allowed_custom_erc20s,
      fee_denom
    )
  }

  public toData(): EvmParams.Data {
    const {
      extra_eips,
      allowed_publishers,
      allow_custom_erc20,
      allowed_custom_erc20s,
      fee_denom,
    } = this
    return {
      extra_eips: extra_eips.map((eip) => eip.toString()),
      allowed_publishers,
      allow_custom_erc20,
      allowed_custom_erc20s,
      fee_denom,
    }
  }

  public static fromProto(proto: EvmParams.Proto): EvmParams {
    return new EvmParams(
      proto.extraEips.map((eip) => eip.toNumber()),
      proto.allowedPublishers,
      proto.allowCustomErc20,
      proto.allowedCustomErc20s,
      proto.feeDenom
    )
  }

  public toProto(): EvmParams.Proto {
    const {
      extra_eips,
      allowed_publishers,
      allow_custom_erc20,
      allowed_custom_erc20s,
      fee_denom,
    } = this
    return Params_pb.fromPartial({
      extraEips: extra_eips,
      allowedPublishers: allowed_publishers,
      allowCustomErc20: allow_custom_erc20,
      allowedCustomErc20s: allowed_custom_erc20s,
      feeDenom: fee_denom,
    })
  }
}

export namespace EvmParams {
  export interface Amino {
    extra_eips: string[]
    allowed_publishers: string[]
    allow_custom_erc20: boolean
    allowed_custom_erc20s: string[]
    fee_denom: string
  }

  export interface Data {
    extra_eips: string[]
    allowed_publishers: string[]
    allow_custom_erc20: boolean
    allowed_custom_erc20s: string[]
    fee_denom: string
  }

  export type Proto = Params_pb
}
