import { AuthMsg, MsgUpdateAuthParams } from './auth/msgs';
import {
  AuthzMsg,
  MsgGrantAuthorization,
  MsgRevokeAuthorization,
  MsgExecAuthorized,
} from './authz/msgs';
import {
  BankMsg,
  MsgMultiSend,
  MsgSend,
  MsgUpdateBankParams,
  MsgSetSendEnabled,
} from './bank/msgs';
import {
  CrisisMsg,
  MsgVerifyInvariant,
  MsgUpdateCrisisParams,
} from './crisis/msgs';
import {
  DistributionMsg,
  MsgSetWithdrawAddress,
  MsgWithdrawDelegatorReward,
  MsgWithdrawValidatorCommission,
  MsgFundCommunityPool,
  MsgUpdateDistrParams,
  MsgCommunityPoolSpend,
} from './distribution/msgs';
import {
  FeeGrantMsg,
  MsgGrantAllowance,
  MsgRevokeAllowance,
} from './feegrant/msgs';
import {
  GovMsg,
  MsgDeposit,
  MsgSubmitProposalLegacy,
  MsgSubmitProposal,
  MsgVote,
  MsgVoteWeighted,
  MsgUpdateGovParams,
} from './gov/msgs';
import {
  GroupMsg,
  MsgCreateGroup,
  MsgCreateGroupPolicy,
  MsgCreateGroupWithPolicy,
  MsgGroupExec,
  MsgGroupVote,
  MsgLeaveGroup,
  MsgSubmitGroupProposal,
  MsgUpdateGroupAdmin,
  MsgUpdateGroupDecisionPolicy,
  MsgUpdateGroupMembers,
  MsgUpdateGroupMetadata,
  MsgUpdateGroupPolicyAdmin,
  MsgUpdateGroupPolicyMetadata,
} from './group/msgs';
import { IbcTransferMsg, MsgTransfer } from './ibc/applications/transfer';
import {
  IbcFeeMsg,
  MsgPayPacketFee,
  MsgPayPacketFeeAsync,
  MsgRegisterCounterpartyPayee,
  MsgRegisterPayee,
} from './ibc/applications/fee/msgs';
import {
  IbcNftMsg,
  MsgNftTransfer,
  MsgUpdateIbcNftParams,
} from './ibc/applications/nft-transfer';
import {
  IbcSftMsg,
  MsgSftTransfer,
  MsgUpdateIbcSftParams,
} from './ibc/applications/sft-transfer';
import {
  IbcClientMsg,
  MsgCreateClient,
  MsgUpdateClient,
  MsgUpgradeClient,
  MsgSubmitMisbehaviour,
} from './ibc/msgs/client';
import {
  IbcConnectionMsg,
  MsgConnectionOpenInit,
  MsgConnectionOpenTry,
  MsgConnectionOpenConfirm,
  MsgConnectionOpenAck,
} from './ibc/msgs/connection';
import {
  IbcChannelMsg,
  MsgChannelOpenInit,
  MsgChannelOpenTry,
  MsgChannelOpenConfirm,
  MsgChannelOpenAck,
  MsgChannelCloseInit,
  MsgChannelCloseConfirm,
  MsgRecvPacket,
  MsgAcknowledgement,
  MsgTimeout,
  MsgTimeoutOnClose,
} from './ibc/msgs/channel';
import { InterTxMsg, MsgRegisterAccount, MsgSubmitTx } from './intertx/msgs';
import {
  MoveMsg,
  MsgPublish,
  MsgExecute,
  MsgScript,
  MsgUpdateMoveParams,
  MsgWhitelist,
  MsgDelist,
} from './move/msgs';
import {
  MstakingMsg,
  MsgBeginRedelegate,
  MsgCreateValidator,
  MsgDelegate,
  MsgEditValidator,
  MsgUndelegate,
  MsgUpdateMstakingParams,
} from './mstaking/msgs';
import { RewardMsg, MsgUpdateRewardParams } from './reward/msgs';
import {
  SlashingMsg,
  MsgUnjail,
  MsgUpdateSlashingParams,
} from './slashing/msgs';
import {
  UpgradeMsg,
  MsgSoftwareUpgrade,
  MsgCancelUpgrade,
} from './upgrade/msgs';
import { Any } from '@initia/initia.proto/google/protobuf/any';

