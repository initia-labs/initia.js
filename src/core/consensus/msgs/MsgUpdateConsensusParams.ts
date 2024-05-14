import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { BlockParams } from '../BlockParams';
import { EvidenceParams } from '../EvidenceParams';
import { ValidatorParams } from '../ValidatorParams';
import { ABCIParams } from '../ABCIParams';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgUpdateParams as MsgUpdateParams_pb } from '@initia/initia.proto/cosmos/consensus/v1/tx';

export class MsgUpdateConsensusParams extends JSONSerializable<
  MsgUpdateConsensusParams.Amino,
  MsgUpdateConsensusParams.Data,
  MsgUpdateConsensusParams.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param block block params
   * @param evidence evidence params
   * @param validator validator params
   * @param abci ABCI params
   */
  constructor(
    public authority: AccAddress,
    public block?: BlockParams,
    public evidence?: EvidenceParams,
    public validator?: ValidatorParams,
    public abci?: ABCIParams
  ) {
    super();
  }

  public static fromAmino(
    data: MsgUpdateConsensusParams.Amino
  ): MsgUpdateConsensusParams {
    const {
      value: { authority, block, evidence, validator, abci },
    } = data;
    return new MsgUpdateConsensusParams(
      authority,
      block ? BlockParams.fromAmino(block) : undefined,
      evidence ? EvidenceParams.fromAmino(evidence) : undefined,
      validator ? ValidatorParams.fromAmino(validator) : undefined,
      abci ? ABCIParams.fromAmino(abci) : undefined
    );
  }

  public toAmino(): MsgUpdateConsensusParams.Amino {
    const { authority, block, evidence, validator, abci } = this;
    return {
      type: 'cosmos-sdk/x/consensus/MsgUpdateParams',
      value: {
        authority,
        block: block?.toAmino(),
        evidence: evidence?.toAmino(),
        validator: validator?.toAmino(),
        abci: abci?.toAmino(),
      },
    };
  }

  public static fromData(
    data: MsgUpdateConsensusParams.Data
  ): MsgUpdateConsensusParams {
    const { authority, block, evidence, validator, abci } = data;
    return new MsgUpdateConsensusParams(
      authority,
      block ? BlockParams.fromData(block) : undefined,
      evidence ? EvidenceParams.fromData(evidence) : undefined,
      validator ? ValidatorParams.fromData(validator) : undefined,
      abci ? ABCIParams.fromData(abci) : undefined
    );
  }

  public toData(): MsgUpdateConsensusParams.Data {
    const { authority, block, evidence, validator, abci } = this;
    return {
      '@type': '/cosmos.consensus.v1.MsgUpdateParams',
      authority,
      block: block?.toData(),
      evidence: evidence?.toData(),
      validator: validator?.toData(),
      abci: abci?.toData(),
    };
  }

  public static fromProto(
    data: MsgUpdateConsensusParams.Proto
  ): MsgUpdateConsensusParams {
    return new MsgUpdateConsensusParams(
      data.authority,
      BlockParams.fromProto(data.block as BlockParams.Proto),
      EvidenceParams.fromProto(data.evidence as EvidenceParams.Proto),
      ValidatorParams.fromProto(data.validator as ValidatorParams.Proto),
      ABCIParams.fromProto(data.abci as ABCIParams.Proto)
    );
  }

  public toProto(): MsgUpdateConsensusParams.Proto {
    const { authority, block, evidence, validator, abci } = this;
    return MsgUpdateParams_pb.fromPartial({
      authority,
      block: block?.toProto(),
      evidence: evidence?.toProto(),
      validator: validator?.toProto(),
      abci: abci?.toProto(),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.consensus.v1.MsgUpdateParams',
      value: MsgUpdateParams_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgUpdateConsensusParams {
    return MsgUpdateConsensusParams.fromProto(
      MsgUpdateParams_pb.decode(msgAny.value)
    );
  }
}

export namespace MsgUpdateConsensusParams {
  export interface Amino {
    type: 'cosmos-sdk/x/consensus/MsgUpdateParams';
    value: {
      authority: AccAddress;
      block?: BlockParams.Amino;
      evidence?: EvidenceParams.Amino;
      validator?: ValidatorParams.Amino;
      abci?: ABCIParams.Amino;
    };
  }

  export interface Data {
    '@type': '/cosmos.consensus.v1.MsgUpdateParams';
    authority: AccAddress;
    block?: BlockParams.Data;
    evidence?: EvidenceParams.Data;
    validator?: ValidatorParams.Data;
    abci?: ABCIParams.Data;
  }

  export type Proto = MsgUpdateParams_pb;
}
