import { JSONSerializable } from '../../util/json'
import { Plan as Plan_pb } from '@initia/initia.proto/cosmos/upgrade/v1beta1/upgrade'

/*
 * Plan specifies information about a planned upgrade and when it should occur.
 */
export class Plan extends JSONSerializable<Plan.Amino, Plan.Data, Plan.Proto> {
  /**
   * @param name the name for the upgrade
   * @param height the height at which the upgrade must be performed
   * @param info any application specific upgrade info to be included on-chain
   */
  constructor(
    public name: string,
    public height: number,
    public info: string
  ) {
    super()
  }

  public static fromAmino(data: Plan.Amino): Plan {
    const { name, height, info } = data
    return new Plan(name, parseInt(height), info)
  }

  public toAmino(): Plan.Amino {
    const { name, height, info } = this
    return {
      name,
      height: height.toFixed(),
      info,
    }
  }

  public static fromData(data: Plan.Data): Plan {
    const { name, height, info } = data
    return new Plan(name, parseInt(height), info)
  }

  public toData(): Plan.Data {
    const { name, height, info } = this
    return {
      name,
      height: height.toFixed(),
      info,
    }
  }

  public static fromProto(proto: Plan.Proto): Plan {
    return new Plan(proto.name, proto.height.toNumber(), proto.info)
  }

  public toProto(): Plan.Proto {
    const { name, height, info } = this
    return Plan_pb.fromPartial({
      name,
      height,
      info,
    })
  }
}

export namespace Plan {
  export interface Amino {
    name: string
    height: string
    info: string
  }

  export interface Data {
    name: string
    height: string
    info: string
  }

  export type Proto = Plan_pb
}
