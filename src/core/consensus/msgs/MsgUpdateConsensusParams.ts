import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { BlockParams } from '../BlockParams';
import { EvidenceParams } from '../EvidenceParams';
import { ValidatorParams } from '../ValidatorParams';
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
   */
  constructor(
    public authority: AccAddress,
    public block?: BlockParams,
    public evidence?: EvidenceParams,
    public validator?: ValidatorParams
  ) {
    super();
  }

  public static fromAmino(
    data: MsgUpdateConsensusParams.Amino
  ): MsgUpdateConsensusParams {
    const {
      value: { authority, block, evidence, validator },
    } = data;
    return new MsgUpdateConsensusParams(
      authority,
      block ? BlockParams.fromAmino(block) : undefined,
      evidence ? EvidenceParams.fromAmino(evidence) : undefined,
      validator ? ValidatorParams.fromAmino(validator) : undefined
    );
  }

  public toAmino(): MsgUpdateConsensusParams.Amino {
    const { authority, block, evidence, validator } = this;
    return {
      type: 'cosmos-sdk/x/consensus/MsgUpdateParams',
      value: {
        authority,
        block: block?.toAmino(),
        evidence: evidence?.toAmino(),
        validator: validator?.toAmino(),
      },
    };
  }

  public static fromData(
    data: MsgUpdateConsensusParams.Data
  ): MsgUpdateConsensusParams {
    const { authority, block, evidence, validator } = data;
    return new MsgUpdateConsensusParams(
      authority,
      block ? BlockParams.fromData(block) : undefined,
      evidence ? EvidenceParams.fromData(evidence) : undefined,
      validator ? ValidatorParams.fromData(validator) : undefined
    );
  }

  public toData(): MsgUpdateConsensusParams.Data {
    const { authority, block, evidence, validator } = this;
    return {
      '@type': '/cosmos.consensus.v1.MsgUpdateParams',
      authority,
      block: block?.toData(),
      evidence: evidence?.toData(),
      validator: validator?.toData(),
    };
  }

  public static fromProto(
    data: MsgUpdateConsensusParams.Proto
  ): MsgUpdateConsensusParams {
    return new MsgUpdateConsensusParams(
      data.authority,
      data.block ? BlockParams.fromProto(data.block) : undefined,
      data.evidence ? EvidenceParams.fromProto(data.evidence) : undefined,
      data.validator ? ValidatorParams.fromProto(data.validator) : undefined
    );
  }

  public toProto(): MsgUpdateConsensusParams.Proto {
    const { authority, block, evidence, validator } = this;
    return MsgUpdateParams_pb.fromPartial({
      authority,
      block: block?.toProto(),
      evidence: evidence?.toProto(),
      validator: validator?.toProto(),
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
    };
  }

  export interface Data {
    '@type': '/cosmos.consensus.v1.MsgUpdateParams';
    authority: AccAddress;
    block?: BlockParams.Data;
    evidence?: EvidenceParams.Data;
    validator?: ValidatorParams.Data;
  }

  export type Proto = MsgUpdateParams_pb;
}
