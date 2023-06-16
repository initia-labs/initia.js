import { AuthMsg, MsgUpdateAuthParams } from './auth/msgs';
import {
  BankMsg,
  MsgMultiSend,
  MsgSend,
  MsgUpdateBankParams,
} from './bank/msgs';
import {
  DistributionMsg,
  MsgSetWithdrawAddress,
  MsgWithdrawDelegatorReward,
  MsgWithdrawValidatorCommission,
  MsgFundCommunityPool,
  MsgUpdateDistrParams,
} from './distribution/msgs';
import {
  MsgGrantAllowance,
  MsgRevokeAllowance,
  FeeGrantMsg,
} from './feegrant/msgs';
import {
  GovMsg,
  MsgDeposit,
  MsgSubmitProposal,
  MsgVote,
  MsgVoteWeighted,
} from './gov/msgs';
import {
  MsgGrantAuthorization,
  MsgRevokeAuthorization,
  MsgExecAuthorized,
  MsgAuthMsg,
} from './authz/msgs';
import { MsgUnjail, SlashingMsg } from './slashing/msgs';
import {
  MsgBeginRedelegate,
  MsgCreateValidator,
  MsgDelegate,
  MsgEditValidator,
  MsgUndelegate,
  MstakingMsg,
} from './mstaking/msgs';
import { MsgCreateVestingAccount, VestingMsg } from './vesting/msgs';
import { MsgPublish, MsgExecute, MsgScript, MoveMsg } from './move/msgs';
import { MsgTransfer, IbcTransferMsg } from './ibc/applications/transfer';
import {
  MsgPayPacketFee,
  MsgPayPacketFeeAsync,
  MsgRegisterCounterpartyPayee,
  MsgRegisterPayee,
  IbcFeeMsg,
} from './ibc/applications/fee/msgs';
import { MsgNftTransfer, IbcNftMsg } from './ibc/applications/nft-transfer';
import { MsgSftTransfer, IbcSftMsg } from './ibc/applications/sft-transfer';
import {
  MsgCreateClient,
  MsgUpdateClient,
  MsgUpgradeClient,
  MsgSubmitMisbehaviour,
  IbcClientMsg,
} from './ibc/msgs/client';
import {
  MsgConnectionOpenInit,
  MsgConnectionOpenTry,
  MsgConnectionOpenConfirm,
  MsgConnectionOpenAck,
  IbcConnectionMsg,
} from './ibc/msgs/connection';
import {
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
  IbcChannelMsg,
} from './ibc/msgs/channel';
import {
  MsgVerifyInvariant,
  MsgUpdateCrisisParams,
  CrisisMsg,
} from './crisis/msgs';
import { MsgRegisterAccount, MsgSubmitTx, InterTxMsg } from './intertx/msgs';
import { Any } from '@initia/initia.proto/google/protobuf/any';

export type Msg =
  | AuthMsg
  | BankMsg
  | DistributionMsg
  | FeeGrantMsg
  | GovMsg
  | MsgAuthMsg
  | SlashingMsg
  | MstakingMsg
  | VestingMsg
  | MoveMsg
  | IbcFeeMsg
  | IbcTransferMsg
  | IbcNftMsg
  | IbcSftMsg
  | IbcClientMsg
  | IbcConnectionMsg
  | IbcChannelMsg
  | CrisisMsg
  | InterTxMsg;

export namespace Msg {
  export type Amino =
    | AuthMsg.Amino
    | BankMsg.Amino
    | DistributionMsg.Amino
    | FeeGrantMsg.Amino
    | GovMsg.Amino
    | MsgAuthMsg.Amino
    | SlashingMsg.Amino
    | MstakingMsg.Amino
    | VestingMsg.Amino
    | MoveMsg.Amino
    | IbcTransferMsg.Amino
    | IbcNftMsg.Amino
    | IbcSftMsg.Amino
    | CrisisMsg.Amino;

  export type Data =
    | AuthMsg.Data
    | BankMsg.Data
    | DistributionMsg.Data
    | FeeGrantMsg.Data
    | GovMsg.Data
    | MsgAuthMsg.Data
    | SlashingMsg.Data
    | MstakingMsg.Data
    | VestingMsg.Data
    | MoveMsg.Data
    | IbcFeeMsg.Data
    | IbcTransferMsg.Data
    | IbcNftMsg.Data
    | IbcSftMsg.Data
    | IbcClientMsg.Data
    | IbcConnectionMsg.Data
    | IbcChannelMsg.Data
    | CrisisMsg.Data
    | InterTxMsg.Data;