export type Msg =
  | AuthMsg
  | AuthzMsg
  | BankMsg
  | CrisisMsg
  | DistributionMsg
  | FeeGrantMsg
  | GovMsg
  | GroupMsg
  | IbcFeeMsg
  | IbcTransferMsg
  | IbcNftMsg
  | IbcSftMsg
  | IbcClientMsg
  | IbcConnectionMsg
  | IbcChannelMsg
  | InterTxMsg
  | MoveMsg
  | MstakingMsg
  | RewardMsg
  | SlashingMsg
  | UpgradeMsg;

export namespace Msg {
  export type Amino =
    | AuthMsg.Amino
    | AuthzMsg.Amino
    | BankMsg.Amino
    | CrisisMsg.Amino
    | DistributionMsg.Amino
    | FeeGrantMsg.Amino
    | GovMsg.Amino
    | GroupMsg.Amino
    | IbcTransferMsg.Amino
    | IbcNftMsg.Amino
    | IbcSftMsg.Amino
    | MoveMsg.Amino
    | MstakingMsg.Amino
    | RewardMsg.Amino
    | SlashingMsg.Amino
    | UpgradeMsg.Amino;

  export type Data =
    | AuthMsg.Data
    | AuthzMsg.Data
    | BankMsg.Data
    | CrisisMsg.Data
    | DistributionMsg.Data
    | FeeGrantMsg.Data
    | GovMsg.Data
    | GroupMsg.Data
    | IbcFeeMsg.Data
    | IbcTransferMsg.Data
    | IbcNftMsg.Data
    | IbcSftMsg.Data
    | IbcClientMsg.Data
    | IbcConnectionMsg.Data
    | IbcChannelMsg.Data
    | InterTxMsg.Data
    | MoveMsg.Data
    | MstakingMsg.Data
    | RewardMsg.Data
    | SlashingMsg.Data
    | UpgradeMsg.Data;

  export type Proto =
    | AuthMsg.Proto
    | AuthzMsg.Proto
    | BankMsg.Proto
    | CrisisMsg.Proto
    | DistributionMsg.Proto
    | FeeGrantMsg.Proto
    | GovMsg.Proto
    | GroupMsg.Proto
    | IbcFeeMsg.Proto
    | IbcTransferMsg.Proto
    | IbcNftMsg.Proto
    | IbcSftMsg.Proto
    | IbcClientMsg.Proto
    | IbcConnectionMsg.Proto
    | IbcChannelMsg.Proto
    | InterTxMsg.Proto
    | MoveMsg.Proto
    | MstakingMsg.Proto
    | RewardMsg.Proto
    | SlashingMsg.Proto
    | UpgradeMsg.Proto;

