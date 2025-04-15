import { JSONSerializable } from '../../util/json'
import { Coins } from '../Coins'
import { Params as Params_pb } from '@initia/opinit.proto/opinit/ophost/v1/types'

/**
 * OphostParams defines the set of ophost parameters.
 */
export class OphostParams extends JSONSerializable<
  OphostParams.Amino,
  OphostParams.Data,
  OphostParams.Proto
> {
  public registration_fee: Coins

  /**
   * @param registration_fee the amount to be paid by l2 creator
   */
  constructor(registration_fee: Coins.Input) {
    super()
    this.registration_fee = new Coins(registration_fee)
  }

  public static fromAmino(data: OphostParams.Amino): OphostParams {
    return new OphostParams(
      data.value.registration_fee
        ? Coins.fromAmino(data.value.registration_fee)
        : new Coins()
    )
  }

  public toAmino(): OphostParams.Amino {
    return {
      type: 'ophost/Params',
      value: {
        registration_fee:
          this.registration_fee.toArray().length > 0
            ? this.registration_fee.toAmino()
            : null,
      },
    }
  }

  public static fromData(data: OphostParams.Data): OphostParams {
    return new OphostParams(Coins.fromData(data.registration_fee))
  }

  public toData(): OphostParams.Data {
    return {
      '@type': '/opinit.ophost.v1.Params',
      registration_fee: this.registration_fee.toData(),
    }
  }

  public static fromProto(data: OphostParams.Proto): OphostParams {
    return new OphostParams(Coins.fromProto(data.registrationFee))
  }

  public toProto(): OphostParams.Proto {
    return Params_pb.fromPartial({
      registrationFee: this.registration_fee.toProto(),
    })
  }
}

export namespace OphostParams {
  export interface Amino {
    type: 'ophost/Params'
    value: {
      registration_fee: Coins.Amino | null
    }
  }

  export interface Data {
    '@type': '/opinit.ophost.v1.Params'
    registration_fee: Coins.Data
  }

  export type Proto = Params_pb
}
