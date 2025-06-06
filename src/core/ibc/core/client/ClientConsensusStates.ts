import { ClientConsensusStates as ClientConsensusStates_pb } from '@initia/initia.proto/ibc/core/client/v1/client'
import { JSONSerializable } from '../../../../util/json'
import { ConsensusStateWithHeight } from './ConsensusStateWithHeight'

/**
 * ClientConsensusStates defines all the stored consensus states for a given client.
 */
export class ClientConsensusStates extends JSONSerializable<
  ClientConsensusStates.Amino,
  ClientConsensusStates.Data,
  ClientConsensusStates.Proto
> {
  /**
   * @param client_id client identifier
   * @param consensus_states consensus states and their heights associated with the client
   */
  constructor(
    public client_id: string,
    public consensus_states: ConsensusStateWithHeight[]
  ) {
    super()
  }

  public static fromAmino(
    data: ClientConsensusStates.Amino
  ): ClientConsensusStates {
    const { client_id, consensus_states } = data
    return new ClientConsensusStates(
      client_id,
      consensus_states.map(ConsensusStateWithHeight.fromAmino)
    )
  }

  public toAmino(): ClientConsensusStates.Amino {
    const { client_id, consensus_states } = this
    return {
      client_id,
      consensus_states: consensus_states.map((state) => state.toAmino()),
    }
  }

  public static fromData(
    data: ClientConsensusStates.Data
  ): ClientConsensusStates {
    const { client_id, consensus_states } = data
    return new ClientConsensusStates(
      client_id,
      consensus_states.map(ConsensusStateWithHeight.fromData)
    )
  }

  public toData(): ClientConsensusStates.Data {
    const { client_id, consensus_states } = this
    return {
      client_id,
      consensus_states: consensus_states.map((state) => state.toData()),
    }
  }

  public static fromProto(
    proto: ClientConsensusStates.Proto
  ): ClientConsensusStates {
    return new ClientConsensusStates(
      proto.clientId,
      proto.consensusStates.map(ConsensusStateWithHeight.fromProto)
    )
  }

  public toProto(): ClientConsensusStates.Proto {
    const { client_id, consensus_states } = this
    return ClientConsensusStates_pb.fromPartial({
      clientId: client_id,
      consensusStates: consensus_states.map((state) => state.toProto()),
    })
  }
}

export namespace ClientConsensusStates {
  export interface Amino {
    client_id: string
    consensus_states: ConsensusStateWithHeight.Amino[]
  }

  export interface Data {
    client_id: string
    consensus_states: ConsensusStateWithHeight.Data[]
  }

  export type Proto = ClientConsensusStates_pb
}
