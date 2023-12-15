import { AuctionMsg, MsgAuctionBid, MsgUpdateAuctionParams } from './auction';
import { AuthMsg, MsgUpdateAuthParams } from './auth';
import {
  AuthzMsg,
  MsgGrantAuthorization,
  MsgRevokeAuthorization,
  MsgExecAuthorized,
} from './authz';
import {
  BankMsg,
  MsgMultiSend,
  MsgSend,
  MsgUpdateBankParams,
  MsgSetSendEnabled,
} from './bank';
import { CrisisMsg, MsgVerifyInvariant, MsgUpdateCrisisParams } from './crisis';
import {
  DistributionMsg,
  MsgSetWithdrawAddress,
  MsgWithdrawDelegatorReward,
  MsgWithdrawValidatorCommission,
  MsgFundCommunityPool,
  MsgUpdateDistrParams,
  MsgCommunityPoolSpend,
} from './distribution';
import { EvidenceMsg, MsgSubmitEvidence } from './evidence';
import { FeeGrantMsg, MsgGrantAllowance, MsgRevokeAllowance } from './feegrant';
import {
  GovMsg,
  MsgDepositLegacy,
  MsgDeposit,
  MsgSubmitProposalLegacy,
  MsgSubmitProposal,
  MsgVoteLegacy,
  MsgVote,
  MsgVoteWeightedLegacy,
  MsgVoteWeighted,
  MsgUpdateGovParams,
} from './gov';
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
} from './group';
import { IbcTransferMsg, MsgTransfer } from './ibc/applications/transfer';
import {
  IbcFeeMsg,
  MsgPayPacketFee,
  MsgPayPacketFeeAsync,
  MsgRegisterCounterpartyPayee,
  MsgRegisterPayee,
} from './ibc/applications/fee';
import {
  IbcNftMsg,
  MsgNftTransfer,
  MsgUpdateIbcNftParams,
} from './ibc/applications/nft-transfer';
import { IbcPermMsg, MsgUpdateChannelRelayer } from './ibc/applications/perm';
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
import { InterTxMsg, MsgRegisterAccount, MsgSubmitTx } from './intertx';
import {
  MoveMsg,
  MsgPublish,
  MsgExecute,
  MsgScript,
  MsgUpdateMoveParams,
  MsgWhitelist,
  MsgDelist,
  MsgGovExecute,
  MsgGovPublish,
  MsgGovScript,
} from './move';
import {
  MstakingMsg,
  MsgBeginRedelegate,
  MsgCreateValidator,
  MsgDelegate,
  MsgEditValidator,
  MsgUndelegate,
  MsgUpdateMstakingParams,
} from './mstaking';
import {
  OpchildMsg,
  MsgAddValidator,
  MsgRemoveValidator,
  MsgFinalizeTokenDeposit,
  MsgInitiateTokenWithdrawal,
  MsgExecuteLegacyContents,
  MsgExecuteMessages,
  MsgSpendFeePool,
  MsgUpdateOpchildParams,
} from './opchild';
import {
  OphostMsg,
  MsgRecordBatch,
  MsgCreateBridge,
  MsgProposeOutput,
  MsgDeleteOutput,
  MsgInitiateTokenDeposit,
  MsgFinalizeTokenWithdrawal,
  MsgUpdateProposer,
  MsgUpdateChallenger,
  MsgUpdateOphostParams,
} from './ophost';
import { RewardMsg, MsgUpdateRewardParams } from './reward';
import { SlashingMsg, MsgUnjail, MsgUpdateSlashingParams } from './slashing';
import { UpgradeMsg, MsgSoftwareUpgrade, MsgCancelUpgrade } from './upgrade';
import {
  WasmMsg,
  MsgStoreCode,
  MsgInstantiateContract,
  MsgInstantiateContractV2,
  MsgExecuteContract,
  MsgMigrateContract,
  MsgUpdateAdmin,
  MsgClearAdmin,
  MsgUpdateInstantiateConfig,
  MsgUpdateWasmParams,
  MsgSudoContract,
  MsgPinCodes,
  MsgUnpinCodes,
  MsgStoreAndInstantiateContract,
  MsgStoreAndMigrateContract,
  MsgAddCodeUploadParamsAddresses,
  MsgRemoveCodeUploadParamsAddresses,
  MsgUpdateContractLabel,
} from './wasm';
import { Any } from '@initia/initia.proto/google/protobuf/any';

