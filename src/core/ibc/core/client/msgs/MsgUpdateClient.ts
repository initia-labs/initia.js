import { JSONSerializable } from '../../../../../util/json'
import { AccAddress } from '../../../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgUpdateClient as MsgUpdateClient_pb } from '@initia/initia.proto/ibc/core/client/v1/tx'

/**
 * MsgUpdateClient defines an sdk.Msg to update a IBC client state using the given client message
 */
export class MsgUpdateClient extends JSONSerializable<
  any,
  MsgUpdateClient.Data,
  MsgUpdateClient.Proto
> {
  /**
   * @param client_id client unique identifier
   * @param client_message client message to update the light client
   * @param signer signer address
   */
  constructor(
    public client_id: string,
    public client_message: any,
    public signer: string
  ) {
    super()
  }

  public static fromAmino(_: any): MsgUpdateClient {
    _
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(data: MsgUpdateClient.Data): MsgUpdateClient {
    const { client_id, client_message, signer } = data
    return new MsgUpdateClient(client_id, client_message, signer)
  }

  public toData(): MsgUpdateClient.Data {
    const { client_id, client_message, signer } = this
    return {
      '@type': '/ibc.core.client.v1.MsgUpdateClient',
      client_id,
      client_message,
      signer,
    }
  }

  public static fromProto(proto: MsgUpdateClient.Proto): MsgUpdateClient {
    return new MsgUpdateClient(
      proto.clientId,
      proto.clientMessage,
      proto.signer
    )
  }

  public toProto(): MsgUpdateClient.Proto {
    const { client_id, client_message, signer } = this
    return MsgUpdateClient_pb.fromPartial({
      clientId: client_id,
      clientMessage: client_message,
      signer,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.core.client.v1.MsgUpdateClient',
      value: MsgUpdateClient_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgUpdateClient {
    return MsgUpdateClient.fromProto(MsgUpdateClient_pb.decode(msgAny.value))
  }
}

export namespace MsgUpdateClient {
  export interface Data {
    '@type': '/ibc.core.client.v1.MsgUpdateClient'
    client_id: string
    client_message?: any
    signer: AccAddress
  }
  export type Proto = MsgUpdateClient_pb
}
