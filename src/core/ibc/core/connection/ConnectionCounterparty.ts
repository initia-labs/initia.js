import { JSONSerializable } from '../../../../util/json'
import { Counterparty as Counterparty_pb } from '@initia/initia.proto/ibc/core/connection/v1/connection'
import { MerklePrefix } from '../commitment/MerklePrefix'

/** ConnectionCounterparty defines the ConnectionCounterparty chain associated with a connection end */
export class ConnectionCounterparty extends JSONSerializable<
  ConnectionCounterparty.Amino,
  ConnectionCounterparty.Data,
  ConnectionCounterparty.Proto
> {
  /**
   * @param client_id identifies the client on the ConnectionCounterparty chain associated with a given connection.
   * @param connection_id identifies the connection end on the ConnectionCounterparty chain associated with a given connection.
   * @param prefix commitment merkle prefix of the ConnectionCounterparty chain.
   */
  constructor(
    public client_id: string,
    public connection_id: string,
    public prefix?: MerklePrefix
  ) {
    super()
  }

  public static fromAmino(
    data: ConnectionCounterparty.Amino
  ): ConnectionCounterparty {
    const { client_id, connection_id, prefix } = data
    return new ConnectionCounterparty(
      client_id,
      connection_id,
      prefix ? MerklePrefix.fromAmino(prefix) : undefined
    )
  }

  public toAmino(): ConnectionCounterparty.Amino {
    const { client_id, connection_id, prefix } = this
    return {
      client_id,
      connection_id,
      prefix,
    }
  }

  public static fromData(
    data: ConnectionCounterparty.Data
  ): ConnectionCounterparty {
    const { client_id, connection_id, prefix } = data
    return new ConnectionCounterparty(
      client_id,
      connection_id,
      prefix ? MerklePrefix.fromData(prefix) : undefined
    )
  }

  public toData(): ConnectionCounterparty.Data {
    const { client_id, connection_id, prefix } = this
    return {
      client_id,
      connection_id,
      prefix: prefix?.toData(),
    }
  }

  public static fromProto(
    proto: ConnectionCounterparty.Proto
  ): ConnectionCounterparty {
    return new ConnectionCounterparty(
      proto.clientId,
      proto.connectionId,
      proto.prefix ? MerklePrefix.fromProto(proto.prefix) : undefined
    )
  }

  public toProto(): ConnectionCounterparty.Proto {
    const { client_id, connection_id, prefix } = this
    return Counterparty_pb.fromPartial({
      clientId: client_id,
      connectionId: connection_id,
      prefix: prefix?.toProto(),
    })
  }
}

export namespace ConnectionCounterparty {
  export interface Amino {
    client_id: string
    connection_id: string
    prefix?: MerklePrefix.Amino
  }

  export interface Data {
    client_id: string
    connection_id: string
    prefix?: MerklePrefix.Data
  }

  export type Proto = Counterparty_pb
}
