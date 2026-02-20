import { MsgCancelProposal } from './MsgCancelProposal'
import { MsgSubmitProposalLegacy } from './MsgSubmitProposalLegacy'
import { MsgSubmitProposal } from './MsgSubmitProposal'
import { MsgVoteLegacy } from './MsgVoteLegacy'
import { MsgVote } from './MsgVote'
import { MsgDepositLegacy } from './MsgDepositLegacy'
import { MsgDeposit } from './MsgDeposit'
import { MsgVoteWeightedLegacy } from './MsgVoteWeightedLegacy'
import { MsgVoteWeighted } from './MsgVoteWeighted'
import { MsgUpdateGovParams } from './MsgUpdateGovParams'
import { MsgAddEmergencySubmitters } from './MsgAddEmergencySubmitters'
import { MsgRemoveEmergencySubmitters } from './MsgRemoveEmergencySubmitters'
import { MsgActivateEmergencyProposal } from './MsgActivateEmergencyProposal'

export * from './MsgCancelProposal'
export * from './MsgDepositLegacy'
export * from './MsgDeposit'
export * from './MsgSubmitProposalLegacy'
export * from './MsgSubmitProposal'
export * from './MsgVoteLegacy'
export * from './MsgVote'
export * from './MsgVoteWeightedLegacy'
export * from './MsgVoteWeighted'
export * from './MsgUpdateGovParams'
export * from './MsgAddEmergencySubmitters'
export * from './MsgRemoveEmergencySubmitters'
export * from './MsgActivateEmergencyProposal'

export type GovMsg =
  | MsgCancelProposal
  | MsgDepositLegacy
  | MsgDeposit
  | MsgSubmitProposalLegacy
  | MsgSubmitProposal
  | MsgVoteLegacy
  | MsgVote
  | MsgVoteWeightedLegacy
  | MsgVoteWeighted
  | MsgUpdateGovParams
  | MsgAddEmergencySubmitters
  | MsgRemoveEmergencySubmitters
  | MsgActivateEmergencyProposal

export namespace GovMsg {
  export type Amino =
    | MsgDepositLegacy.Amino
    | MsgDeposit.Amino
    | MsgSubmitProposalLegacy.Amino
    | MsgSubmitProposal.Amino
    | MsgVoteLegacy.Amino
    | MsgVote.Amino
    | MsgVoteWeightedLegacy.Amino
    | MsgVoteWeighted.Amino
    | MsgUpdateGovParams.Amino
    | MsgAddEmergencySubmitters.Amino
    | MsgRemoveEmergencySubmitters.Amino
    | MsgActivateEmergencyProposal.Amino
  export type Data =
    | MsgCancelProposal.Data
    | MsgDepositLegacy.Data
    | MsgDeposit.Data
    | MsgSubmitProposalLegacy.Data
    | MsgSubmitProposal.Data
    | MsgVoteLegacy.Data
    | MsgVote.Data
    | MsgVoteWeightedLegacy.Data
    | MsgVoteWeighted.Data
    | MsgUpdateGovParams.Data
    | MsgAddEmergencySubmitters.Data
    | MsgRemoveEmergencySubmitters.Data
    | MsgActivateEmergencyProposal.Data
  export type Proto =
    | MsgCancelProposal.Proto
    | MsgDepositLegacy.Proto
    | MsgDeposit.Proto
    | MsgSubmitProposalLegacy.Proto
    | MsgSubmitProposal.Proto
    | MsgVoteLegacy.Proto
    | MsgVote.Proto
    | MsgVoteWeightedLegacy.Proto
    | MsgVoteWeighted.Proto
    | MsgUpdateGovParams.Proto
    | MsgAddEmergencySubmitters.Proto
    | MsgRemoveEmergencySubmitters.Proto
    | MsgActivateEmergencyProposal.Proto
}
