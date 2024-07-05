import { JSONSerializable } from '../../util/json'
import { Params as Params_pb } from '@initia/initia.proto/initia/ibchooks/v1/types'

export class IbcHooksParams extends JSONSerializable<
  IbcHooksParams.Amino,
  IbcHooksParams.Data,
  IbcHooksParams.Proto
> {
  /**
   * @param default_allowed
   */
  constructor(public default_allowed: boolean) {
    super()
  }

  public static fromAmino(data: IbcHooksParams.Amino): IbcHooksParams {
    return new IbcHooksParams(data.value.default_allowed)
  }

  public toAmino(): IbcHooksParams.Amino {
    return {
      type: 'ibc-hooks/Params',
      value: { default_allowed: this.default_allowed },
    }
  }

  public static fromData(data: IbcHooksParams.Data): IbcHooksParams {
    return new IbcHooksParams(data.default_allowed)
  }

  public toData(): IbcHooksParams.Data {
    return {
      '@type': '/initia.ibchooks.v1.Params',
      default_allowed: this.default_allowed,
    }
  }

  public static fromProto(data: IbcHooksParams.Proto): IbcHooksParams {
    return new IbcHooksParams(data.defaultAllowed)
  }

  public toProto(): IbcHooksParams.Proto {
    return Params_pb.fromPartial({
      defaultAllowed: this.default_allowed,
    })
  }
}

export namespace IbcHooksParams {
  export interface Amino {
    type: 'ibc-hooks/Params'
    value: {
      default_allowed: boolean
    }
  }

  export interface Data {
    '@type': '/initia.ibchooks.v1.Params'
    default_allowed: boolean
  }

  export type Proto = Params_pb
}