  export function fromAmino(data: Msg.Amino): Msg {
    switch (data.type) {
      // auth
      case 'cosmos-sdk/x/auth/MsgUpdateParams':
        return MsgUpdateAuthParams.fromAmino(data);

      // authz
      case 'cosmos-sdk/MsgGrant':
        return MsgGrantAuthorization.fromAmino(data);
      case 'cosmos-sdk/MsgRevoke':
        return MsgRevokeAuthorization.fromAmino(data);
      case 'cosmos-sdk/MsgExec':
        return MsgExecAuthorized.fromAmino(data);

      // bank
      case 'cosmos-sdk/MsgSend':
        return MsgSend.fromAmino(data);
      case 'cosmos-sdk/MsgMultiSend':
        return MsgMultiSend.fromAmino(data);
      case 'cosmos-sdk/x/bank/MsgUpdateParams':
        return MsgUpdateBankParams.fromAmino(data);
      case 'cosmos-sdk/MsgSetSendEnabled':
        return MsgSetSendEnabled.fromAmino(data);

      // crisis
      case 'cosmos-sdk/MsgVerifyInvariant':
        return MsgVerifyInvariant.fromAmino(data);
      case 'cosmos-sdk/x/crisis/MsgUpdateParams':
        return MsgUpdateCrisisParams.fromAmino(data);

      // distribution
      case 'cosmos-sdk/MsgModifyWithdrawAddress':
        return MsgSetWithdrawAddress.fromAmino(data);
      case 'cosmos-sdk/MsgWithdrawDelegationReward':
        return MsgWithdrawDelegatorReward.fromAmino(data);
      case 'cosmos-sdk/MsgWithdrawValidatorCommission':
        return MsgWithdrawValidatorCommission.fromAmino(data);
      case 'cosmos-sdk/MsgFundCommunityPool':
        return MsgFundCommunityPool.fromAmino(data);
      case 'distribution/MsgUpdateParams':
        return MsgUpdateDistrParams.fromAmino(data);
      case 'cosmos-sdk/distr/MsgCommunityPoolSpend':
        return MsgCommunityPoolSpend.fromAmino(data);

      // feegrant
      case 'cosmos-sdk/MsgGrantAllowance':
        return MsgGrantAllowance.fromAmino(data);
      case 'cosmos-sdk/MsgRevokeAllowance':
        return MsgRevokeAllowance.fromAmino(data);

      // gov
      case 'cosmos-sdk/v1/MsgDeposit':
        return MsgDeposit.fromAmino(data);
      case 'cosmos-sdk/MsgSubmitProposal':
        return MsgSubmitProposalLegacy.fromAmino(data);
      case 'cosmos-sdk/v1/MsgSubmitProposal':
        return MsgSubmitProposal.fromAmino(data);
      case 'cosmos-sdk/v1/MsgVote':
        return MsgVote.fromAmino(data);
      case 'cosmos-sdk/v1/MsgVoteWeighted':
        return MsgVoteWeighted.fromAmino(data);
      case 'cosmos-sdk/x/gov/v1/MsgUpdateParams':
        return MsgUpdateGovParams.fromAmino(data);

      // group
      case 'cosmos-sdk/MsgCreateGroup':
        return MsgCreateGroup.fromAmino(data);
      case 'cosmos-sdk/MsgCreateGroupPolicy':
        return MsgCreateGroupPolicy.fromAmino(data);
      case 'cosmos-sdk/MsgCreateGroupWithPolicy':
        return MsgCreateGroupWithPolicy.fromAmino(data);
      case 'cosmos-sdk/MsgUpdateGroupAdmin':
        return MsgUpdateGroupAdmin.fromAmino(data);
      case 'cosmos-sdk/MsgUpdateGroupDecisionPolicy':
        return MsgUpdateGroupDecisionPolicy.fromAmino(data);
      case 'cosmos-sdk/MsgUpdateGroupMembers':
        return MsgUpdateGroupMembers.fromAmino(data);
      case 'cosmos-sdk/MsgUpdateGroupMetadata':
        return MsgUpdateGroupMetadata.fromAmino(data);
      case 'cosmos-sdk/MsgUpdateGroupPolicyAdmin':
        return MsgUpdateGroupPolicyAdmin.fromAmino(data);
      case 'cosmos-sdk/MsgUpdateGroupPolicyMetadata':
        return MsgUpdateGroupPolicyMetadata.fromAmino(data);
      case 'cosmos-sdk/group/MsgExec':
        return MsgGroupExec.fromAmino(data);
      case 'cosmos-sdk/group/MsgLeaveGroup':
        return MsgLeaveGroup.fromAmino(data);
      case 'cosmos-sdk/group/MsgSubmitProposal':
        return MsgSubmitGroupProposal.fromAmino(data);
      case 'cosmos-sdk/group/MsgVote':
        return MsgGroupVote.fromAmino(data);

      // ibc-transfer
      case 'cosmos-sdk/MsgTransfer':
        return MsgTransfer.fromAmino(data);

      // ibc-nft-transfer
      case 'nft-transfer/MsgNftTransfer':
        return MsgNftTransfer.fromAmino(data);
      case 'nft-transfer/MsgUpdateParams':
        return MsgUpdateIbcNftParams.fromAmino(data);

      // ibc-sft-transfer
      case 'sft-transfer/MsgSftTransfer':
        return MsgSftTransfer.fromAmino(data);
      case 'sft-transfer/MsgUpdateParams':
        return MsgUpdateIbcSftParams.fromAmino(data);

      // move
      case 'move/MsgPublish':
        return MsgPublish.fromAmino(data);
      case 'move/MsgExecute':
        return MsgExecute.fromAmino(data);
      case 'move/MsgScript':
        return MsgScript.fromAmino(data);
      case 'move/MsgUpdateParams':
        return MsgUpdateMoveParams.fromAmino(data);
      case 'move/MsgWhitelist':
        return MsgWhitelist.fromAmino(data);
      case 'move/MsgDelist':
        return MsgDelist.fromAmino(data);

      // mstaking
      case 'mstaking/MsgDelegate':
        return MsgDelegate.fromAmino(data);
      case 'mstaking/MsgUndelegate':
        return MsgUndelegate.fromAmino(data);
      case 'mstaking/MsgBeginRedelegate':
        return MsgBeginRedelegate.fromAmino(data);
      case 'mstaking/MsgCreateValidator':
        return MsgCreateValidator.fromAmino(data);
      case 'mstaking/MsgEditValidator':
        return MsgEditValidator.fromAmino(data);
      case 'mstaking/MsgUpdateParams':
        return MsgUpdateMstakingParams.fromAmino(data);

      // reward
      case 'reward/MsgUpdateParams':
        return MsgUpdateRewardParams.fromAmino(data);

      // slashing
      case 'cosmos-sdk/MsgUnjail':
        return MsgUnjail.fromAmino(data);
      case 'cosmos-sdk/x/slashing/MsgUpdateParams':
        return MsgUpdateSlashingParams.fromAmino(data);

      // upgrade
      case 'cosmos-sdk/MsgSoftwareUpgrade':
        return MsgSoftwareUpgrade.fromAmino(data);
      case 'cosmos-sdk/MsgCancelUpgrade':
        return MsgCancelUpgrade.fromAmino(data);
    }
  }

