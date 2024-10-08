import { JSONSerializable } from '../../../../../../util/json'
import {
  base64FromBytes,
  bytesFromBase64,
} from '../../../../../../util/polyfill'
import {
  Header as Header_pb,
  SignedHeader as SignedHeader_pb,
  BlockID as BlockID_pb,
  PartSetHeader as PartSetHeader_pb,
  Commit as Commit_pb,
  CommitSig as CommitSig_pb,
} from '@initia/initia.proto/tendermint/types/types'
import {
  Validator as Validator_pb,
  ValidatorSet as ValidatorSet_pb,
  BlockIDFlag,
  blockIDFlagFromJSON,
  blockIDFlagToJSON,
} from '@initia/initia.proto/tendermint/types/validator'
import { Consensus } from './version'
import { PublicKey } from './crypto'
import Long from 'long'

/** Header defines the structure of a Tendermint block header. */
export class Header extends JSONSerializable<any, Header.Data, Header.Proto> {
  /**
   * @param total
   * @param hash
   */
  constructor(
    public version: Consensus | undefined,
    public chain_id: string,
    public height: string,
    public time: Date | undefined,
    public last_block_id: BlockID | undefined,
    public last_commit_hash: string,
    public data_hash: string,
    public validators_hash: string,
    public next_validators_hash: string,
    public consensus_hash: string,
    public app_hash: string,
    public last_results_hash: string,
    public evidence_hash: string,
    public proposer_address: string
  ) {
    super()
  }

  public static fromAmino(_: any): Header {
    _
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(data: Header.Data): Header {
    const {
      version,
      chain_id,
      height,
      time,
      last_block_id,
      last_commit_hash,
      data_hash,
      validators_hash,
      next_validators_hash,
      consensus_hash,
      app_hash,
      last_results_hash,
      evidence_hash,
      proposer_address,
    } = data
    return new Header(
      version ? Consensus.fromData(version) : undefined,
      chain_id,
      height,
      time ? new Date(time) : undefined,
      last_block_id ? BlockID.fromData(last_block_id) : undefined,
      last_commit_hash,
      data_hash,
      validators_hash,
      next_validators_hash,
      consensus_hash,
      app_hash,
      last_results_hash,
      evidence_hash,
      proposer_address
    )
  }

  public toData(): Header.Data {
    const {
      version,
      chain_id,
      height,
      time,
      last_block_id,
      last_commit_hash,
      data_hash,
      validators_hash,
      next_validators_hash,
      consensus_hash,
      app_hash,
      last_results_hash,
      evidence_hash,
      proposer_address,
    } = this
    const res: Header.Data = {
      version: version?.toData(),
      chain_id,
      height,
      time: time?.toISOString().replace(/\.000Z$/, 'Z'),
      last_block_id: last_block_id?.toData(),
      last_commit_hash,
      data_hash,
      validators_hash,
      next_validators_hash,
      consensus_hash,
      app_hash,
      last_results_hash,
      evidence_hash,
      proposer_address,
    }
    return res
  }

  public static fromProto(proto: Header.Proto): Header {
    const {
      version,
      chainId,
      height,
      time,
      lastBlockId,
      lastCommitHash,
      dataHash,
      validatorsHash,
      nextValidatorsHash,
      consensusHash,
      appHash,
      lastResultsHash,
      evidenceHash,
      proposerAddress,
    } = proto
    return new Header(
      version ? Consensus.fromProto(version) : undefined,
      chainId,
      height.toString(),
      time,
      lastBlockId ? BlockID.fromProto(lastBlockId) : undefined,
      base64FromBytes(lastCommitHash),
      base64FromBytes(dataHash),
      base64FromBytes(validatorsHash),
      base64FromBytes(nextValidatorsHash),
      base64FromBytes(consensusHash),
      base64FromBytes(appHash),
      base64FromBytes(lastResultsHash),
      base64FromBytes(evidenceHash),
      base64FromBytes(proposerAddress)
    )
  }

  public toProto(): Header.Proto {
    const {
      version,
      chain_id,
      height,
      time,
      last_block_id,
      last_commit_hash,
      data_hash,
      validators_hash,
      next_validators_hash,
      consensus_hash,
      app_hash,
      last_results_hash,
      evidence_hash,
      proposer_address,
    } = this
    return Header_pb.fromPartial({
      version: version?.toProto(),
      chainId: chain_id,
      height: Long.fromString(height),
      time,
      lastBlockId: last_block_id?.toProto(),
      lastCommitHash: bytesFromBase64(last_commit_hash),
      dataHash: bytesFromBase64(data_hash),
      validatorsHash: bytesFromBase64(validators_hash),
      nextValidatorsHash: bytesFromBase64(next_validators_hash),
      consensusHash: bytesFromBase64(consensus_hash),
      appHash: bytesFromBase64(app_hash),
      lastResultsHash: bytesFromBase64(last_results_hash),
      evidenceHash: bytesFromBase64(evidence_hash),
      proposerAddress: bytesFromBase64(proposer_address),
    })
  }
}

export namespace Header {
  export interface Data {
    version?: Consensus.Data
    chain_id: string
    height: string
    time?: string
    last_block_id?: BlockID.Data
    last_commit_hash: string
    data_hash: string
    validators_hash: string
    next_validators_hash: string
    consensus_hash: string
    app_hash: string
    last_results_hash: string
    evidence_hash: string
    proposer_address: string
  }

