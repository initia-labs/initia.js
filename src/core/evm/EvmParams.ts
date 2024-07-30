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
   */
  constructor(
    public extra_eips: number[],
    public allowed_publishers: string[]
  ) {
    super()
  }

  public static fromAmino(data: EvmParams.Amino): EvmParams {
    const { extra_eips, allowed_publishers } = data
    return new EvmParams(extra_eips.map(Number.parseInt), allowed_publishers)
  }

  public toAmino(): EvmParams.Amino {
    const { extra_eips, allowed_publishers } = this
    return {
      extra_eips: extra_eips.map((eip) => eip.toString()),
      allowed_publishers,
    }
  }

  public static fromData(data: EvmParams.Data): EvmParams {
    const { extra_eips, allowed_publishers } = data
    return new EvmParams(extra_eips.map(Number.parseInt), allowed_publishers)
  }

  public toData(): EvmParams.Data {
    const { extra_eips, allowed_publishers } = this
    return {
      extra_eips: extra_eips.map((eip) => eip.toString()),
      allowed_publishers,
    }
  }

  public static fromProto(proto: EvmParams.Proto): EvmParams {
    return new EvmParams(
      proto.extraEips.map((eip) => eip.toNumber()),
      proto.allowedPublishers
    )
  }

  public toProto(): EvmParams.Proto {
    const { extra_eips, allowed_publishers } = this
    return Params_pb.fromPartial({
      extraEips: extra_eips,
      allowedPublishers: allowed_publishers,
    })
  }
}

export namespace EvmParams {
  export interface Amino {
    extra_eips: string[]
    allowed_publishers: string[]
  }

  export interface Data {
    extra_eips: string[]
    allowed_publishers: string[]
  }

  export type Proto = Params_pb
}