export type Msg =
  | AuctionMsg
  | AuthMsg
  | AuthzMsg
  | BankMsg
  | CrisisMsg
  | DistributionMsg
  | EvidenceMsg
  | FeeGrantMsg
  | GovMsg
  | GroupMsg
  | IbcFeeMsg
  | IbcTransferMsg
  | IbcNftMsg
  | IbcPermMsg
  | IbcClientMsg
  | IbcConnectionMsg
  | IbcChannelMsg
  | InterTxMsg
  | MoveMsg
  | MstakingMsg
  | OpchildMsg
  | OphostMsg
  | RewardMsg
  | SlashingMsg
  | UpgradeMsg
  | WasmMsg;

export namespace Msg {
  export type Amino =
    | AuctionMsg.Amino
    | AuthMsg.Amino
    | AuthzMsg.Amino
    | BankMsg.Amino
    | CrisisMsg.Amino
    | DistributionMsg.Amino
    | EvidenceMsg.Amino
    | FeeGrantMsg.Amino
    | GovMsg.Amino
    | GroupMsg.Amino
    | IbcTransferMsg.Amino
    | IbcNftMsg.Amino
    | IbcPermMsg.Amino
    | InterTxMsg.Amino
    | MoveMsg.Amino
    | MstakingMsg.Amino
    | OpchildMsg.Amino
    | OphostMsg.Amino
    | RewardMsg.Amino
    | SlashingMsg.Amino
    | UpgradeMsg.Amino
    | WasmMsg.Amino;

  export type Data =
    | AuctionMsg.Data
    | AuthMsg.Data
    | AuthzMsg.Data
    | BankMsg.Data
    | CrisisMsg.Data
    | DistributionMsg.Data
    | EvidenceMsg.Data
    | FeeGrantMsg.Data
    | GovMsg.Data
    | GroupMsg.Data
    | IbcFeeMsg.Data
    | IbcTransferMsg.Data
    | IbcNftMsg.Data
    | IbcPermMsg.Data
    | IbcClientMsg.Data
    | IbcConnectionMsg.Data
    | IbcChannelMsg.Data
    | InterTxMsg.Data
    | MoveMsg.Data
    | MstakingMsg.Data
    | OpchildMsg.Data
    | OphostMsg.Data
    | RewardMsg.Data
    | SlashingMsg.Data
    | UpgradeMsg.Data
    | WasmMsg.Data;

  export type Proto =
    | AuctionMsg.Proto
    | AuthMsg.Proto
    | AuthzMsg.Proto
    | BankMsg.Proto
    | CrisisMsg.Proto
    | DistributionMsg.Proto
    | EvidenceMsg.Proto
    | FeeGrantMsg.Proto
    | GovMsg.Proto
    | GroupMsg.Proto
    | IbcFeeMsg.Proto
    | IbcTransferMsg.Proto
    | IbcNftMsg.Proto
    | IbcPermMsg.Proto
    | IbcClientMsg.Proto
    | IbcConnectionMsg.Proto
    | IbcChannelMsg.Proto
    | InterTxMsg.Proto
    | MoveMsg.Proto
    | MstakingMsg.Proto
    | OpchildMsg.Proto
    | OphostMsg.Proto
    | RewardMsg.Proto
    | SlashingMsg.Proto
    | UpgradeMsg.Proto
    | WasmMsg.Proto;

