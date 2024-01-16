import { JSONSerializable } from '../../../../../util/json';
import { AccAddress } from '../../../../bech32';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgRecoverClient as MsgRecoverClient_pb } from '@initia/initia.proto/ibc/core/client/v1/tx';

/**
 * MsgRecoverClient defines the message used to recover a frozen or expired client
 */
export class MsgRecoverClient extends JSONSerializable<
  any,
  MsgRecoverClient.Data,
  MsgRecoverClient.Proto
> {
  /**
   * @param subject_client_id the client identifier to be updated if the proposal passes
   * @param substitute_client_id the substitute client identifier which will replace the subject client
   * @param signer signer address
   */
  constructor(
    public subject_client_id: string,
    public substitute_client_id: string,
    public signer: string
  ) {
    super();
  }

  public static fromAmino(_: any): MsgRecoverClient {
    _;
    throw new Error('Amino not supported');
  }

  public toAmino(): any {
    throw new Error('Amino not supported');
  }

  public static fromData(data: MsgRecoverClient.Data): MsgRecoverClient {
    const { subject_client_id, substitute_client_id, signer } = data;
    return new MsgRecoverClient(
      subject_client_id,
      substitute_client_id,
      signer
    );
  }

  public toData(): MsgRecoverClient.Data {
    const { subject_client_id, substitute_client_id, signer } = this;
    return {
      '@type': '/ibc.core.client.v1.MsgRecoverClient',
      subject_client_id,
      substitute_client_id,
      signer,
    };
  }

  public static fromProto(proto: MsgRecoverClient.Proto): MsgRecoverClient {
    return new MsgRecoverClient(
      proto.subjectClientId,
      proto.substituteClientId,
      proto.signer
    );
  }

  public toProto(): MsgRecoverClient.Proto {
    const { subject_client_id, substitute_client_id, signer } = this;
    return MsgRecoverClient_pb.fromPartial({
      subjectClientId: subject_client_id,
      substituteClientId: substitute_client_id,
      signer,
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.core.client.v1.MsgRecoverClient',
      value: MsgRecoverClient_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgRecoverClient {
    return MsgRecoverClient.fromProto(MsgRecoverClient_pb.decode(msgAny.value));
  }
}

export namespace MsgRecoverClient {
  export interface Data {
    '@type': '/ibc.core.client.v1.MsgRecoverClient';
    subject_client_id: string;
    substitute_client_id: string;
    signer: AccAddress;
  }

  export type Proto = MsgRecoverClient_pb;
}