  export type Proto = Header_pb
}

export class SignedHeader extends JSONSerializable<
  any,
  SignedHeader.Data,
  SignedHeader.Proto
> {
  /**
   * @param header
   * @param commit
   */
  constructor(
    public header?: Header,
    public commit?: Commit
  ) {
    super()
  }

  public static fromAmino(_: any): SignedHeader {
    _
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(data: SignedHeader.Data): SignedHeader {
    const { header, commit } = data
    return new SignedHeader(
      header ? Header.fromData(header) : undefined,
      commit ? Commit.fromData(commit) : undefined
    )
  }

  public toData(): SignedHeader.Data {
    const { header, commit } = this
    const res: SignedHeader.Data = {
      header: header?.toData(),
      commit: commit?.toData(),
    }
    return res
  }

  public static fromProto(proto: SignedHeader.Proto): SignedHeader {
    return new SignedHeader(
      proto.header ? Header.fromProto(proto.header) : undefined,
      proto.commit ? Commit.fromProto(proto.commit) : undefined
    )
  }

  public toProto(): SignedHeader.Proto {
    const { header, commit } = this
    return SignedHeader_pb.fromPartial({
      header: header?.toProto(),
      commit: commit?.toProto(),
    })
  }
}

export namespace SignedHeader {
  export interface Data {
    header?: Header.Data
    commit?: Commit.Data
  }

  export type Proto = SignedHeader_pb
}

/** BlockID */
export class BlockID extends JSONSerializable<
  any,
  BlockID.Data,
  BlockID.Proto
> {
  /**
   * @param hash
   * @param part_set_header
   */
  constructor(
    public hash: string,
    public part_set_header?: PartSetHeader
  ) {
    super()
  }

  public static fromAmino(_: any): BlockID {
    _
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(data: BlockID.Data): BlockID {
    const { hash, part_set_header } = data
    return new BlockID(
      hash,
      part_set_header ? PartSetHeader.fromData(part_set_header) : undefined
    )
  }

  public toData(): BlockID.Data {
    const { hash, part_set_header } = this
    const res: BlockID.Data = {
      hash,
      part_set_header: part_set_header?.toData(),
    }
    return res
  }

  public static fromProto(proto: BlockID.Proto): BlockID {
    return new BlockID(
      base64FromBytes(proto.hash),
      proto.partSetHeader
        ? PartSetHeader.fromProto(proto.partSetHeader)
        : undefined
    )
  }

  public toProto(): BlockID.Proto {
    const { hash, part_set_header } = this
    return BlockID_pb.fromPartial({
      hash: bytesFromBase64(hash),
      partSetHeader: part_set_header?.toProto(),
    })
  }
}

export namespace BlockID {
  export interface Data {
    hash: string
    part_set_header?: PartSetHeader.Data
  }

  export type Proto = BlockID_pb
}

/** PartsetHeader */
export class PartSetHeader extends JSONSerializable<
  any,
  PartSetHeader.Data,
  PartSetHeader.Proto
> {
  /**
   * @param total
   * @param hash
   */
  constructor(
    public total: number,
    public hash: string
  ) {
    super()
  }

  public static fromAmino(_: any): PartSetHeader {
    _
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(data: PartSetHeader.Data): PartSetHeader {
    const { total, hash } = data
    return new PartSetHeader(Number.parseInt(total), hash)
  }

  public toData(): PartSetHeader.Data {
    const { total, hash } = this
    const res: PartSetHeader.Data = {
      total: total.toFixed(),
      hash: hash,
    }
    return res
  }

  public static fromProto(proto: PartSetHeader.Proto): PartSetHeader {
    return new PartSetHeader(proto.total, base64FromBytes(proto.hash))
  }

  public toProto(): PartSetHeader.Proto {
    const { total, hash } = this
    return PartSetHeader_pb.fromPartial({
      total: total,
      hash: bytesFromBase64(hash),
    })
  }
}

export namespace PartSetHeader {
  export interface Data {
    total: string
    hash: string
  }

  export type Proto = PartSetHeader_pb
}

/** Commit contains the evidence that a block was committed by a set of validators. */
export class Commit extends JSONSerializable<any, Commit.Data, Commit.Proto> {
  /**
   * @param height
   * @param round
   * @param block_id
   * @param signatures
   */
  constructor(
    public height: Long,
    public round: number,
    public block_id: BlockID | undefined,
    public signatures: CommitSig[]
  ) {
    super()
  }

  public static fromAmino(_: any): Commit {
    _
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(data: Commit.Data): Commit {
    const { height, round, block_id, signatures } = data
    return new Commit(
      Long.fromString(height),
      Number.parseInt(round),
      block_id ? BlockID.fromData(block_id) : undefined,
      signatures.map((sig) => CommitSig.fromData(sig))
    )
  }

  public toData(): Commit.Data {
    const { height, round, block_id, signatures } = this
    const res: Commit.Data = {
      height: height.toString(),
      round: round.toFixed(),
      block_id: block_id?.toData(),
      signatures: signatures.map((sig) => sig.toData()),
    }
    return res
  }

  public static fromProto(proto: Commit.Proto): Commit {
    const { height, round, blockId, signatures } = proto
    return new Commit(
      height,
      round,
      blockId ? BlockID.fromProto(blockId) : undefined,
      signatures.map((sig) => CommitSig.fromProto(sig))
    )
  }

  public toProto(): Commit.Proto {
    const { height, round, block_id, signatures } = this
    return Commit_pb.fromPartial({
      height,
      round,
      blockId: block_id?.toProto(),
      signatures: signatures.map((sig) => sig.toProto()),
    })
  }
}

export namespace Commit {
  export interface Data {
    height: string
    round: string
    block_id?: BlockID.Data
    signatures: CommitSig.Data[]
  }

  export type Proto = Commit_pb
}

/** CommitSig is a part of the Vote included in a Commit. */
export class CommitSig extends JSONSerializable<
  any,
  CommitSig.Data,
  CommitSig.Proto
> {
  /**
   * @param block_id_flag
   * @param validator_address
   * @param timestamp
   * @param signature
   */
  constructor(
    public block_id_flag: BlockIDFlag,
    public validator_address?: string,
    public timestamp?: Date,
    public signature?: string
  ) {
    super()
  }

  public static fromAmino(_: any): CommitSig {
    _
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(data: CommitSig.Data): CommitSig {
    const { block_id_flag, validator_address, timestamp, signature } = data
    return new CommitSig(
      blockIDFlagFromJSON(block_id_flag),
      validator_address,
      timestamp ? new Date(timestamp) : undefined,
      signature
    )
  }

  public toData(): CommitSig.Data {
    const { block_id_flag, validator_address, timestamp, signature } = this
    const res: CommitSig.Data = {
      block_id_flag: blockIDFlagToJSON(block_id_flag),
      validator_address: validator_address ?? '',
      timestamp: timestamp?.toISOString().replace(/\.000Z$/, 'Z'),
      signature: signature ?? '',
    }
    return res
  }

  public static fromProto(proto: CommitSig.Proto): CommitSig {
    const { blockIdFlag, validatorAddress, timestamp, signature } = proto
    return new CommitSig(
      blockIdFlag,
      base64FromBytes(validatorAddress),
      timestamp,
      base64FromBytes(signature)
    )
  }

  public toProto(): CommitSig.Proto {
    const { block_id_flag, validator_address, timestamp, signature } = this
    return CommitSig_pb.fromPartial({
      blockIdFlag: block_id_flag,
      validatorAddress: validator_address
        ? bytesFromBase64(validator_address)
        : undefined,
      timestamp,
      signature: signature ? bytesFromBase64(signature) : undefined,
    })
  }
}

export namespace CommitSig {
  export interface Data {
    block_id_flag: string
    validator_address?: string
    timestamp?: string
    signature?: string
  }

  export type Proto = CommitSig_pb
}

export class ValidatorSet extends JSONSerializable<
  any,
  ValidatorSet.Data,
  ValidatorSet.Proto
> {
  /**
   * @param validators
   * @param proposer
   * @param total_voting_power
   */
  constructor(
    public validators: Validator[],
    public proposer: Validator | undefined,
    public total_voting_power: Long
  ) {
    super()
  }

  public static fromAmino(_: any): ValidatorSet {
    _
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(data: ValidatorSet.Data): ValidatorSet {
    const { validators, proposer, total_voting_power } = data
    return new ValidatorSet(
      validators.map((val) => Validator.fromData(val)),
      proposer ? Validator.fromData(proposer) : undefined,
      Long.fromString(total_voting_power)
    )
  }

  public toData(): ValidatorSet.Data {
    const { validators, proposer, total_voting_power } = this
    const res: ValidatorSet.Data = {
      validators: validators.map((val) => val.toData()),
      proposer: proposer?.toData(),
      total_voting_power: total_voting_power.toString(),
    }
    return res
  }

  public static fromProto(proto: ValidatorSet.Proto): ValidatorSet {
    const { validators, proposer, totalVotingPower } = proto
    return new ValidatorSet(
      validators.map((val) => Validator.fromProto(val)),
      proposer ? Validator.fromProto(proposer) : undefined,
      totalVotingPower
    )
  }

  public toProto(): ValidatorSet.Proto {
    const { validators, proposer, total_voting_power } = this
    return ValidatorSet_pb.fromPartial({
      validators: validators.map((val) => val.toProto()),
      proposer: proposer?.toProto(),
      totalVotingPower: total_voting_power,
    })
  }
}

export namespace ValidatorSet {
  export interface Data {
    validators: Validator.Data[]
    proposer?: Validator.Data
    total_voting_power: string
  }

  export type Proto = ValidatorSet_pb
}

export class Validator extends JSONSerializable<
  any,
  Validator.Data,
  Validator.Proto
> {
  /**
   * @param address
   * @param pub_key
   * @param voting_power
   * @param proposer_priority
   */
  constructor(
    public address: string, // not AccAddress in case of opposite chain is not cosmos-sdk based
    public pub_key: PublicKey | undefined,
    public voting_power: Long,
    public proposer_priority: Long
  ) {
    super()
  }

  public static fromAmino(_: any): Validator {
    _
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(data: Validator.Data): Validator {
    const { address, pub_key, voting_power, proposer_priority } = data
    return new Validator(
      address,
      pub_key ? PublicKey.fromData(pub_key) : undefined,
      Long.fromString(voting_power),
      Long.fromString(proposer_priority)
    )
  }

  public toData(): Validator.Data {
    const { address, pub_key, voting_power, proposer_priority } = this
    const res: Validator.Data = {
      address,
      pub_key: pub_key?.toData(),
      voting_power: voting_power.toString(),
      proposer_priority: proposer_priority.toString(),
    }
    return res
  }

  public static fromProto(proto: Validator.Proto): Validator {
    const { address, pubKey, votingPower, proposerPriority } = proto
    return new Validator(
      base64FromBytes(address),
      pubKey ? PublicKey.fromProto(pubKey) : undefined,
      votingPower,
      proposerPriority
    )
  }

  public toProto(): Validator.Proto {
    const { address, pub_key, voting_power, proposer_priority } = this
    return Validator_pb.fromPartial({
      address: bytesFromBase64(address),
      pubKey: pub_key?.toProto(),
      votingPower: voting_power,
      proposerPriority: proposer_priority,
    })
  }
}

export namespace Validator {
  export interface Data {
    address: string
    pub_key?: PublicKey.Data
    voting_power: string
    proposer_priority: string
  }

  export type Proto = Validator_pb
}