  export function fromAmino(data: Msg.Amino): Msg {
    switch (data.type) {
      // auction
      case 'block-sdk/x/auction/MsgAuctionBid':
        return MsgAuctionBid.fromAmino(data);
      case 'block-sdk/x/auction/MsgUpdateParams':
        return MsgUpdateAuctionParams.fromAmino(data);

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

      // evidence
      case 'cosmos-sdk/MsgSubmitEvidence':
        return MsgSubmitEvidence.fromAmino(data);

      // feegrant
      case 'cosmos-sdk/MsgGrantAllowance':
        return MsgGrantAllowance.fromAmino(data);
      case 'cosmos-sdk/MsgRevokeAllowance':
        return MsgRevokeAllowance.fromAmino(data);

      // gov
      case 'cosmos-sdk/MsgDeposit':
        return MsgDepositLegacy.fromAmino(data);
      case 'cosmos-sdk/v1/MsgDeposit':
        return MsgDeposit.fromAmino(data);
      case 'cosmos-sdk/MsgSubmitProposal':
        return MsgSubmitProposalLegacy.fromAmino(data);
      case 'cosmos-sdk/v1/MsgSubmitProposal':
        return MsgSubmitProposal.fromAmino(data);
      case 'cosmos-sdk/MsgVote':
        return MsgVoteLegacy.fromAmino(data);
      case 'cosmos-sdk/v1/MsgVote':
        return MsgVote.fromAmino(data);
      case 'cosmos-sdk/MsgVoteWeighted':
        return MsgVoteWeightedLegacy.fromAmino(data);
      case 'cosmos-sdk/v1/MsgVoteWeighted':
        return MsgVoteWeighted.fromAmino(data);
      case 'gov/MsgUpdateParams':
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
      case 'nft-transfer/MsgTransfer':
        return MsgNftTransfer.fromAmino(data);
      case 'nft-transfer/MsgUpdateParams':
        return MsgUpdateIbcNftParams.fromAmino(data);

      // ibc-perm
      case 'perm/MsgUpdateChannelRelayer':
        return MsgUpdateChannelRelayer.fromAmino(data);

      // intertx
      case 'intertx/MsgRegisterAccount':
        return MsgRegisterAccount.fromAmino(data);
      case 'intertx/MsgSubmitTx':
        return MsgSubmitTx.fromAmino(data);

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
      case 'move/MsgGovExecute':
        return MsgGovExecute.fromAmino(data);
      case 'move/MsgGovPublish':
        return MsgGovPublish.fromAmino(data);
      case 'move/MsgGovScript':
        return MsgGovScript.fromAmino(data);

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

      // opchild
      case 'opchild/MsgAddValidator':
        return MsgAddValidator.fromAmino(data);
      case 'opchild/MsgRemoveValidator':
        return MsgRemoveValidator.fromAmino(data);
      case 'opchild/MsgFinalizeTokenDeposit':
        return MsgFinalizeTokenDeposit.fromAmino(data);
      case 'opchild/MsgInitiateTokenWithdrawal':
        return MsgInitiateTokenWithdrawal.fromAmino(data);
      case 'opchild/MsgExecuteLegacyContents':
        return MsgExecuteLegacyContents.fromAmino(data);
      case 'opchild/MsgExecuteMessages':
        return MsgExecuteMessages.fromAmino(data);
      case 'opchild/MsgSpendFeePool':
        return MsgSpendFeePool.fromAmino(data);
      case 'opchild/MsgUpdateParams':
        return MsgUpdateOpchildParams.fromAmino(data);

      // ophost
      case 'ophost/MsgRecordBatch':
        return MsgRecordBatch.fromAmino(data);
      case 'ophost/MsgCreateBridge':
        return MsgCreateBridge.fromAmino(data);
      case 'ophost/MsgProposeOutput':
        return MsgProposeOutput.fromAmino(data);
      case 'ophost/MsgDeleteOutput':
        return MsgDeleteOutput.fromAmino(data);
      case 'ophost/MsgInitiateTokenDeposit':
        return MsgInitiateTokenDeposit.fromAmino(data);
      case 'ophost/MsgFinalizeTokenWithdrawal':
        return MsgFinalizeTokenWithdrawal.fromAmino(data);
      case 'ophost/MsgUpdateProposer':
        return MsgUpdateProposer.fromAmino(data);
      case 'ophost/MsgUpdateChallenger':
        return MsgUpdateChallenger.fromAmino(data);
      case 'ophost/MsgUpdateParams':
        return MsgUpdateOphostParams.fromAmino(data);

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

      // wasm
      case 'wasm/MsgStoreCode':
        return MsgStoreCode.fromAmino(data);
      case 'wasm/MsgInstantiateContract':
        return MsgInstantiateContract.fromAmino(data);
      case 'wasm/MsgInstantiateContract2':
        return MsgInstantiateContractV2.fromAmino(data);
      case 'wasm/MsgExecuteContract':
        return MsgExecuteContract.fromAmino(data);
      case 'wasm/MsgMigrateContract':
        return MsgMigrateContract.fromAmino(data);
      case 'wasm/MsgUpdateAdmin':
        return MsgUpdateAdmin.fromAmino(data);
      case 'wasm/MsgClearAdmin':
        return MsgClearAdmin.fromAmino(data);
      case 'wasm/MsgUpdateInstantiateConfig':
        return MsgUpdateInstantiateConfig.fromAmino(data);
      case 'wasm/MsgUpdateParams':
        return MsgUpdateWasmParams.fromAmino(data);
      case 'wasm/MsgSudoContract':
        return MsgSudoContract.fromAmino(data);
      case 'wasm/MsgPinCodes':
        return MsgPinCodes.fromAmino(data);
      case 'wasm/MsgUnpinCodes':
        return MsgUnpinCodes.fromAmino(data);
      case 'wasm/MsgStoreAndInstantiateContract':
        return MsgStoreAndInstantiateContract.fromAmino(data);
      case 'wasm/MsgStoreAndMigrateContract':
        return MsgStoreAndMigrateContract.fromAmino(data);
      case 'wasm/MsgAddCodeUploadParamsAddresses':
        return MsgAddCodeUploadParamsAddresses.fromAmino(data);
      case 'wasm/MsgRemoveCodeUploadParamsAddresses':
        return MsgRemoveCodeUploadParamsAddresses.fromAmino(data);
      case 'wasm/MsgUpdateContractLabel':
        return MsgUpdateContractLabel.fromAmino(data);
    }
  }

