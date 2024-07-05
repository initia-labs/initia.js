import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { BankParams } from '../BankParams'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgUpdateParams as MsgUpdateParams_pb } from '@initia/initia.proto/cosmos/bank/v1beta1/tx'

export class MsgUpdateBankParams extends JSONSerializable<
  MsgUpdateBankParams.Amino,
  MsgUpdateBankParams.Data,
  MsgUpdateBankParams.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param params params defines the x/bank parameters to update
   */
  constructor(
    public authority: AccAddress,
    public params: BankParams
  ) {
    super()
  }

  public static fromAmino(
    data: MsgUpdateBankParams.Amino
  ): MsgUpdateBankParams {
    const {
      value: { authority, params },
    } = data
    return new MsgUpdateBankParams(authority, BankParams.fromAmino(params))
  }

  public toAmino(): MsgUpdateBankParams.Amino {
    const { authority, params } = this
    return {
      type: 'cosmos-sdk/x/bank/MsgUpdateParams',
      value: {
        authority,
        params: params.toAmino(),
      },
    }
  }

  public static fromData(data: MsgUpdateBankParams.Data): MsgUpdateBankParams {
    const { authority, params } = data
    return new MsgUpdateBankParams(authority, BankParams.fromData(params))
  }

  public toData(): MsgUpdateBankParams.Data {
    const { authority, params } = this
    return {
      '@type': '/cosmos.bank.v1beta1.MsgUpdateParams',
      authority,
      params: params.toData(),
    }
  }

  public static fromProto(
    data: MsgUpdateBankParams.Proto
  ): MsgUpdateBankParams {
    return new MsgUpdateBankParams(
      data.authority,
      BankParams.fromProto(data.params as BankParams.Proto)
    )
  }

  public toProto(): MsgUpdateBankParams.Proto {
    const { authority, params } = this
    return MsgUpdateParams_pb.fromPartial({
      authority,
      params: params.toProto(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.bank.v1beta1.MsgUpdateParams',
      value: MsgUpdateParams_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgUpdateBankParams {
    return MsgUpdateBankParams.fromProto(
      MsgUpdateParams_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgUpdateBankParams {
  export interface Amino {
    type: 'cosmos-sdk/x/bank/MsgUpdateParams'
    value: {
      authority: AccAddress
      params: BankParams.Amino
    }
  }

  export interface Data {
    '@type': '/cosmos.bank.v1beta1.MsgUpdateParams'
    authority: AccAddress
    params: BankParams.Data
  }

  export type Proto = MsgUpdateParams_pb
}
