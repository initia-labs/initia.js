import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { MoveParams } from '../MoveParams';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgUpdateParams as MsgUpdateParams_pb } from '@initia/initia.proto/initia/move/v1/tx';

export class MsgUpdateMoveParams extends JSONSerializable<
  MsgUpdateMoveParams.Amino,
  MsgUpdateMoveParams.Data,
  MsgUpdateMoveParams.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param params params defines the x/move parameters to update
   */
  constructor(public authority: AccAddress, public params: MoveParams) {
    super();
  }

  public static fromAmino(
    data: MsgUpdateMoveParams.Amino
  ): MsgUpdateMoveParams {
    const {
      value: { authority, params },
    } = data;
    return new MsgUpdateMoveParams(authority, MoveParams.fromAmino(params));
  }

  public toAmino(): MsgUpdateMoveParams.Amino {
    const { authority, params } = this;
    return {
      type: 'move/MsgUpdateParams',
      value: {
        authority,
        params: params.toAmino(),
      },
    };
  }

  public static fromData(data: MsgUpdateMoveParams.Data): MsgUpdateMoveParams {
    const { authority, params } = data;
    return new MsgUpdateMoveParams(authority, MoveParams.fromData(params));
  }

  public toData(): MsgUpdateMoveParams.Data {
    const { authority, params } = this;
    return {
      '@type': '/initia.move.v1.MsgUpdateParams',
      authority,
      params: params.toData(),
    };
  }

  public static fromProto(
    data: MsgUpdateMoveParams.Proto
  ): MsgUpdateMoveParams {
    return new MsgUpdateMoveParams(
      data.authority,
      MoveParams.fromProto(data.params as MoveParams.Proto)
    );
  }

  public toProto(): MsgUpdateMoveParams.Proto {
    const { authority, params } = this;
    return MsgUpdateParams_pb.fromPartial({
      authority,
      params: params.toProto(),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.move.v1.MsgUpdateParams',
      value: MsgUpdateParams_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgUpdateMoveParams {
    return MsgUpdateMoveParams.fromProto(
      MsgUpdateParams_pb.decode(msgAny.value)
    );
  }
}

export namespace MsgUpdateMoveParams {
  export interface Amino {
    type: 'move/MsgUpdateParams';
    value: {
      authority: AccAddress;
      params: MoveParams.Amino;
    };
  }

  export interface Data {
    '@type': '/initia.move.v1.MsgUpdateParams';
    authority: AccAddress;
    params: MoveParams.Data;
  }

  export type Proto = MsgUpdateParams_pb;
}