  export function fromData(data: Msg.Data): Msg {
    switch (data['@type']) {
      // auction
      case '/sdk.auction.v1.MsgAuctionBid':
        return MsgAuctionBid.fromData(data);
      case '/sdk.auction.v1.MsgUpdateParams':
        return MsgUpdateAuctionParams.fromData(data);

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

      // evidence
      case '/cosmos.evidence.v1beta1.MsgSubmitEvidence':
        return MsgSubmitEvidence.fromData(data);

      // feegrant
      case '/cosmos.feegrant.v1beta1.MsgGrantAllowance':
        return MsgGrantAllowance.fromData(data);
      case '/cosmos.feegrant.v1beta1.MsgRevokeAllowance':
        return MsgRevokeAllowance.fromData(data);

      // gov
      case '/cosmos.gov.v1beta1.MsgDeposit':
        return MsgDepositLegacy.fromData(data);
      case '/cosmos.gov.v1.MsgDeposit':
        return MsgDeposit.fromData(data);
      case '/cosmos.gov.v1beta1.MsgSubmitProposal':
        return MsgSubmitProposalLegacy.fromData(data);
      case '/cosmos.gov.v1.MsgSubmitProposal':
        return MsgSubmitProposal.fromData(data);
      case '/cosmos.gov.v1beta1.MsgVote':
        return MsgVoteLegacy.fromData(data);
      case '/cosmos.gov.v1.MsgVote':
        return MsgVote.fromData(data);
      case '/cosmos.gov.v1beta1.MsgVoteWeighted':
        return MsgVoteWeightedLegacy.fromData(data);
      case '/cosmos.gov.v1.MsgVoteWeighted':
        return MsgVoteWeighted.fromData(data);
      case '/initia.gov.v1.MsgUpdateParams':
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
      case '/ibc.applications.nft_transfer.v1.MsgTransfer':
        return MsgNftTransfer.fromData(data);
      case '/ibc.applications.nft_transfer.v1.MsgUpdateParams':
        return MsgUpdateIbcNftParams.fromData(data);

      // ibc-perm
      case '/ibc.applications.perm.v1.MsgUpdateChannelRelayer':
        return MsgUpdateChannelRelayer.fromData(data);

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
      case '/initia.intertx.v1.MsgRegisterAccount':
        return MsgRegisterAccount.fromData(data);
      case '/initia.intertx.v1.MsgSubmitTx':
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
      case '/initia.move.v1.MsgGovExecute':
        return MsgGovExecute.fromData(data);
      case '/initia.move.v1.MsgGovPublish':
        return MsgGovPublish.fromData(data);
      case '/initia.move.v1.MsgGovScript':
        return MsgGovScript.fromData(data);

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

      // opchild
      case '/opinit.opchild.v1.MsgAddValidator':
        return MsgAddValidator.fromData(data);
      case '/opinit.opchild.v1.MsgRemoveValidator':
        return MsgRemoveValidator.fromData(data);
      case '/opinit.opchild.v1.MsgFinalizeTokenDeposit':
        return MsgFinalizeTokenDeposit.fromData(data);
      case '/opinit.opchild.v1.MsgInitiateTokenWithdrawal':
        return MsgInitiateTokenWithdrawal.fromData(data);
      case '/opinit.opchild.v1.MsgExecuteLegacyContents':
        return MsgExecuteLegacyContents.fromData(data);
      case '/opinit.opchild.v1.MsgExecuteMessages':
        return MsgExecuteMessages.fromData(data);
      case '/opinit.opchild.v1.MsgSpendFeePool':
        return MsgSpendFeePool.fromData(data);
      case '/opinit.opchild.v1.MsgUpdateParams':
        return MsgUpdateOpchildParams.fromData(data);

      // ophost
      case '/opinit.ophost.v1.MsgRecordBatch':
        return MsgRecordBatch.fromData(data);
      case '/opinit.ophost.v1.MsgCreateBridge':
        return MsgCreateBridge.fromData(data);
      case '/opinit.ophost.v1.MsgProposeOutput':
        return MsgProposeOutput.fromData(data);
      case '/opinit.ophost.v1.MsgDeleteOutput':
        return MsgDeleteOutput.fromData(data);
      case '/opinit.ophost.v1.MsgInitiateTokenDeposit':
        return MsgInitiateTokenDeposit.fromData(data);
      case '/opinit.ophost.v1.MsgFinalizeTokenWithdrawal':
        return MsgFinalizeTokenWithdrawal.fromData(data);
      case '/opinit.ophost.v1.MsgUpdateProposer':
        return MsgUpdateProposer.fromData(data);
      case '/opinit.ophost.v1.MsgUpdateChallenger':
        return MsgUpdateChallenger.fromData(data);
      case '/opinit.ophost.v1.MsgUpdateParams':
        return MsgUpdateOphostParams.fromData(data);

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

      // wasm
      case '/cosmwasm.wasm.v1.MsgStoreCode':
        return MsgStoreCode.fromData(data);
      case '/cosmwasm.wasm.v1.MsgInstantiateContract':
        return MsgInstantiateContract.fromData(data);
      case '/cosmwasm.wasm.v1.MsgInstantiateContract2':
        return MsgInstantiateContractV2.fromData(data);
      case '/cosmwasm.wasm.v1.MsgExecuteContract':
        return MsgExecuteContract.fromData(data);
      case '/cosmwasm.wasm.v1.MsgMigrateContract':
        return MsgMigrateContract.fromData(data);
      case '/cosmwasm.wasm.v1.MsgUpdateAdmin':
        return MsgUpdateAdmin.fromData(data);
      case '/cosmwasm.wasm.v1.MsgClearAdmin':
        return MsgClearAdmin.fromData(data);
      case '/cosmwasm.wasm.v1.MsgUpdateInstantiateConfig':
        return MsgUpdateInstantiateConfig.fromData(data);
      case '/cosmwasm.wasm.v1.MsgUpdateParams':
        return MsgUpdateWasmParams.fromData(data);
      case '/cosmwasm.wasm.v1.MsgSudoContract':
        return MsgSudoContract.fromData(data);
      case '/cosmwasm.wasm.v1.MsgPinCodes':
        return MsgPinCodes.fromData(data);
      case '/cosmwasm.wasm.v1.MsgUnpinCodes':
        return MsgUnpinCodes.fromData(data);
      case '/cosmwasm.wasm.v1.MsgStoreAndInstantiateContract':
        return MsgStoreAndInstantiateContract.fromData(data);
      case '/cosmwasm.wasm.v1.MsgStoreAndMigrateContract':
        return MsgStoreAndMigrateContract.fromData(data);
      case '/cosmwasm.wasm.v1.MsgAddCodeUploadParamsAddresses':
        return MsgAddCodeUploadParamsAddresses.fromData(data);
      case '/cosmwasm.wasm.v1.MsgRemoveCodeUploadParamsAddresses':
        return MsgRemoveCodeUploadParamsAddresses.fromData(data);
      case '/cosmwasm.wasm.v1.MsgUpdateContractLabel':
        return MsgUpdateContractLabel.fromData(data);

      default:
        throw Error(`not supported msg ${data['@type']}`);
    }
  }

