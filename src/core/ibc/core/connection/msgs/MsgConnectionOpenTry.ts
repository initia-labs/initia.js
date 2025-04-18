import { JSONSerializable } from '../../../../../util/json'
import { AccAddress } from '../../../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgConnectionOpenTry as MsgConnectionOpenTry_pb } from '@initia/initia.proto/ibc/core/connection/v1/tx'
import { ConnectionCounterparty } from '../ConnectionCounterparty'
import { IbcVersion } from '../IbcVersion'
import { Height } from '../../client'

/**
 * MsgConnectionOpenTry defines a msg sent by a Relayer to try to open a connection on Chain B.
 */
export class MsgConnectionOpenTry extends JSONSerializable<
  any,
  MsgConnectionOpenTry.Data,
  MsgConnectionOpenTry.Proto
> {
  /**
   * @param client_id in the case of crossing hello's, when both chains call OpenInit, we need the connection identifier of the previous connection in state INIT
   * @param client_state
   * @param counterparty
   * @param delay_period
   * @param counterparty_versions
   * @param proof_height proof of the initialization the connection on Chain A: `UNITIALIZED -> INIT`
   * @param proof_init proof of client state included in message
   * @param proof_client proof of client consensus state
   * @param proof_consensus
   * @param consensus_height
   * @param signer signer address
   */
  constructor(
    public client_id: string,
    public client_state: Any | undefined,
    public counterparty: ConnectionCounterparty | undefined,
    public delay_period: number,
    public counterparty_versions: IbcVersion[],
    public proof_height: Height | undefined,
    public proof_init: string,
    public proof_client: string,
    public proof_consensus: string,
    public consensus_height: Height | undefined,
    public signer: AccAddress
  ) {
    super()
  }

  public static fromAmino(_: any): MsgConnectionOpenTry {
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(
    data: MsgConnectionOpenTry.Data
  ): MsgConnectionOpenTry {
    const {
      client_id,
      client_state,
      counterparty,
      delay_period,
      counterparty_versions,
      proof_height,
      proof_init,
      proof_client,
      proof_consensus,
      consensus_height,
      signer,
    } = data
    return new MsgConnectionOpenTry(
      client_id,
      client_state,
      counterparty ? ConnectionCounterparty.fromData(counterparty) : undefined,
      parseInt(delay_period),
      counterparty_versions.map(IbcVersion.fromData),
      proof_height ? Height.fromData(proof_height) : undefined,
      Buffer.from(proof_init).toString('base64'),
      Buffer.from(proof_client).toString('base64'),
      Buffer.from(proof_consensus).toString('base64'),
      consensus_height ? Height.fromData(consensus_height) : undefined,
      signer
    )
  }

  public toData(): MsgConnectionOpenTry.Data {
    const {
      client_id,
      client_state,
      counterparty,
      delay_period,
      counterparty_versions,
      proof_height,
      proof_init,
      proof_client,
      proof_consensus,
      consensus_height,
      signer,
    } = this
    return {
      '@type': '/ibc.core.connection.v1.MsgConnectionOpenTry',
      client_id,
      client_state,
      counterparty: counterparty?.toData(),
      delay_period: delay_period.toFixed(),
      counterparty_versions: counterparty_versions.map((cv) => cv.toData()),
      proof_height: proof_height?.toData(),
      proof_init,
      proof_client,
      proof_consensus,
      consensus_height: consensus_height?.toData(),
      signer,
    }
  }

  public static fromProto(
    proto: MsgConnectionOpenTry.Proto
  ): MsgConnectionOpenTry {
    return new MsgConnectionOpenTry(
      proto.clientId,
      proto.clientState,
      proto.counterparty
        ? ConnectionCounterparty.fromProto(proto.counterparty)
        : undefined,
      Number(proto.delayPeriod),
      proto.counterpartyVersions.map(IbcVersion.fromProto),
      proto.proofHeight ? Height.fromProto(proto.proofHeight) : undefined,
      Buffer.from(proto.proofInit).toString('base64'),
      Buffer.from(proto.proofClient).toString('base64'),
      Buffer.from(proto.proofConsensus).toString('base64'),
      proto.consensusHeight
        ? Height.fromProto(proto.consensusHeight)
        : undefined,
      proto.signer
    )
  }

  public toProto(): MsgConnectionOpenTry.Proto {
    const {
      client_id,
      client_state,
      counterparty,
      delay_period,
      counterparty_versions,
      proof_height,
      proof_init,
      proof_client,
      proof_consensus,
      consensus_height,
      signer,
    } = this
    return MsgConnectionOpenTry_pb.fromPartial({
      clientId: client_id,
      clientState: client_state,
      counterparty: counterparty?.toProto(),
      delayPeriod: BigInt(delay_period),
      counterpartyVersions: counterparty_versions.map((cv) => cv.toProto()),
      proofHeight: proof_height?.toProto(),
      proofInit: Buffer.from(proof_init, 'base64'),
      proofClient: Buffer.from(proof_client, 'base64'),
      proofConsensus: Buffer.from(proof_consensus, 'base64'),
      consensusHeight: consensus_height?.toProto(),
      signer,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.core.connection.v1.MsgConnectionOpenTry',
      value: MsgConnectionOpenTry_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgConnectionOpenTry {
    return MsgConnectionOpenTry.fromProto(
      MsgConnectionOpenTry_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgConnectionOpenTry {
  export interface Data {
    '@type': '/ibc.core.connection.v1.MsgConnectionOpenTry'
    client_id: string
    client_state?: Any
    counterparty?: ConnectionCounterparty.Data
    delay_period: string
    counterparty_versions: IbcVersion.Data[]
    proof_height?: Height.Data
    proof_init: string
    proof_client: string
    proof_consensus: string
    consensus_height?: Height.Data
    signer: AccAddress
  }

  export type Proto = MsgConnectionOpenTry_pb
}
