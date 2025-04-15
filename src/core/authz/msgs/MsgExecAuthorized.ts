import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Msg } from '../../Msg'
import { MsgExec as MsgExec_pb } from '@initia/initia.proto/cosmos/authz/v1beta1/tx'
import { Any } from '@initia/initia.proto/google/protobuf/any'

/**
 * MsgExecAuthorized attempts to execute the provided messages using
 * authorizations granted to the grantee. Each message should have only
 * one signer corresponding to the granter of the authorization.
 */
export class MsgExecAuthorized extends JSONSerializable<
  MsgExecAuthorized.Amino,
  MsgExecAuthorized.Data,
  MsgExecAuthorized.Proto
> {
  /**
   * @param grantee authorization grantee
   * @param msgs list of messages to execute
   */
  constructor(
    public grantee: AccAddress,
    public msgs: Msg[]
  ) {
    super()
  }

  public static fromAmino(data: MsgExecAuthorized.Amino): MsgExecAuthorized {
    const {
      value: { grantee, msgs },
    } = data
    return new MsgExecAuthorized(grantee, msgs.map(Msg.fromAmino))
  }

  public toAmino(): MsgExecAuthorized.Amino {
    const { grantee, msgs } = this
    return {
      type: 'cosmos-sdk/MsgExec',
      value: {
        grantee,
        msgs: msgs.map((msg) => msg.toAmino()),
      },
    }
  }

  public static fromData(proto: MsgExecAuthorized.Data): MsgExecAuthorized {
    const { grantee, msgs } = proto
    return new MsgExecAuthorized(grantee, msgs.map(Msg.fromData))
  }

  public toData(): MsgExecAuthorized.Data {
    const { grantee, msgs } = this
    return {
      '@type': '/cosmos.authz.v1beta1.MsgExec',
      grantee,
      msgs: msgs.map((msg) => msg.toData()),
    }
  }

  public static fromProto(proto: MsgExecAuthorized.Proto): MsgExecAuthorized {
    return new MsgExecAuthorized(proto.grantee, proto.msgs.map(Msg.fromProto))
  }

  public toProto(): MsgExecAuthorized.Proto {
    const { grantee, msgs } = this
    return MsgExec_pb.fromPartial({
      grantee,
      msgs: msgs.map((m) => m.packAny()),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.authz.v1beta1.MsgExec',
      value: MsgExec_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgExecAuthorized {
    return MsgExecAuthorized.fromProto(MsgExec_pb.decode(msgAny.value))
  }
}

export namespace MsgExecAuthorized {
  export interface Amino {
    type: 'cosmos-sdk/MsgExec'
    value: {
      grantee: AccAddress
      msgs: Msg.Amino[]
    }
  }

  export interface Data {
    '@type': '/cosmos.authz.v1beta1.MsgExec'
    grantee: AccAddress
    msgs: Msg.Data[]
  }

  export type Proto = MsgExec_pb
}
