import { MsgCreateGroup } from './MsgCreateGroup'
import { MsgCreateGroupPolicy } from './MsgCreateGroupPolicy'
import { MsgCreateGroupWithPolicy } from './MsgCreateGroupWithPolicy'
import { MsgGroupExec } from './MsgGroupExec'
import { MsgGroupVote } from './MsgGroupVote'
import { MsgLeaveGroup } from './MsgLeaveGroup'
import { MsgSubmitGroupProposal } from './MsgSubmitGroupProposal'
import { MsgUpdateGroupAdmin } from './MsgUpdateGroupAdmin'
import { MsgUpdateGroupDecisionPolicy } from './MsgUpdateGroupDecisionPolicy'
import { MsgUpdateGroupMembers } from './MsgUpdateGroupMembers'
import { MsgUpdateGroupMetadata } from './MsgUpdateGroupMetadata'
import { MsgUpdateGroupPolicyAdmin } from './MsgUpdateGroupPolicyAdmin'
import { MsgUpdateGroupPolicyMetadata } from './MsgUpdateGroupPolicyMetadata'

export * from './MsgCreateGroup'
export * from './MsgCreateGroupPolicy'
export * from './MsgCreateGroupWithPolicy'
export * from './MsgGroupExec'
export * from './MsgGroupVote'
export * from './MsgLeaveGroup'
export * from './MsgSubmitGroupProposal'
export * from './MsgUpdateGroupAdmin'
export * from './MsgUpdateGroupDecisionPolicy'
export * from './MsgUpdateGroupMembers'
export * from './MsgUpdateGroupMetadata'
export * from './MsgUpdateGroupPolicyAdmin'
export * from './MsgUpdateGroupPolicyMetadata'

export type GroupMsg =
  | MsgCreateGroup
  | MsgCreateGroupPolicy
  | MsgCreateGroupWithPolicy
  | MsgGroupExec
  | MsgGroupVote
  | MsgLeaveGroup
  | MsgSubmitGroupProposal
  | MsgUpdateGroupAdmin
  | MsgUpdateGroupDecisionPolicy
  | MsgUpdateGroupMembers
  | MsgUpdateGroupMetadata
  | MsgUpdateGroupPolicyAdmin
  | MsgUpdateGroupPolicyMetadata

export namespace GroupMsg {
  export type Amino =
    | MsgCreateGroup.Amino
    | MsgCreateGroupPolicy.Amino
    | MsgCreateGroupWithPolicy.Amino
    | MsgGroupExec.Amino
    | MsgGroupVote.Amino
    | MsgLeaveGroup.Amino
    | MsgSubmitGroupProposal.Amino
    | MsgUpdateGroupAdmin.Amino
    | MsgUpdateGroupDecisionPolicy.Amino
    | MsgUpdateGroupMembers.Amino
    | MsgUpdateGroupMetadata.Amino
    | MsgUpdateGroupPolicyAdmin.Amino
    | MsgUpdateGroupPolicyMetadata.Amino

  export type Data =
    | MsgCreateGroup.Data
    | MsgCreateGroupPolicy.Data
    | MsgCreateGroupWithPolicy.Data
    | MsgGroupExec.Data
    | MsgGroupVote.Data
    | MsgLeaveGroup.Data
    | MsgSubmitGroupProposal.Data
    | MsgUpdateGroupAdmin.Data
    | MsgUpdateGroupDecisionPolicy.Data
    | MsgUpdateGroupMembers.Data
    | MsgUpdateGroupMetadata.Data
    | MsgUpdateGroupPolicyAdmin.Data
    | MsgUpdateGroupPolicyMetadata.Data

  export type Proto =
    | MsgCreateGroup.Proto
    | MsgCreateGroupPolicy.Proto
    | MsgCreateGroupWithPolicy.Proto
    | MsgGroupExec.Proto
    | MsgGroupVote.Proto
    | MsgLeaveGroup.Proto
    | MsgSubmitGroupProposal.Proto
    | MsgUpdateGroupAdmin.Proto
    | MsgUpdateGroupDecisionPolicy.Proto
    | MsgUpdateGroupMembers.Proto
    | MsgUpdateGroupMetadata.Proto
    | MsgUpdateGroupPolicyAdmin.Proto
    | MsgUpdateGroupPolicyMetadata.Proto
}
