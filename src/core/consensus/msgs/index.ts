import { MsgUpdateConsensusParams } from './MsgUpdateConsensusParams';

export * from './MsgUpdateConsensusParams';

export type ConsensusMsg = MsgUpdateConsensusParams;
export namespace ConsensusMsg {
  export type Amino = MsgUpdateConsensusParams.Amino;
  export type Data = MsgUpdateConsensusParams.Data;
  export type Proto = MsgUpdateConsensusParams.Proto;
}