  export function fromProto(proto: Any): Msg {
    switch (proto.typeUrl) {
      // auction
      case '/sdk.auction.v1.MsgAuctionBid':
        return MsgAuctionBid.unpackAny(proto);
      case '/sdk.auction.v1.MsgUpdateParams':
        return MsgUpdateAuctionParams.unpackAny(proto);

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

      // evidence
      case '/cosmos.evidence.v1beta1.MsgSubmitEvidence':
        return MsgSubmitEvidence.unpackAny(proto);

      // feegrant
      case '/cosmos.feegrant.v1beta1.MsgGrantAllowance':
        return MsgGrantAllowance.unpackAny(proto);
      case '/cosmos.feegrant.v1beta1.MsgRevokeAllowance':
        return MsgRevokeAllowance.unpackAny(proto);

      // gov
      case '/cosmos.gov.v1beta1.MsgDeposit':
        return MsgDepositLegacy.unpackAny(proto);
      case '/cosmos.gov.v1.MsgDeposit':
        return MsgDeposit.unpackAny(proto);
      case '/cosmos.gov.v1beta1.MsgSubmitProposal':
        return MsgSubmitProposalLegacy.unpackAny(proto);
      case '/cosmos.gov.v1.MsgSubmitProposal':
        return MsgSubmitProposal.unpackAny(proto);
      case '/cosmos.gov.v1beta1.MsgVote':
        return MsgVoteLegacy.unpackAny(proto);
      case '/cosmos.gov.v1.MsgVote':
        return MsgVote.unpackAny(proto);
      case '/cosmos.gov.v1beta1.MsgVoteWeighted':
        return MsgVoteWeightedLegacy.unpackAny(proto);
      case '/cosmos.gov.v1.MsgVoteWeighted':
        return MsgVoteWeighted.unpackAny(proto);
      case '/initia.gov.v1.MsgUpdateParams':
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
      case '/ibc.applications.nft_transfer.v1.MsgTransfer':
        return MsgNftTransfer.unpackAny(proto);
      case '/ibc.applications.nft_transfer.v1.MsgUpdateParams':
        return MsgUpdateIbcNftParams.unpackAny(proto);

      // ibc-perm
      case '/ibc.applications.perm.v1.MsgUpdateChannelRelayer':
        return MsgUpdateChannelRelayer.unpackAny(proto);

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
      case '/initia.intertx.v1.MsgRegisterAccount':
        return MsgRegisterAccount.unpackAny(proto);
      case '/initia.intertx.v1.MsgSubmitTx':
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
      case '/initia.move.v1.MsgGovExecute':
        return MsgGovExecute.unpackAny(proto);
      case '/initia.move.v1.MsgGovPublish':
        return MsgGovPublish.unpackAny(proto);
      case '/initia.move.v1.MsgGovScript':
        return MsgGovScript.unpackAny(proto);

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

      // opchild
      case '/opinit.opchild.v1.MsgAddValidator':
        return MsgAddValidator.unpackAny(proto);
      case '/opinit.opchild.v1.MsgRemoveValidator':
        return MsgRemoveValidator.unpackAny(proto);
      case '/opinit.opchild.v1.MsgFinalizeTokenDeposit':
        return MsgFinalizeTokenDeposit.unpackAny(proto);
      case '/opinit.opchild.v1.MsgInitiateTokenWithdrawal':
        return MsgInitiateTokenWithdrawal.unpackAny(proto);
      case '/opinit.opchild.v1.MsgExecuteLegacyContents':
        return MsgExecuteLegacyContents.unpackAny(proto);
      case '/opinit.opchild.v1.MsgExecuteMessages':
        return MsgExecuteMessages.unpackAny(proto);
      case '/opinit.opchild.v1.MsgSpendFeePool':
        return MsgSpendFeePool.unpackAny(proto);
      case '/opinit.opchild.v1.MsgUpdateParams':
        return MsgUpdateOpchildParams.unpackAny(proto);

      // ophost
      case '/opinit.ophost.v1.MsgRecordBatch':
        return MsgRecordBatch.unpackAny(proto);
      case '/opinit.ophost.v1.MsgCreateBridge':
        return MsgCreateBridge.unpackAny(proto);
      case '/opinit.ophost.v1.MsgProposeOutput':
        return MsgProposeOutput.unpackAny(proto);
      case '/opinit.ophost.v1.MsgDeleteOutput':
        return MsgDeleteOutput.unpackAny(proto);
      case '/opinit.ophost.v1.MsgInitiateTokenDeposit':
        return MsgInitiateTokenDeposit.unpackAny(proto);
      case '/opinit.ophost.v1.MsgFinalizeTokenWithdrawal':
        return MsgFinalizeTokenWithdrawal.unpackAny(proto);
      case '/opinit.ophost.v1.MsgUpdateProposer':
        return MsgUpdateProposer.unpackAny(proto);
      case '/opinit.ophost.v1.MsgUpdateChallenger':
        return MsgUpdateChallenger.unpackAny(proto);
      case '/opinit.ophost.v1.MsgUpdateParams':
        return MsgUpdateOphostParams.unpackAny(proto);

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

      // wasm
      case '/cosmwasm.wasm.v1.MsgStoreCode':
        return MsgStoreCode.unpackAny(proto);
      case '/cosmwasm.wasm.v1.MsgInstantiateContract':
        return MsgInstantiateContract.unpackAny(proto);
      case '/cosmwasm.wasm.v1.MsgInstantiateContract2':
        return MsgInstantiateContractV2.unpackAny(proto);
      case '/cosmwasm.wasm.v1.MsgExecuteContract':
        return MsgExecuteContract.unpackAny(proto);
      case '/cosmwasm.wasm.v1.MsgMigrateContract':
        return MsgMigrateContract.unpackAny(proto);
      case '/cosmwasm.wasm.v1.MsgUpdateAdmin':
        return MsgUpdateAdmin.unpackAny(proto);
      case '/cosmwasm.wasm.v1.MsgClearAdmin':
        return MsgClearAdmin.unpackAny(proto);
      case '/cosmwasm.wasm.v1.MsgUpdateInstantiateConfig':
        return MsgUpdateInstantiateConfig.unpackAny(proto);
      case '/cosmwasm.wasm.v1.MsgUpdateParams':
        return MsgUpdateWasmParams.unpackAny(proto);
      case '/cosmwasm.wasm.v1.MsgSudoContract':
        return MsgSudoContract.unpackAny(proto);
      case '/cosmwasm.wasm.v1.MsgPinCodes':
        return MsgPinCodes.unpackAny(proto);
      case '/cosmwasm.wasm.v1.MsgUnpinCodes':
        return MsgUnpinCodes.unpackAny(proto);
      case '/cosmwasm.wasm.v1.MsgStoreAndInstantiateContract':
        return MsgStoreAndInstantiateContract.unpackAny(proto);
      case '/cosmwasm.wasm.v1.MsgStoreAndMigrateContract':
        return MsgStoreAndMigrateContract.unpackAny(proto);
      case '/cosmwasm.wasm.v1.MsgAddCodeUploadParamsAddresses':
        return MsgAddCodeUploadParamsAddresses.unpackAny(proto);
      case '/cosmwasm.wasm.v1.MsgRemoveCodeUploadParamsAddresses':
        return MsgRemoveCodeUploadParamsAddresses.unpackAny(proto);
      case '/cosmwasm.wasm.v1.MsgUpdateContractLabel':
        return MsgUpdateContractLabel.unpackAny(proto);

      default:
        throw Error(`not supported msg ${proto.typeUrl}`);
    }
  }
}
