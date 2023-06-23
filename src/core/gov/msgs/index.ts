import { MsgSubmitProposal } from './MsgSubmitProposal';
import { MsgVote } from './MsgVote';
import { MsgDeposit } from './MsgDeposit';
import { MsgVoteWeighted } from './MsgVoteWeighted';
import { MsgUpdateGovParams } from './MsgUpdateGovParams';

export * from './MsgDeposit';
export * from './MsgSubmitProposal';
export * from './MsgVote';
export * from './MsgVoteWeighted';
export * from './MsgUpdateGovParams';

export type GovMsg =
  | MsgDeposit
  | MsgSubmitProposal
  | MsgVote
  | MsgVoteWeighted
  | MsgUpdateGovParams;

export namespace GovMsg {
  export type Amino =
    | MsgDeposit.Amino
    | MsgSubmitProposal.Amino
    | MsgVote.Amino
    | MsgVoteWeighted.Amino
    | MsgUpdateGovParams.Amino;
  export type Data =
    | MsgDeposit.Data
    | MsgSubmitProposal.Data
    | MsgVote.Data
    | MsgVoteWeighted.Data
    | MsgUpdateGovParams.Data;
  export type Proto =
    | MsgDeposit.Proto
    | MsgSubmitProposal.Proto
    | MsgVote.Proto
    | MsgVoteWeighted.Proto
    | MsgUpdateGovParams.Proto;
}