  export type Proto =
    | AuthMsg.Proto
    | BankMsg.Proto
    | DistributionMsg.Proto
    | FeeGrantMsg.Proto
    | GovMsg.Proto
    | MsgAuthMsg.Proto
    | SlashingMsg.Proto
    | MstakingMsg.Proto
    | VestingMsg.Proto
    | MoveMsg.Proto
    | IbcFeeMsg.Proto
    | IbcTransferMsg.Proto
    | IbcNftMsg.Proto
    | IbcSftMsg.Proto
    | IbcClientMsg.Proto
    | IbcConnectionMsg.Proto
    | IbcChannelMsg.Proto
    | CrisisMsg.Proto
    | InterTxMsg.Proto;

  export function fromAmino(data: Msg.Amino): Msg {
    switch (data.type) {
      // auth
      case 'cosmos-sdk/x/auth/MsgUpdateParams':
        return MsgUpdateAuthParams.fromAmino(data);

      // bank
      case 'cosmos-sdk/MsgSend':
        return MsgSend.fromAmino(data);
      case 'cosmos-sdk/MsgMultiSend':
        return MsgMultiSend.fromAmino(data);
      case 'cosmos-sdk/x/bank/MsgUpdateParams':
        return MsgUpdateBankParams.fromAmino(data);

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

      // feegrant
      case 'cosmos-sdk/MsgGrantAllowance':
        return MsgGrantAllowance.fromAmino(data);
      case 'cosmos-sdk/MsgRevokeAllowance':
        return MsgRevokeAllowance.fromAmino(data);

      // gov
      case 'cosmos-sdk/MsgDeposit':
        return MsgDeposit.fromAmino(data);
      case 'cosmos-sdk/MsgSubmitProposal':
        return MsgSubmitProposal.fromAmino(data);
      case 'cosmos-sdk/MsgVote':
        return MsgVote.fromAmino(data);
      case 'cosmos-sdk/MsgVoteWeighted':
        return MsgVoteWeighted.fromAmino(data);

      // msgauth
      case 'cosmos-sdk/MsgGrant':
        return MsgGrantAuthorization.fromAmino(data);
      case 'cosmos-sdk/MsgRevoke':
        return MsgRevokeAuthorization.fromAmino(data);
      case 'cosmos-sdk/MsgExec':
        return MsgExecAuthorized.fromAmino(data);

      // slashing
      case 'cosmos-sdk/MsgUnjail':
        return MsgUnjail.fromAmino(data);

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

      // vesting
      case 'cosmos-sdk/MsgCreateVestingAccount':
        return MsgCreateVestingAccount.fromAmino(data);

      // move
      case 'move/MsgPublish':
        return MsgPublish.fromAmino(data);
      case 'move/MsgExecute':
        return MsgExecute.fromAmino(data);
      case 'move/MsgScript':
        return MsgScript.fromAmino(data);

      // ibc-transfer
      case 'cosmos-sdk/MsgTransfer':
        return MsgTransfer.fromAmino(data);

      // ibc-nft-transfer
      case 'ibc/MsgNftTransfer':
        return MsgNftTransfer.fromAmino(data);

      // ibc-sft-transfer
      case 'ibc/MsgSftTransfer':
        return MsgSftTransfer.fromAmino(data);

      // crisis
      case 'cosmos-sdk/MsgVerifyInvariant':
        return MsgVerifyInvariant.fromAmino(data);
      case 'cosmos-sdk/x/crisis/MsgUpdateParams':
        return MsgUpdateCrisisParams.fromAmino(data);
    }
  }

