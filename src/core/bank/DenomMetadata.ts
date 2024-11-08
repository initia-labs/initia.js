import { JSONSerializable } from '../../util/json'
import { DenomUnit } from './DenomUnit'
import { Metadata as Metadata_pb } from '@initia/initia.proto/cosmos/bank/v1beta1/bank'

/**
 * DenomMetadata represents a struct that describes a basic token.
 */
export class DenomMetadata extends JSONSerializable<
  DenomMetadata.Amino,
  DenomMetadata.Data,
  DenomMetadata.Proto
> {
  /**
   * @param description
   * @param denom_units the list of DenomUnit's for a given coin
   * @param base the base denom (should be the DenomUnit with exponent = 0)
   * @param display the suggested denom that should be displayed in clients
   * @param name the name of the token
   * @param symbol the token symbol usually shown on exchanges
   * @param uri URI to a document (on or off-chain) that contains additional information
   * @param uri_hash sha256 hash of a document pointed by URI
   */
  constructor(
    public description: string,
    public denom_units: DenomUnit[],
    public base: string,
    public display: string,
    public name: string,
    public symbol: string,
    public uri: string,
    public uri_hash: string
  ) {
    super()
  }

  public static fromAmino(data: DenomMetadata.Amino): DenomMetadata {
    const {
      description,
      denom_units,
      base,
      display,
      name,
      symbol,
      uri,
      uri_hash,
    } = data

    return new DenomMetadata(
      description,
      denom_units.map(DenomUnit.fromAmino),
      base,
      display,
      name,
      symbol,
      uri,
      uri_hash
    )
  }

  public toAmino(): DenomMetadata.Amino {
    const {
      description,
      denom_units,
      base,
      display,
      name,
      symbol,
      uri,
      uri_hash,
    } = this

    return {
      description,
      denom_units: denom_units.map((d) => d.toAmino()),
      base,
      display,
      name,
      symbol,
      uri,
      uri_hash,
    }
  }

  public static fromData(data: DenomMetadata.Data): DenomMetadata {
    const {
      description,
      denom_units,
      base,
      display,
      name,
      symbol,
      uri,
      uri_hash,
    } = data

    return new DenomMetadata(
      description,
      denom_units.map(DenomUnit.fromData),
      base,
      display,
      name,
      symbol,
      uri,
      uri_hash
    )
  }

  public toData(): DenomMetadata.Data {
    const {
      description,
      denom_units,
      base,
      display,
      name,
      symbol,
      uri,
      uri_hash,
    } = this

    return {
      description,
      denom_units: denom_units.map((d) => d.toData()),
      base,
      display,
      name,
      symbol,
      uri,
      uri_hash,
    }
  }

  public static fromProto(data: DenomMetadata.Proto): DenomMetadata {
    return new DenomMetadata(
      data.description,
      data.denomUnits.map(DenomUnit.fromProto),
      data.base,
      data.display,
      data.name,
      data.symbol,
      data.uri,
      data.uriHash
    )
  }

  public toProto(): DenomMetadata.Proto {
    const {
      description,
      denom_units,
      base,
      display,
      name,
      symbol,
      uri,
      uri_hash,
    } = this

    return Metadata_pb.fromPartial({
      description,
      denomUnits: denom_units.map((d) => d.toProto()),
      base,
      display,
      name,
      symbol,
      uri,
      uriHash: uri_hash,
    })
  }
}

export namespace DenomMetadata {
  export interface Amino {
    description: string
    denom_units: DenomUnit.Amino[]
    base: string
    display: string
    name: string
    symbol: string
    uri: string
    uri_hash: string
  }

  export interface Data {
    description: string
    denom_units: DenomUnit.Data[]
    base: string
    display: string
    name: string
    symbol: string
    uri: string
    uri_hash: string
  }

  export type Proto = Metadata_pb
}