  export function fromData(data: Msg.Data): Msg {
    switch (data['@type']) {
      //auth
      case '/cosmos.auth.v1beta1.MsgUpdateParams':
        return MsgUpdateAuthParams.fromData(data);

      // authz
      case '/cosmos.authz.v1beta1.MsgGrant':
        return MsgGrantAuthorization.fromData(data);
      case '/cosmos.authz.v1beta1.MsgRevoke':
        return MsgRevokeAuthorization.fromData(data);
      case '/cosmos.authz.v1beta1.MsgExec':
        return MsgExecAuthorized.fromData(data);

      // bank
      case '/cosmos.bank.v1beta1.MsgSend':
        return MsgSend.fromData(data);
      case '/cosmos.bank.v1beta1.MsgMultiSend':
        return MsgMultiSend.fromData(data);
      case '/cosmos.bank.v1beta1.MsgUpdateParams':
        return MsgUpdateBankParams.fromData(data);
      case '/cosmos.bank.v1beta1.MsgSetSendEnabled':
        return MsgSetSendEnabled.fromData(data);

      // crisis
      case '/cosmos.crisis.v1beta1.MsgVerifyInvariant':
        return MsgVerifyInvariant.fromData(data);
      case '/cosmos.crisis.v1beta1.MsgUpdateParams':
        return MsgUpdateCrisisParams.fromData(data);

      // distribution
      case '/cosmos.distribution.v1beta1.MsgSetWithdrawAddress':
        return MsgSetWithdrawAddress.fromData(data);
      case '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward':
        return MsgWithdrawDelegatorReward.fromData(data);
      case '/cosmos.distribution.v1beta1.MsgWithdrawValidatorCommission':
        return MsgWithdrawValidatorCommission.fromData(data);
      case '/cosmos.distribution.v1beta1.MsgFundCommunityPool':
        return MsgFundCommunityPool.fromData(data);
      case '/initia.distribution.v1.MsgUpdateParams':
        return MsgUpdateDistrParams.fromData(data);
      case '/cosmos.distribution.v1beta1.MsgCommunityPoolSpend':
        return MsgCommunityPoolSpend.fromData(data);

      // feegrant
      case '/cosmos.feegrant.v1beta1.MsgGrantAllowance':
        return MsgGrantAllowance.fromData(data);
      case '/cosmos.feegrant.v1beta1.MsgRevokeAllowance':
        return MsgRevokeAllowance.fromData(data);

      // gov
      case '/cosmos.gov.v1.MsgDeposit':
        return MsgDeposit.fromData(data);
      case '/cosmos.gov.v1beta1.MsgSubmitProposal':
        return MsgSubmitProposalLegacy.fromData(data);
      case '/cosmos.gov.v1.MsgSubmitProposal':
        return MsgSubmitProposal.fromData(data);
      case '/cosmos.gov.v1.MsgVote':
        return MsgVote.fromData(data);
      case '/cosmos.gov.v1.MsgVoteWeighted':
        return MsgVoteWeighted.fromData(data);
      case '/cosmos.gov.v1.MsgUpdateParams':
        return MsgUpdateGovParams.fromData(data);

      // group
      case '/cosmos.group.v1.MsgCreateGroup':
        return MsgCreateGroup.fromData(data);
      case '/cosmos.group.v1.MsgCreateGroupPolicy':
        return MsgCreateGroupPolicy.fromData(data);
      case '/cosmos.group.v1.MsgCreateGroupWithPolicy':
        return MsgCreateGroupWithPolicy.fromData(data);
      case '/cosmos.group.v1.MsgExec':
        return MsgGroupExec.fromData(data);
      case '/cosmos.group.v1.MsgLeaveGroup':
        return MsgLeaveGroup.fromData(data);
      case '/cosmos.group.v1.MsgSubmitProposal':
        return MsgSubmitGroupProposal.fromData(data);
      case '/cosmos.group.v1.MsgUpdateGroupAdmin':
        return MsgUpdateGroupAdmin.fromData(data);
      case '/cosmos.group.v1.MsgUpdateGroupMembers':
        return MsgUpdateGroupMembers.fromData(data);
      case '/cosmos.group.v1.MsgUpdateGroupMetadata':
        return MsgUpdateGroupMetadata.fromData(data);
      case '/cosmos.group.v1.MsgUpdateGroupPolicyAdmin':
        return MsgUpdateGroupPolicyAdmin.fromData(data);
      case '/cosmos.group.v1.MsgUpdateGroupPolicyDecisionPolicy':
        return MsgUpdateGroupDecisionPolicy.fromData(data);
      case '/cosmos.group.v1.MsgUpdateGroupPolicyMetadata':
        return MsgUpdateGroupPolicyMetadata.fromData(data);
      case '/cosmos.group.v1.MsgVote':
        return MsgGroupVote.fromData(data);

      // ibc-fee
      case '/ibc.applications.fee.v1.MsgPayPacketFee':
        return MsgPayPacketFee.fromData(data);
      case '/ibc.applications.fee.v1.MsgPayPacketFeeAsync':
        return MsgPayPacketFeeAsync.fromData(data);
      case '/ibc.applications.fee.v1.MsgRegisterCounterpartyPayee':
        return MsgRegisterCounterpartyPayee.fromData(data);
      case '/ibc.applications.fee.v1.MsgRegisterPayee':
        return MsgRegisterPayee.fromData(data);

      // ibc-transfer
      case '/ibc.applications.transfer.v1.MsgTransfer':
        return MsgTransfer.fromData(data);

      // ibc-nft-transfer
      case '/ibc.applications.nft_transfer.v1.MsgNftTransfer':
        return MsgNftTransfer.fromData(data);
      case '/ibc.applications.nft_transfer.v1.MsgUpdateParams':
        return MsgUpdateIbcNftParams.fromData(data);

      // ibc-sft-transfer
      case '/ibc.applications.sft_transfer.v1.MsgSftTransfer':
        return MsgSftTransfer.fromData(data);
      case '/ibc.applications.sft_transfer.v1.MsgUpdateParams':
        return MsgUpdateIbcSftParams.fromData(data);

      // ibc-client
      case '/ibc.core.client.v1.MsgCreateClient':
        return MsgCreateClient.fromData(data);
      case '/ibc.core.client.v1.MsgUpdateClient':
        return MsgUpdateClient.fromData(data);
      case '/ibc.core.client.v1.MsgUpgradeClient':
        return MsgUpgradeClient.fromData(data);
      case '/ibc.core.client.v1.MsgSubmitMisbehaviour':
        return MsgSubmitMisbehaviour.fromData(data);

      // ibc-connection
      case '/ibc.core.connection.v1.MsgConnectionOpenInit':
        return MsgConnectionOpenInit.fromData(data);
      case '/ibc.core.connection.v1.MsgConnectionOpenTry':
        return MsgConnectionOpenTry.fromData(data);
      case '/ibc.core.connection.v1.MsgConnectionOpenConfirm':
        return MsgConnectionOpenConfirm.fromData(data);
      case '/ibc.core.connection.v1.MsgConnectionOpenAck':
        return MsgConnectionOpenAck.fromData(data);

      // ibc-channel
      case '/ibc.core.channel.v1.MsgChannelOpenInit':
        return MsgChannelOpenInit.fromData(data);
      case '/ibc.core.channel.v1.MsgChannelOpenTry':
        return MsgChannelOpenTry.fromData(data);
      case '/ibc.core.channel.v1.MsgChannelOpenConfirm':
        return MsgChannelOpenConfirm.fromData(data);
      case '/ibc.core.channel.v1.MsgChannelOpenAck':
        return MsgChannelOpenAck.fromData(data);
      case '/ibc.core.channel.v1.MsgChannelCloseInit':
        return MsgChannelCloseInit.fromData(data);
      case '/ibc.core.channel.v1.MsgChannelCloseConfirm':
        return MsgChannelCloseConfirm.fromData(data);
      case '/ibc.core.channel.v1.MsgRecvPacket':
        return MsgRecvPacket.fromData(data);
      case '/ibc.core.channel.v1.MsgAcknowledgement':
        return MsgAcknowledgement.fromData(data);
      case '/ibc.core.channel.v1.MsgTimeout':
        return MsgTimeout.fromData(data);
      case '/ibc.core.channel.v1.MsgTimeoutOnClose':
        return MsgTimeoutOnClose.fromData(data);

      // intertx
      case '/intertx.MsgRegisterAccount':
        return MsgRegisterAccount.fromData(data);
      case '/intertx.MsgSubmitTx':
        return MsgSubmitTx.fromData(data);

      // move
      case '/initia.move.v1.MsgPublish':
        return MsgPublish.fromData(data);
      case '/initia.move.v1.MsgExecute':
        return MsgExecute.fromData(data);
      case '/initia.move.v1.MsgScript':
        return MsgScript.fromData(data);
      case '/initia.move.v1.MsgUpdateParams':
        return MsgUpdateMoveParams.fromData(data);
      case '/initia.move.v1.MsgWhitelist':
        return MsgWhitelist.fromData(data);
      case '/initia.move.v1.MsgDelist':
        return MsgDelist.fromData(data);

      // mstaking
      case '/initia.mstaking.v1.MsgDelegate':
        return MsgDelegate.fromData(data);
      case '/initia.mstaking.v1.MsgUndelegate':
        return MsgUndelegate.fromData(data);
      case '/initia.mstaking.v1.MsgBeginRedelegate':
        return MsgBeginRedelegate.fromData(data);
      case '/initia.mstaking.v1.MsgCreateValidator':
        return MsgCreateValidator.fromData(data);
      case '/initia.mstaking.v1.MsgEditValidator':
        return MsgEditValidator.fromData(data);
      case '/initia.mstaking.v1.MsgUpdateParams':
        return MsgUpdateMstakingParams.fromData(data);

      // reward
      case '/initia.reward.v1.MsgUpdateParams':
        return MsgUpdateRewardParams.fromData(data);

      // slashing
      case '/cosmos.slashing.v1beta1.MsgUnjail':
        return MsgUnjail.fromData(data);
      case '/cosmos.slashing.v1beta1.MsgUpdateParams':
        return MsgUpdateSlashingParams.fromData(data);

      // upgrade
      case '/cosmos.upgrade.v1beta1.MsgSoftwareUpgrade':
        return MsgSoftwareUpgrade.fromData(data);
      case '/cosmos.upgrade.v1beta1.MsgCancelUpgrade':
        return MsgCancelUpgrade.fromData(data);

      default:
        throw Error(`not supported msg ${data['@type']}`);
    }
  }