  export function fromData(data: Msg.Data): Msg {
    switch (data['@type']) {
      //auth
      case '/cosmos.auth.v1beta1.MsgUpdateParams':
        return MsgUpdateAuthParams.fromData(data);

      // bank
      case '/cosmos.bank.v1beta1.MsgSend':
        return MsgSend.fromData(data);
      case '/cosmos.bank.v1beta1.MsgMultiSend':
        return MsgMultiSend.fromData(data);
      case '/cosmos.bank.v1beta1.MsgUpdateParams':
        return MsgUpdateBankParams.fromData(data);

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

      // feegrant
      case '/cosmos.feegrant.v1beta1.MsgGrantAllowance':
        return MsgGrantAllowance.fromData(data);
      case '/cosmos.feegrant.v1beta1.MsgRevokeAllowance':
        return MsgRevokeAllowance.fromData(data);

      // gov
      case '/cosmos.gov.v1beta1.MsgDeposit':
        return MsgDeposit.fromData(data);
      case '/cosmos.gov.v1beta1.MsgSubmitProposal':
        return MsgSubmitProposal.fromData(data);
      case '/cosmos.gov.v1beta1.MsgVote':
        return MsgVote.fromData(data);
      case '/cosmos.gov.v1beta1.MsgVoteWeighted':
        return MsgVoteWeighted.fromData(data);

      // authz
      case '/cosmos.authz.v1beta1.MsgGrant':
        return MsgGrantAuthorization.fromData(data);
      case '/cosmos.authz.v1beta1.MsgRevoke':
        return MsgRevokeAuthorization.fromData(data);
      case '/cosmos.authz.v1beta1.MsgExec':
        return MsgExecAuthorized.fromData(data);

      // slashing
      case '/cosmos.slashing.v1beta1.MsgUnjail':
        return MsgUnjail.fromData(data);

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

      // vesting
      case '/cosmos.vesting.v1beta1.MsgCreateVestingAccount':
        return MsgCreateVestingAccount.fromData(data);

      // move
      case '/initia.move.v1.MsgPublish':
        return MsgPublish.fromData(data);
      case '/initia.move.v1.MsgExecute':
        return MsgExecute.fromData(data);
      case '/initia.move.v1.MsgScript':
        return MsgScript.fromData(data);

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

      // ibc-sft-transfer
      case '/ibc.applications.sft_transfer.v1.MsgSftTransfer':
        return MsgSftTransfer.fromData(data);

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

      // crisis
      case '/cosmos.crisis.v1beta1.MsgVerifyInvariant':
        return MsgVerifyInvariant.fromData(data);
      case '/cosmos.crisis.v1beta1.MsgUpdateParams':
        return MsgUpdateCrisisParams.fromData(data);

      // intertx
      case '/intertx.MsgRegisterAccount':
        return MsgRegisterAccount.fromData(data);
      case '/intertx.MsgSubmitTx':
        return MsgSubmitTx.fromData(data);

      default:
        throw Error(`not supported msg ${data['@type']}`);
    }
  }

  export function fromProto(proto: Any): Msg {
    switch (proto.typeUrl) {
      // auth
      case '/cosmos.auth.v1beta1.MsgUpdateParams':
        return MsgUpdateAuthParams.unpackAny(proto);

      // bank
      case '/cosmos.bank.v1beta1.MsgSend':
        return MsgSend.unpackAny(proto);
      case '/cosmos.bank.v1beta1.MsgMultiSend':
        return MsgMultiSend.unpackAny(proto);
      case '/cosmos.bank.v1beta1.MsgUpdateParams':
        return MsgUpdateBankParams.unpackAny(proto);

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

      // feegrant
      case '/cosmos.feegrant.v1beta1.MsgGrantAllowance':
        return MsgGrantAllowance.unpackAny(proto);
      case '/cosmos.feegrant.v1beta1.MsgRevokeAllowance':
        return MsgRevokeAllowance.unpackAny(proto);

      // gov
      case '/cosmos.gov.v1beta1.MsgDeposit':
        return MsgDeposit.unpackAny(proto);
      case '/cosmos.gov.v1beta1.MsgSubmitProposal':
        return MsgSubmitProposal.unpackAny(proto);
      case '/cosmos.gov.v1beta1.MsgVote':
        return MsgVote.unpackAny(proto);

      // authz
      case '/cosmos.authz.v1beta1.MsgGrant':
        return MsgGrantAuthorization.unpackAny(proto);
      case '/cosmos.authz.v1beta1.MsgRevoke':
        return MsgRevokeAuthorization.unpackAny(proto);
      case '/cosmos.authz.v1beta1.MsgExec':
        return MsgExecAuthorized.unpackAny(proto);

      // slashing
      case '/cosmos.slashing.v1beta1.MsgUnjail':
        return MsgUnjail.unpackAny(proto);

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

      // vesting
      case '/cosmos.vesting.v1beta1.MsgCreateVestingAccount':
        return MsgCreateVestingAccount.unpackAny(proto);

      // move
      case '/initia.move.v1.MsgPublish':
        return MsgPublish.unpackAny(proto);
      case '/initia.move.v1.MsgExecute':
        return MsgExecute.unpackAny(proto);
      case '/initia.move.v1.MsgScript':
        return MsgScript.unpackAny(proto);

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

      // ibc-sft-transfer
      case '/ibc.applications.sft_transfer.v1.MsgSftTransfer':
        return MsgSftTransfer.unpackAny(proto);

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

      // crisis
      case '/cosmos.crisis.v1beta1.MsgVerifyInvariant':
        return MsgVerifyInvariant.unpackAny(proto);
      case '/cosmos.crisis.v1beta1.MsgUpdateParams':
        return MsgUpdateCrisisParams.unpackAny(proto);

      // intertx
      case '/intertx.MsgRegisterAccount':
        return MsgRegisterAccount.unpackAny(proto);
      case '/intertx.MsgSubmitTx':
        return MsgSubmitTx.unpackAny(proto);

      default:
        throw Error(`not supported msg ${proto.typeUrl}`);
    }
  }
}