  export function fromProto(proto: Any): Msg {
    switch (proto.typeUrl) {
      // auth
      case '/cosmos.auth.v1beta1.MsgUpdateParams':
        return MsgUpdateAuthParams.unpackAny(proto);

      // authz
      case '/cosmos.authz.v1beta1.MsgGrant':
        return MsgGrantAuthorization.unpackAny(proto);
      case '/cosmos.authz.v1beta1.MsgRevoke':
        return MsgRevokeAuthorization.unpackAny(proto);
      case '/cosmos.authz.v1beta1.MsgExec':
        return MsgExecAuthorized.unpackAny(proto);

      // bank
      case '/cosmos.bank.v1beta1.MsgSend':
        return MsgSend.unpackAny(proto);
      case '/cosmos.bank.v1beta1.MsgMultiSend':
        return MsgMultiSend.unpackAny(proto);
      case '/cosmos.bank.v1beta1.MsgUpdateParams':
        return MsgUpdateBankParams.unpackAny(proto);
      case '/cosmos.bank.v1beta1.MsgSetSendEnabled':
        return MsgSetSendEnabled.unpackAny(proto);

      // crisis
      case '/cosmos.crisis.v1beta1.MsgVerifyInvariant':
        return MsgVerifyInvariant.unpackAny(proto);
      case '/cosmos.crisis.v1beta1.MsgUpdateParams':
        return MsgUpdateCrisisParams.unpackAny(proto);

      // distribution
      case '/cosmos.distribution.v1beta1.MsgSetWithdrawAddress':
        return MsgSetWithdrawAddress.unpackAny(proto);
      case '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward':
        return MsgWithdrawDelegatorReward.unpackAny(proto);
      case '/cosmos.distribution.v1beta1.MsgWithdrawValidatorCommission':
        return MsgWithdrawValidatorCommission.unpackAny(proto);
      case '/cosmos.distribution.v1beta1.MsgFundCommunityPool':
        return MsgFundCommunityPool.unpackAny(proto);
      case '/initia.distribution.v1.MsgUpdateParams':
        return MsgUpdateDistrParams.unpackAny(proto);
      case '/cosmos.distribution.v1beta1.MsgCommunityPoolSpend':
        return MsgCommunityPoolSpend.unpackAny(proto);

      // feegrant
      case '/cosmos.feegrant.v1beta1.MsgGrantAllowance':
        return MsgGrantAllowance.unpackAny(proto);
      case '/cosmos.feegrant.v1beta1.MsgRevokeAllowance':
        return MsgRevokeAllowance.unpackAny(proto);

      // gov
      case '/cosmos.gov.v1.MsgDeposit':
        return MsgDeposit.unpackAny(proto);
      case '/cosmos.gov.v1beta1.MsgSubmitProposal':
        return MsgSubmitProposalLegacy.unpackAny(proto);
      case '/cosmos.gov.v1.MsgSubmitProposal':
        return MsgSubmitProposal.unpackAny(proto);
      case '/cosmos.gov.v1.MsgVote':
        return MsgVote.unpackAny(proto);
      case '/cosmos.gov.v1.MsgVoteWeighted':
        return MsgVoteWeighted.unpackAny(proto);
      case '/cosmos.gov.v1.MsgUpdateParams':
        return MsgUpdateGovParams.unpackAny(proto);

      // group
      case '/cosmos.group.v1.MsgCreateGroup':
        return MsgCreateGroup.unpackAny(proto);
      case '/cosmos.group.v1.MsgCreateGroupPolicy':
        return MsgCreateGroupPolicy.unpackAny(proto);
      case '/cosmos.group.v1.MsgCreateGroupWithPolicy':
        return MsgCreateGroupWithPolicy.unpackAny(proto);
      case '/cosmos.group.v1.MsgExec':
        return MsgGroupExec.unpackAny(proto);
      case '/cosmos.group.v1.MsgLeaveGroup':
        return MsgLeaveGroup.unpackAny(proto);
      case '/cosmos.group.v1.MsgSubmitProposal':
        return MsgSubmitGroupProposal.unpackAny(proto);
      case '/cosmos.group.v1.MsgUpdateGroupAdmin':
        return MsgUpdateGroupAdmin.unpackAny(proto);
      case '/cosmos.group.v1.MsgUpdateGroupMembers':
        return MsgUpdateGroupMembers.unpackAny(proto);
      case '/cosmos.group.v1.MsgUpdateGroupMetadata':
        return MsgUpdateGroupMetadata.unpackAny(proto);
      case '/cosmos.group.v1.MsgUpdateGroupPolicyAdmin':
        return MsgUpdateGroupPolicyAdmin.unpackAny(proto);
      case '/cosmos.group.v1.MsgUpdateGroupPolicyDecisionPolicy':
        return MsgUpdateGroupDecisionPolicy.unpackAny(proto);
      case '/cosmos.group.v1.MsgUpdateGroupPolicyMetadata':
        return MsgUpdateGroupPolicyMetadata.unpackAny(proto);
      case '/cosmos.group.v1.MsgVote':
        return MsgGroupVote.unpackAny(proto);

      // ibc-fee
      case '/ibc.applications.fee.v1.MsgPayPacketFee':
        return MsgPayPacketFee.unpackAny(proto);
      case '/ibc.applications.fee.v1.MsgPayPacketFeeAsync':
        return MsgPayPacketFeeAsync.unpackAny(proto);
      case '/ibc.applications.fee.v1.MsgRegisterCounterpartyPayee':
        return MsgRegisterCounterpartyPayee.unpackAny(proto);
      case '/ibc.applications.fee.v1.MsgRegisterPayee':
        return MsgRegisterPayee.unpackAny(proto);

      // ibc-transfer
      case '/ibc.applications.transfer.v1.MsgTransfer':
        return MsgTransfer.unpackAny(proto);

      // ibc-nft-transfer
      case '/ibc.applications.nft_transfer.v1.MsgNftTransfer':
        return MsgNftTransfer.unpackAny(proto);
      case '/ibc.applications.nft_transfer.v1.MsgUpdateParams':
        return MsgUpdateIbcNftParams.unpackAny(proto);

      // ibc-sft-transfer
      case '/ibc.applications.sft_transfer.v1.MsgSftTransfer':
        return MsgSftTransfer.unpackAny(proto);
      case '/ibc.applications.sft_transfer.v1.MsgUpdateParams':
        return MsgUpdateIbcSftParams.unpackAny(proto);

      // ibc-client
      case '/ibc.core.client.v1.MsgCreateClient':
        return MsgCreateClient.unpackAny(proto);
      case '/ibc.core.client.v1.MsgUpdateClient':
        return MsgUpdateClient.unpackAny(proto);
      case '/ibc.core.client.v1.MsgUpgradeClient':
        return MsgUpgradeClient.unpackAny(proto);
      case '/ibc.core.client.v1.MsgSubmitMisbehaviour':
        return MsgSubmitMisbehaviour.unpackAny(proto);

      // ibc-connection
      case '/ibc.core.connection.v1.MsgConnectionOpenInit':
        return MsgConnectionOpenInit.unpackAny(proto);
      case '/ibc.core.connection.v1.MsgConnectionOpenTry':
        return MsgConnectionOpenTry.unpackAny(proto);
      case '/ibc.core.connection.v1.MsgConnectionOpenConfirm':
        return MsgConnectionOpenConfirm.unpackAny(proto);
      case '/ibc.core.connection.v1.MsgConnectionOpenAck':
        return MsgConnectionOpenAck.unpackAny(proto);

      // ibc-channel
      case '/ibc.core.channel.v1.MsgChannelOpenInit':
        return MsgChannelOpenInit.unpackAny(proto);
      case '/ibc.core.channel.v1.MsgChannelOpenTry':
        return MsgChannelOpenTry.unpackAny(proto);
      case '/ibc.core.channel.v1.MsgChannelOpenConfirm':
        return MsgChannelOpenConfirm.unpackAny(proto);
      case '/ibc.core.channel.v1.MsgChannelOpenAck':
        return MsgChannelOpenAck.unpackAny(proto);
      case '/ibc.core.channel.v1.MsgChannelCloseInit':
        return MsgChannelCloseInit.unpackAny(proto);
      case '/ibc.core.channel.v1.MsgChannelCloseConfirm':
        return MsgChannelCloseConfirm.unpackAny(proto);
      case '/ibc.core.channel.v1.MsgRecvPacket':
        return MsgRecvPacket.unpackAny(proto);
      case '/ibc.core.channel.v1.MsgAcknowledgement':
        return MsgAcknowledgement.unpackAny(proto);
      case '/ibc.core.channel.v1.MsgTimeout':
        return MsgTimeout.unpackAny(proto);
      case '/ibc.core.channel.v1.MsgTimeoutOnClose':
        return MsgTimeoutOnClose.unpackAny(proto);

      // intertx
      case '/intertx.MsgRegisterAccount':
        return MsgRegisterAccount.unpackAny(proto);
      case '/intertx.MsgSubmitTx':
        return MsgSubmitTx.unpackAny(proto);

      // move
      case '/initia.move.v1.MsgPublish':
        return MsgPublish.unpackAny(proto);
      case '/initia.move.v1.MsgExecute':
        return MsgExecute.unpackAny(proto);
      case '/initia.move.v1.MsgScript':
        return MsgScript.unpackAny(proto);
      case '/initia.move.v1.MsgUpdateParams':
        return MsgUpdateMoveParams.unpackAny(proto);
      case '/initia.move.v1.MsgWhitelist':
        return MsgWhitelist.unpackAny(proto);
      case '/initia.move.v1.MsgDelist':
        return MsgDelist.unpackAny(proto);

      // mstaking
      case '/initia.mstaking.v1.MsgDelegate':
        return MsgDelegate.unpackAny(proto);
      case '/initia.mstaking.v1.MsgUndelegate':
        return MsgUndelegate.unpackAny(proto);
      case '/initia.mstaking.v1.MsgBeginRedelegate':
        return MsgBeginRedelegate.unpackAny(proto);
      case '/initia.mstaking.v1.MsgCreateValidator':
        return MsgCreateValidator.unpackAny(proto);
      case '/initia.mstaking.v1.MsgEditValidator':
        return MsgEditValidator.unpackAny(proto);
      case '/initia.mstaking.v1.MsgUpdateParams':
        return MsgUpdateMstakingParams.unpackAny(proto);

      // reward
      case '/initia.reward.v1.MsgUpdateParams':
        return MsgUpdateRewardParams.unpackAny(proto);

      // slashing
      case '/cosmos.slashing.v1beta1.MsgUnjail':
        return MsgUnjail.unpackAny(proto);
      case '/cosmos.slashing.v1beta1.MsgUpdateParams':
        return MsgUpdateSlashingParams.unpackAny(proto);

      // upgrade
      case '/cosmos.upgrade.v1beta1.MsgSoftwareUpgrade':
        return MsgSoftwareUpgrade.unpackAny(proto);
      case '/cosmos.upgrade.v1beta1.MsgCancelUpgrade':
        return MsgCancelUpgrade.unpackAny(proto);

      default:
        throw Error(`not supported msg ${proto.typeUrl}`);
    }
  }
}
