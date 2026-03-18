/**
 * Amino JSON message mismatch detection: v1 (legacy) vs v2.
 *
 * Compares amino type names between the legacy hardcoded registry
 * and v2's runtime proto-option-based amino conversion.
 *
 * Categories:
 *   A. Amino type name comparison (v1 hardcoded vs v2 getAminoType)
 *   B. Field name comparison (v1 explicit vs v2 getAminoFieldName)
 *   C. Coverage gap (v1-only / v2-only messages)
 */

import { describe, it, expect } from 'vitest'
import { getAminoType, getAminoFieldName } from '../../../src/tx/amino'
import type { DescMessage } from '@bufbuild/protobuf'

// ============= BSR Schema Imports =============

// Bank
import {
  MsgSendSchema,
  MsgMultiSendSchema,
  MsgSetSendEnabledSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/bank/v1beta1/tx_pb'
import { MsgUpdateParamsSchema as MsgUpdateBankParamsSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/bank/v1beta1/tx_pb'

// Initia Bank
import { MsgSetDenomMetadataSchema } from '@buf/initia-labs_initia.bufbuild_es/initia/bank/v1/tx_pb'

// Auth
import { MsgUpdateParamsSchema as MsgUpdateAuthParamsSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/auth/v1beta1/tx_pb'

// Authz
import {
  MsgGrantSchema,
  MsgExecSchema,
  MsgRevokeSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/authz/v1beta1/tx_pb'

// Crisis
import {
  MsgVerifyInvariantSchema,
  MsgUpdateParamsSchema as MsgUpdateCrisisParamsSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/crisis/v1beta1/tx_pb'

// Consensus
import { MsgUpdateParamsSchema as MsgUpdateConsensusParamsSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/consensus/v1/tx_pb'

// Distribution
import {
  MsgSetWithdrawAddressSchema,
  MsgWithdrawDelegatorRewardSchema,
  MsgWithdrawValidatorCommissionSchema,
  MsgFundCommunityPoolSchema,
  MsgCommunityPoolSpendSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/distribution/v1beta1/tx_pb'

// Initia Distribution
import {
  MsgUpdateParamsSchema as MsgUpdateDistrParamsSchema,
  MsgDepositValidatorRewardsPoolSchema,
} from '@buf/initia-labs_initia.bufbuild_es/initia/distribution/v1/tx_pb'

// Evidence
import { MsgSubmitEvidenceSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/evidence/v1beta1/tx_pb'

// EVM (Minievm)
import {
  MsgCreateSchema as MsgEvmCreateSchema,
  MsgCreate2Schema as MsgEvmCreate2Schema,
  MsgCallSchema,
  MsgUpdateParamsSchema as MsgUpdateEvmParamsSchema,
} from '@buf/initia-labs_minievm.bufbuild_es/minievm/evm/v1/tx_pb'

// Feegrant
import {
  MsgGrantAllowanceSchema,
  MsgRevokeAllowanceSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/feegrant/v1beta1/tx_pb'

// Gov v1
import {
  MsgCancelProposalSchema,
  MsgDepositSchema,
  MsgSubmitProposalSchema,
  MsgVoteSchema,
  MsgVoteWeightedSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/gov/v1/tx_pb'

// Gov v1beta1 (legacy)
import {
  MsgDepositSchema as MsgDepositLegacySchema,
  MsgSubmitProposalSchema as MsgSubmitProposalLegacySchema,
  MsgVoteSchema as MsgVoteLegacySchema,
  MsgVoteWeightedSchema as MsgVoteWeightedLegacySchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/gov/v1beta1/tx_pb'

// Initia Gov
import {
  MsgUpdateParamsSchema as MsgUpdateGovParamsSchema,
  MsgAddEmergencySubmittersSchema,
  MsgRemoveEmergencySubmittersSchema,
} from '@buf/initia-labs_initia.bufbuild_es/initia/gov/v1/tx_pb'

// Group
import {
  MsgCreateGroupSchema,
  MsgCreateGroupPolicySchema,
  MsgCreateGroupWithPolicySchema,
  MsgUpdateGroupAdminSchema,
  MsgUpdateGroupMembersSchema,
  MsgUpdateGroupMetadataSchema,
  MsgUpdateGroupPolicyAdminSchema,
  MsgUpdateGroupPolicyMetadataSchema,
  MsgUpdateGroupPolicyDecisionPolicySchema,
  MsgExecSchema as MsgGroupExecSchema,
  MsgLeaveGroupSchema,
  MsgSubmitProposalSchema as MsgGroupSubmitProposalSchema,
  MsgVoteSchema as MsgGroupVoteSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/group/v1/tx_pb'

// IBC Hooks
import {
  MsgUpdateACLSchema,
  MsgUpdateParamsSchema as MsgUpdateIbcHooksParamsSchema,
} from '@buf/initia-labs_initia.bufbuild_es/initia/ibchooks/v1/tx_pb'

// IBC Transfer
import { MsgTransferSchema } from '@buf/cosmos_ibc.bufbuild_es/ibc/applications/transfer/v1/tx_pb'

// Intertx
import {
  MsgRegisterAccountSchema,
  MsgSubmitTxSchema,
} from '@buf/initia-labs_initia.bufbuild_es/initia/intertx/v1/tx_pb'

// Move
import {
  MsgPublishSchema,
  MsgExecuteSchema as MsgMoveExecuteSchema,
  MsgExecuteJSONSchema,
  MsgScriptSchema,
  MsgScriptJSONSchema,
  MsgUpdateParamsSchema as MsgUpdateMoveParamsSchema,
  MsgWhitelistStakingSchema,
  MsgWhitelistGasPriceSchema,
  MsgDelistStakingSchema,
  MsgDelistGasPriceSchema,
  MsgGovExecuteSchema,
  MsgGovExecuteJSONSchema,
  MsgGovPublishSchema,
  MsgGovScriptSchema,
  MsgGovScriptJSONSchema,
} from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/tx_pb'

// Mstaking
import {
  MsgCreateValidatorSchema,
  MsgEditValidatorSchema,
  MsgDelegateSchema,
  MsgBeginRedelegateSchema,
  MsgUndelegateSchema,
  MsgCancelUnbondingDelegationSchema,
  MsgUpdateParamsSchema as MsgUpdateMstakingParamsSchema,
} from '@buf/initia-labs_initia.bufbuild_es/initia/mstaking/v1/tx_pb'

// OpChild
import {
  MsgExecuteMessagesSchema,
  MsgSetBridgeInfoSchema,
  MsgFinalizeTokenDepositSchema,
  MsgInitiateTokenWithdrawalSchema,
  MsgAddFeeWhitelistAddressesSchema,
  MsgRemoveFeeWhitelistAddressesSchema,
  MsgAddBridgeExecutorSchema,
  MsgRemoveBridgeExecutorSchema,
  MsgUpdateMinGasPricesSchema,
  MsgUpdateAdminSchema as MsgUpdateOpchildAdminSchema,
  MsgUpdateParamsSchema as MsgUpdateOpchildParamsSchema,
  MsgSpendFeePoolSchema,
  MsgUpdateOracleSchema,
  MsgRegisterMigrationInfoSchema as MsgRegisterL2MigrationInfoSchema,
  MsgMigrateTokenSchema,
} from '@buf/initia-labs_opinit.bufbuild_es/opinit/opchild/v1/tx_pb'

// OpHost
import {
  MsgRecordBatchSchema,
  MsgCreateBridgeSchema,
  MsgProposeOutputSchema,
  MsgDeleteOutputSchema,
  MsgInitiateTokenDepositSchema,
  MsgFinalizeTokenWithdrawalSchema,
  MsgUpdateProposerSchema,
  MsgUpdateChallengerSchema,
  MsgUpdateBatchInfoSchema,
  MsgUpdateOracleConfigSchema,
  MsgUpdateMetadataSchema,
  MsgUpdateParamsSchema as MsgUpdateOphostParamsSchema,
  MsgUpdateFinalizationPeriodSchema,
  MsgRegisterMigrationInfoSchema as MsgRegisterL1MigrationInfoSchema,
} from '@buf/initia-labs_opinit.bufbuild_es/opinit/ophost/v1/tx_pb'

// Reward
import { MsgUpdateParamsSchema as MsgUpdateRewardParamsSchema } from '@buf/initia-labs_initia.bufbuild_es/initia/reward/v1/tx_pb'

// Slashing
import {
  MsgUnjailSchema,
  MsgUpdateParamsSchema as MsgUpdateSlashingParamsSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/slashing/v1beta1/tx_pb'

// Upgrade
import {
  MsgSoftwareUpgradeSchema,
  MsgCancelUpgradeSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/upgrade/v1beta1/tx_pb'

// Wasm (CosmWasm)
import {
  MsgStoreCodeSchema,
  MsgInstantiateContractSchema,
  MsgInstantiateContract2Schema,
  MsgExecuteContractSchema,
  MsgMigrateContractSchema,
  MsgUpdateAdminSchema as MsgUpdateWasmAdminSchema,
  MsgClearAdminSchema,
  MsgUpdateInstantiateConfigSchema,
  MsgUpdateParamsSchema as MsgUpdateWasmParamsSchema,
  MsgSudoContractSchema,
  MsgPinCodesSchema,
  MsgUnpinCodesSchema,
  MsgStoreAndInstantiateContractSchema,
  MsgStoreAndMigrateContractSchema,
  MsgAddCodeUploadParamsAddressesSchema,
  MsgRemoveCodeUploadParamsAddressesSchema,
  MsgUpdateContractLabelSchema,
} from '@buf/cosmwasm_wasmd.bufbuild_es/cosmwasm/wasm/v1/tx_pb'

// ============= V1 Legacy Registry =============
// Extracted from legacy/src/core/Msg.ts fromAmino (L405-784) + fromData (L789-1252)

interface V1Entry {
  protoTypeUrl: string
  aminoType: string
  module: string
  schema?: DescMessage // undefined = no BSR schema available
}

const V1_AMINO_REGISTRY: V1Entry[] = [
  // === Auction (block-sdk) — NO BSR PACKAGE ===
  {
    protoTypeUrl: '/sdk.auction.v1.MsgAuctionBid',
    aminoType: 'block-sdk/x/auction/MsgAuctionBid',
    module: 'auction',
  },
  {
    protoTypeUrl: '/sdk.auction.v1.MsgUpdateParams',
    aminoType: 'block-sdk/x/auction/MsgUpdateParams',
    module: 'auction',
  },

  // === Auth ===
  {
    protoTypeUrl: '/cosmos.auth.v1beta1.MsgUpdateParams',
    aminoType: 'cosmos-sdk/x/auth/MsgUpdateParams',
    module: 'auth',
    schema: MsgUpdateAuthParamsSchema,
  },

  // === Authz ===
  {
    protoTypeUrl: '/cosmos.authz.v1beta1.MsgGrant',
    aminoType: 'cosmos-sdk/MsgGrant',
    module: 'authz',
    schema: MsgGrantSchema,
  },
  {
    protoTypeUrl: '/cosmos.authz.v1beta1.MsgRevoke',
    aminoType: 'cosmos-sdk/MsgRevoke',
    module: 'authz',
    schema: MsgRevokeSchema,
  },
  {
    protoTypeUrl: '/cosmos.authz.v1beta1.MsgExec',
    aminoType: 'cosmos-sdk/MsgExec',
    module: 'authz',
    schema: MsgExecSchema,
  },

  // === Bank ===
  {
    protoTypeUrl: '/cosmos.bank.v1beta1.MsgSend',
    aminoType: 'cosmos-sdk/MsgSend',
    module: 'bank',
    schema: MsgSendSchema,
  },
  {
    protoTypeUrl: '/cosmos.bank.v1beta1.MsgMultiSend',
    aminoType: 'cosmos-sdk/MsgMultiSend',
    module: 'bank',
    schema: MsgMultiSendSchema,
  },
  {
    protoTypeUrl: '/cosmos.bank.v1beta1.MsgUpdateParams',
    aminoType: 'cosmos-sdk/x/bank/MsgUpdateParams',
    module: 'bank',
    schema: MsgUpdateBankParamsSchema,
  },
  {
    protoTypeUrl: '/cosmos.bank.v1beta1.MsgSetSendEnabled',
    aminoType: 'cosmos-sdk/MsgSetSendEnabled',
    module: 'bank',
    schema: MsgSetSendEnabledSchema,
  },
  {
    protoTypeUrl: '/initia.bank.v1.MsgSetDenomMetadata',
    aminoType: 'bank/MsgSetDenomMetadata',
    module: 'bank',
    schema: MsgSetDenomMetadataSchema,
  },

  // === Celestia — NO BSR PACKAGE ===
  {
    protoTypeUrl: '/celestia.blob.v1.MsgPayForBlobs',
    aminoType: 'celestia/MsgPayForBlobs',
    module: 'celestia',
  },

  // === Crisis ===
  {
    protoTypeUrl: '/cosmos.crisis.v1beta1.MsgVerifyInvariant',
    aminoType: 'cosmos-sdk/MsgVerifyInvariant',
    module: 'crisis',
    schema: MsgVerifyInvariantSchema,
  },
  {
    protoTypeUrl: '/cosmos.crisis.v1beta1.MsgUpdateParams',
    aminoType: 'cosmos-sdk/x/crisis/MsgUpdateParams',
    module: 'crisis',
    schema: MsgUpdateCrisisParamsSchema,
  },

  // === Consensus ===
  {
    protoTypeUrl: '/cosmos.consensus.v1.MsgUpdateParams',
    aminoType: 'cosmos-sdk/x/consensus/MsgUpdateParams',
    module: 'consensus',
    schema: MsgUpdateConsensusParamsSchema,
  },

  // === Distribution ===
  {
    protoTypeUrl: '/cosmos.distribution.v1beta1.MsgSetWithdrawAddress',
    aminoType: 'cosmos-sdk/MsgModifyWithdrawAddress',
    module: 'distribution',
    schema: MsgSetWithdrawAddressSchema,
  },
  {
    protoTypeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
    aminoType: 'cosmos-sdk/MsgWithdrawDelegationReward',
    module: 'distribution',
    schema: MsgWithdrawDelegatorRewardSchema,
  },
  // v1 used 'cosmos-sdk/MsgWithdrawValidatorCommission' but chain registers 'cosmos-sdk/MsgWithdrawValCommission'
  {
    protoTypeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawValidatorCommission',
    aminoType: 'cosmos-sdk/MsgWithdrawValCommission',
    module: 'distribution',
    schema: MsgWithdrawValidatorCommissionSchema,
  },
  {
    protoTypeUrl: '/cosmos.distribution.v1beta1.MsgFundCommunityPool',
    aminoType: 'cosmos-sdk/MsgFundCommunityPool',
    module: 'distribution',
    schema: MsgFundCommunityPoolSchema,
  },
  {
    protoTypeUrl: '/initia.distribution.v1.MsgUpdateParams',
    aminoType: 'distribution/MsgUpdateParams',
    module: 'distribution',
    schema: MsgUpdateDistrParamsSchema,
  },
  {
    protoTypeUrl: '/cosmos.distribution.v1beta1.MsgCommunityPoolSpend',
    aminoType: 'cosmos-sdk/distr/MsgCommunityPoolSpend',
    module: 'distribution',
    schema: MsgCommunityPoolSpendSchema,
  },
  {
    protoTypeUrl: '/initia.distribution.v1.MsgDepositValidatorRewardsPool',
    aminoType: 'distr/MsgDepositValidatorRewardsPool',
    module: 'distribution',
    schema: MsgDepositValidatorRewardsPoolSchema,
  },

  // === Evidence ===
  {
    protoTypeUrl: '/cosmos.evidence.v1beta1.MsgSubmitEvidence',
    aminoType: 'cosmos-sdk/MsgSubmitEvidence',
    module: 'evidence',
    schema: MsgSubmitEvidenceSchema,
  },

  // === EVM (Minievm) ===
  {
    protoTypeUrl: '/minievm.evm.v1.MsgCreate',
    aminoType: 'evm/MsgCreate',
    module: 'evm',
    schema: MsgEvmCreateSchema,
  },
  {
    protoTypeUrl: '/minievm.evm.v1.MsgCreate2',
    aminoType: 'evm/MsgCreate2',
    module: 'evm',
    schema: MsgEvmCreate2Schema,
  },
  {
    protoTypeUrl: '/minievm.evm.v1.MsgCall',
    aminoType: 'evm/MsgCall',
    module: 'evm',
    schema: MsgCallSchema,
  },
  {
    protoTypeUrl: '/minievm.evm.v1.MsgUpdateParams',
    aminoType: 'evm/MsgUpdateParams',
    module: 'evm',
    schema: MsgUpdateEvmParamsSchema,
  },

  // === Feegrant ===
  {
    protoTypeUrl: '/cosmos.feegrant.v1beta1.MsgGrantAllowance',
    aminoType: 'cosmos-sdk/MsgGrantAllowance',
    module: 'feegrant',
    schema: MsgGrantAllowanceSchema,
  },
  {
    protoTypeUrl: '/cosmos.feegrant.v1beta1.MsgRevokeAllowance',
    aminoType: 'cosmos-sdk/MsgRevokeAllowance',
    module: 'feegrant',
    schema: MsgRevokeAllowanceSchema,
  },

  // === Forwarding (Noble) — NO BSR PACKAGE ===
  {
    protoTypeUrl: '/noble.forwarding.v1.MsgRegisterAccount',
    aminoType: 'noble/forwarding/RegisterAccount',
    module: 'forwarding',
  },
  {
    protoTypeUrl: '/noble.forwarding.v1.MsgClearAccount',
    aminoType: 'noble/forwarding/ClearAccount',
    module: 'forwarding',
  },
  {
    protoTypeUrl: '/noble.forwarding.v1.MsgSetAllowedDenoms',
    aminoType: 'noble/forwarding/SetAllowedDenoms',
    module: 'forwarding',
  },
  {
    protoTypeUrl: '/noble.forwarding.v1.MsgSetMemo',
    aminoType: 'noble/forwarding/SetMemo',
    module: 'forwarding',
  },

  // === Gov v1 ===
  // v1 used 'cosmos-sdk/v1/MsgCancelProposal' but chain has no amino.name registered (amino unsupported)
  {
    protoTypeUrl: '/cosmos.gov.v1.MsgCancelProposal',
    aminoType: '',
    module: 'gov',
    schema: MsgCancelProposalSchema,
  },
  {
    protoTypeUrl: '/cosmos.gov.v1.MsgDeposit',
    aminoType: 'cosmos-sdk/v1/MsgDeposit',
    module: 'gov',
    schema: MsgDepositSchema,
  },
  {
    protoTypeUrl: '/cosmos.gov.v1.MsgSubmitProposal',
    aminoType: 'cosmos-sdk/v1/MsgSubmitProposal',
    module: 'gov',
    schema: MsgSubmitProposalSchema,
  },
  {
    protoTypeUrl: '/cosmos.gov.v1.MsgVote',
    aminoType: 'cosmos-sdk/v1/MsgVote',
    module: 'gov',
    schema: MsgVoteSchema,
  },
  {
    protoTypeUrl: '/cosmos.gov.v1.MsgVoteWeighted',
    aminoType: 'cosmos-sdk/v1/MsgVoteWeighted',
    module: 'gov',
    schema: MsgVoteWeightedSchema,
  },

  // === Gov v1beta1 (legacy) ===
  {
    protoTypeUrl: '/cosmos.gov.v1beta1.MsgDeposit',
    aminoType: 'cosmos-sdk/MsgDeposit',
    module: 'gov-legacy',
    schema: MsgDepositLegacySchema,
  },
  {
    protoTypeUrl: '/cosmos.gov.v1beta1.MsgSubmitProposal',
    aminoType: 'cosmos-sdk/MsgSubmitProposal',
    module: 'gov-legacy',
    schema: MsgSubmitProposalLegacySchema,
  },
  {
    protoTypeUrl: '/cosmos.gov.v1beta1.MsgVote',
    aminoType: 'cosmos-sdk/MsgVote',
    module: 'gov-legacy',
    schema: MsgVoteLegacySchema,
  },
  {
    protoTypeUrl: '/cosmos.gov.v1beta1.MsgVoteWeighted',
    aminoType: 'cosmos-sdk/MsgVoteWeighted',
    module: 'gov-legacy',
    schema: MsgVoteWeightedLegacySchema,
  },

  // === Initia Gov ===
  {
    protoTypeUrl: '/initia.gov.v1.MsgUpdateParams',
    aminoType: 'gov/MsgUpdateParams',
    module: 'gov',
    schema: MsgUpdateGovParamsSchema,
  },
  {
    protoTypeUrl: '/initia.gov.v1.MsgAddEmergencySubmitters',
    aminoType: 'gov/MsgAddEmergencySubmitters',
    module: 'gov',
    schema: MsgAddEmergencySubmittersSchema,
  },
  {
    protoTypeUrl: '/initia.gov.v1.MsgRemoveEmergencySubmitters',
    aminoType: 'gov/MsgRemoveEmergencySubmitters',
    module: 'gov',
    schema: MsgRemoveEmergencySubmittersSchema,
  },
  {
    protoTypeUrl: '/initia.gov.v1.MsgActivateEmergencyProposal',
    aminoType: 'gov/MsgActivateEmergencyProposal',
    module: 'gov',
  },

  // === Group ===
  {
    protoTypeUrl: '/cosmos.group.v1.MsgCreateGroup',
    aminoType: 'cosmos-sdk/MsgCreateGroup',
    module: 'group',
    schema: MsgCreateGroupSchema,
  },
  {
    protoTypeUrl: '/cosmos.group.v1.MsgCreateGroupPolicy',
    aminoType: 'cosmos-sdk/MsgCreateGroupPolicy',
    module: 'group',
    schema: MsgCreateGroupPolicySchema,
  },
  {
    protoTypeUrl: '/cosmos.group.v1.MsgCreateGroupWithPolicy',
    aminoType: 'cosmos-sdk/MsgCreateGroupWithPolicy',
    module: 'group',
    schema: MsgCreateGroupWithPolicySchema,
  },
  {
    protoTypeUrl: '/cosmos.group.v1.MsgUpdateGroupAdmin',
    aminoType: 'cosmos-sdk/MsgUpdateGroupAdmin',
    module: 'group',
    schema: MsgUpdateGroupAdminSchema,
  },
  {
    protoTypeUrl: '/cosmos.group.v1.MsgUpdateGroupPolicyDecisionPolicy',
    aminoType: 'cosmos-sdk/MsgUpdateGroupDecisionPolicy',
    module: 'group',
    schema: MsgUpdateGroupPolicyDecisionPolicySchema,
  },
  {
    protoTypeUrl: '/cosmos.group.v1.MsgUpdateGroupMembers',
    aminoType: 'cosmos-sdk/MsgUpdateGroupMembers',
    module: 'group',
    schema: MsgUpdateGroupMembersSchema,
  },
  {
    protoTypeUrl: '/cosmos.group.v1.MsgUpdateGroupMetadata',
    aminoType: 'cosmos-sdk/MsgUpdateGroupMetadata',
    module: 'group',
    schema: MsgUpdateGroupMetadataSchema,
  },
  {
    protoTypeUrl: '/cosmos.group.v1.MsgUpdateGroupPolicyAdmin',
    aminoType: 'cosmos-sdk/MsgUpdateGroupPolicyAdmin',
    module: 'group',
    schema: MsgUpdateGroupPolicyAdminSchema,
  },
  {
    protoTypeUrl: '/cosmos.group.v1.MsgUpdateGroupPolicyMetadata',
    aminoType: 'cosmos-sdk/MsgUpdateGroupPolicyMetadata',
    module: 'group',
    schema: MsgUpdateGroupPolicyMetadataSchema,
  },
  {
    protoTypeUrl: '/cosmos.group.v1.MsgExec',
    aminoType: 'cosmos-sdk/group/MsgExec',
    module: 'group',
    schema: MsgGroupExecSchema,
  },
  {
    protoTypeUrl: '/cosmos.group.v1.MsgLeaveGroup',
    aminoType: 'cosmos-sdk/group/MsgLeaveGroup',
    module: 'group',
    schema: MsgLeaveGroupSchema,
  },
  {
    protoTypeUrl: '/cosmos.group.v1.MsgSubmitProposal',
    aminoType: 'cosmos-sdk/group/MsgSubmitProposal',
    module: 'group',
    schema: MsgGroupSubmitProposalSchema,
  },
  {
    protoTypeUrl: '/cosmos.group.v1.MsgVote',
    aminoType: 'cosmos-sdk/group/MsgVote',
    module: 'group',
    schema: MsgGroupVoteSchema,
  },

  // === IBC Hooks ===
  {
    protoTypeUrl: '/initia.ibchooks.v1.MsgUpdateACL',
    aminoType: 'ibchooks/MsgUpdateACL',
    module: 'ibchooks',
    schema: MsgUpdateACLSchema,
  },
  {
    protoTypeUrl: '/initia.ibchooks.v1.MsgUpdateParams',
    aminoType: 'ibchooks/MsgUpdateParams',
    module: 'ibchooks',
    schema: MsgUpdateIbcHooksParamsSchema,
  },

  // === IBC NFT Transfer — NO BSR PACKAGE (initia-specific) ===
  {
    protoTypeUrl: '/ibc.applications.nft_transfer.v1.MsgTransfer',
    aminoType: 'nft-transfer/MsgTransfer',
    module: 'nft-transfer',
  },
  {
    protoTypeUrl: '/ibc.applications.nft_transfer.v1.MsgUpdateParams',
    aminoType: 'nft-transfer/MsgUpdateParams',
    module: 'nft-transfer',
  },

  // === IBC Perm — NO BSR PACKAGE (initia-specific) ===
  {
    protoTypeUrl: '/ibc.applications.perm.v1.MsgUpdateAdmin',
    aminoType: 'ibc-perm/MsgUpdateAdmin',
    module: 'ibc-perm',
  },
  {
    protoTypeUrl: '/ibc.applications.perm.v1.MsgUpdatePermissionedRelayers',
    aminoType: 'ibc-perm/MsgUpdatePermissionedRelayers',
    module: 'ibc-perm',
  },

  // === IBC Transfer ===
  {
    protoTypeUrl: '/ibc.applications.transfer.v1.MsgTransfer',
    aminoType: 'cosmos-sdk/MsgTransfer',
    module: 'ibc-transfer',
    schema: MsgTransferSchema,
  },

  // === Intertx ===
  {
    protoTypeUrl: '/initia.intertx.v1.MsgRegisterAccount',
    aminoType: 'intertx/MsgRegisterAccount',
    module: 'intertx',
    schema: MsgRegisterAccountSchema,
  },
  {
    protoTypeUrl: '/initia.intertx.v1.MsgSubmitTx',
    aminoType: 'intertx/MsgSubmitTx',
    module: 'intertx',
    schema: MsgSubmitTxSchema,
  },

  // === Marketmap (Connect) — NO BSR PACKAGE ===
  {
    protoTypeUrl: '/connect.marketmap.v2.MsgCreateMarkets',
    aminoType: 'connect/x/marketmap/MsgCreateMarkets',
    module: 'marketmap',
  },
  {
    protoTypeUrl: '/connect.marketmap.v2.MsgUpdateMarkets',
    aminoType: 'connect/x/marketmap/MsgUpdateMarkets',
    module: 'marketmap',
  },
  {
    protoTypeUrl: '/connect.marketmap.v2.MsgUpsertMarkets',
    aminoType: 'connect/x/marketmap/MsgUpsertMarkets',
    module: 'marketmap',
  },
  {
    protoTypeUrl: '/connect.marketmap.v2.MsgRemoveMarkets',
    aminoType: 'connect/x/marketmap/MsgRemoveMarkets',
    module: 'marketmap',
  },
  {
    protoTypeUrl: '/connect.marketmap.v2.MsgRemoveMarketAuthorities',
    aminoType: 'connect/x/marketmap/MsgRemoveMarketAuthorities',
    module: 'marketmap',
  },
  {
    protoTypeUrl: '/connect.marketmap.v2.MsgParams',
    aminoType: 'connect/x/marketmap/MsgParams',
    module: 'marketmap',
  },

  // === Move ===
  {
    protoTypeUrl: '/initia.move.v1.MsgPublish',
    aminoType: 'move/MsgPublish',
    module: 'move',
    schema: MsgPublishSchema,
  },
  {
    protoTypeUrl: '/initia.move.v1.MsgExecute',
    aminoType: 'move/MsgExecute',
    module: 'move',
    schema: MsgMoveExecuteSchema,
  },
  {
    protoTypeUrl: '/initia.move.v1.MsgExecuteJSON',
    aminoType: 'move/MsgExecuteJSON',
    module: 'move',
    schema: MsgExecuteJSONSchema,
  },
  {
    protoTypeUrl: '/initia.move.v1.MsgScript',
    aminoType: 'move/MsgScript',
    module: 'move',
    schema: MsgScriptSchema,
  },
  {
    protoTypeUrl: '/initia.move.v1.MsgScriptJSON',
    aminoType: 'move/MsgScriptJSON',
    module: 'move',
    schema: MsgScriptJSONSchema,
  },
  {
    protoTypeUrl: '/initia.move.v1.MsgUpdateParams',
    aminoType: 'move/MsgUpdateParams',
    module: 'move',
    schema: MsgUpdateMoveParamsSchema,
  },
  {
    protoTypeUrl: '/initia.move.v1.MsgWhitelistStaking',
    aminoType: 'move/MsgWhitelistStaking',
    module: 'move',
    schema: MsgWhitelistStakingSchema,
  },
  {
    protoTypeUrl: '/initia.move.v1.MsgWhitelistGasPrice',
    aminoType: 'move/MsgWhitelistGasPrice',
    module: 'move',
    schema: MsgWhitelistGasPriceSchema,
  },
  {
    protoTypeUrl: '/initia.move.v1.MsgDelistStaking',
    aminoType: 'move/MsgDelistStaking',
    module: 'move',
    schema: MsgDelistStakingSchema,
  },
  {
    protoTypeUrl: '/initia.move.v1.MsgDelistGasPrice',
    aminoType: 'move/MsgDelistGasPrice',
    module: 'move',
    schema: MsgDelistGasPriceSchema,
  },
  {
    protoTypeUrl: '/initia.move.v1.MsgGovExecute',
    aminoType: 'move/MsgGovExecute',
    module: 'move',
    schema: MsgGovExecuteSchema,
  },
  {
    protoTypeUrl: '/initia.move.v1.MsgGovExecuteJSON',
    aminoType: 'move/MsgGovExecuteJSON',
    module: 'move',
    schema: MsgGovExecuteJSONSchema,
  },
  {
    protoTypeUrl: '/initia.move.v1.MsgGovPublish',
    aminoType: 'move/MsgGovPublish',
    module: 'move',
    schema: MsgGovPublishSchema,
  },
  {
    protoTypeUrl: '/initia.move.v1.MsgGovScript',
    aminoType: 'move/MsgGovScript',
    module: 'move',
    schema: MsgGovScriptSchema,
  },
  {
    protoTypeUrl: '/initia.move.v1.MsgGovScriptJSON',
    aminoType: 'move/MsgGovScriptJSON',
    module: 'move',
    schema: MsgGovScriptJSONSchema,
  },

  // === Mstaking ===
  {
    protoTypeUrl: '/initia.mstaking.v1.MsgDelegate',
    aminoType: 'mstaking/MsgDelegate',
    module: 'mstaking',
    schema: MsgDelegateSchema,
  },
  {
    protoTypeUrl: '/initia.mstaking.v1.MsgUndelegate',
    aminoType: 'mstaking/MsgUndelegate',
    module: 'mstaking',
    schema: MsgUndelegateSchema,
  },
  {
    protoTypeUrl: '/initia.mstaking.v1.MsgBeginRedelegate',
    aminoType: 'mstaking/MsgBeginRedelegate',
    module: 'mstaking',
    schema: MsgBeginRedelegateSchema,
  },
  {
    protoTypeUrl: '/initia.mstaking.v1.MsgCreateValidator',
    aminoType: 'mstaking/MsgCreateValidator',
    module: 'mstaking',
    schema: MsgCreateValidatorSchema,
  },
  {
    protoTypeUrl: '/initia.mstaking.v1.MsgEditValidator',
    aminoType: 'mstaking/MsgEditValidator',
    module: 'mstaking',
    schema: MsgEditValidatorSchema,
  },
  {
    protoTypeUrl: '/initia.mstaking.v1.MsgCancelUnbondingDelegation',
    aminoType: 'mstaking/MsgCancelUnbondingDelegation',
    module: 'mstaking',
    schema: MsgCancelUnbondingDelegationSchema,
  },
  {
    protoTypeUrl: '/initia.mstaking.v1.MsgUpdateParams',
    aminoType: 'mstaking/MsgUpdateParams',
    module: 'mstaking',
    schema: MsgUpdateMstakingParamsSchema,
  },

  // === OpChild ===
  {
    protoTypeUrl: '/opinit.opchild.v1.MsgAddBridgeExecutor',
    aminoType: 'opchild/MsgAddBridgeExecutor',
    module: 'opchild',
    schema: MsgAddBridgeExecutorSchema,
  },
  {
    protoTypeUrl: '/opinit.opchild.v1.MsgAddFeeWhitelistAddresses',
    aminoType: 'opchild/MsgAddFeeWhitelistAddresses',
    module: 'opchild',
    schema: MsgAddFeeWhitelistAddressesSchema,
  },
  {
    protoTypeUrl: '/opinit.opchild.v1.MsgUpdateSequencer',
    aminoType: 'opchild/MsgUpdateSequencer',
    module: 'opchild',
  },
  {
    protoTypeUrl: '/opinit.opchild.v1.MsgAddAttestor',
    aminoType: 'opchild/MsgAddAttestor',
    module: 'opchild',
  },
  {
    protoTypeUrl: '/opinit.opchild.v1.MsgRemoveAttestor',
    aminoType: 'opchild/MsgRemoveAttestor',
    module: 'opchild',
  },
  {
    protoTypeUrl: '/opinit.opchild.v1.MsgFinalizeTokenDeposit',
    aminoType: 'opchild/MsgFinalizeTokenDeposit',
    module: 'opchild',
    schema: MsgFinalizeTokenDepositSchema,
  },
  {
    protoTypeUrl: '/opinit.opchild.v1.MsgInitiateTokenWithdrawal',
    aminoType: 'opchild/MsgInitiateTokenWithdrawal',
    module: 'opchild',
    schema: MsgInitiateTokenWithdrawalSchema,
  },
  {
    protoTypeUrl: '/opinit.opchild.v1.MsgRemoveBridgeExecutor',
    aminoType: 'opchild/MsgRemoveBridgeExecutor',
    module: 'opchild',
    schema: MsgRemoveBridgeExecutorSchema,
  },
  {
    protoTypeUrl: '/opinit.opchild.v1.MsgRemoveFeeWhitelistAddresses',
    aminoType: 'opchild/MsgRemoveFeeWhitelistAddresses',
    module: 'opchild',
    schema: MsgRemoveFeeWhitelistAddressesSchema,
  },
  {
    protoTypeUrl: '/opinit.opchild.v1.MsgExecuteMessages',
    aminoType: 'opchild/MsgExecuteMessages',
    module: 'opchild',
    schema: MsgExecuteMessagesSchema,
  },
  {
    protoTypeUrl: '/opinit.opchild.v1.MsgSpendFeePool',
    aminoType: 'opchild/MsgSpendFeePool',
    module: 'opchild',
    schema: MsgSpendFeePoolSchema,
  },
  {
    protoTypeUrl: '/opinit.opchild.v1.MsgUpdateMinGasPrices',
    aminoType: 'opchild/MsgUpdateMinGasPrices',
    module: 'opchild',
    schema: MsgUpdateMinGasPricesSchema,
  },
  {
    protoTypeUrl: '/opinit.opchild.v1.MsgUpdateAdmin',
    aminoType: 'opchild/MsgUpdateAdmin',
    module: 'opchild',
    schema: MsgUpdateOpchildAdminSchema,
  },
  {
    protoTypeUrl: '/opinit.opchild.v1.MsgSetBridgeInfo',
    aminoType: 'opchild/MsgSetBridgeInfo',
    module: 'opchild',
    schema: MsgSetBridgeInfoSchema,
  },
  {
    protoTypeUrl: '/opinit.opchild.v1.MsgUpdateOracle',
    aminoType: 'opchild/MsgUpdateOracle',
    module: 'opchild',
    schema: MsgUpdateOracleSchema,
  },
  {
    protoTypeUrl: '/opinit.opchild.v1.MsgRegisterMigrationInfo',
    aminoType: 'opchild/MsgRegisterMigrationInfo',
    module: 'opchild',
    schema: MsgRegisterL2MigrationInfoSchema,
  },
  {
    protoTypeUrl: '/opinit.opchild.v1.MsgMigrateToken',
    aminoType: 'opchild/MsgMigrateToken',
    module: 'opchild',
    schema: MsgMigrateTokenSchema,
  },
  {
    protoTypeUrl: '/opinit.opchild.v1.MsgUpdateParams',
    aminoType: 'opchild/MsgUpdateParams',
    module: 'opchild',
    schema: MsgUpdateOpchildParamsSchema,
  },

  // === OpHost ===
  {
    protoTypeUrl: '/opinit.ophost.v1.MsgRecordBatch',
    aminoType: 'ophost/MsgRecordBatch',
    module: 'ophost',
    schema: MsgRecordBatchSchema,
  },
  {
    protoTypeUrl: '/opinit.ophost.v1.MsgCreateBridge',
    aminoType: 'ophost/MsgCreateBridge',
    module: 'ophost',
    schema: MsgCreateBridgeSchema,
  },
  {
    protoTypeUrl: '/opinit.ophost.v1.MsgProposeOutput',
    aminoType: 'ophost/MsgProposeOutput',
    module: 'ophost',
    schema: MsgProposeOutputSchema,
  },
  {
    protoTypeUrl: '/opinit.ophost.v1.MsgDeleteOutput',
    aminoType: 'ophost/MsgDeleteOutput',
    module: 'ophost',
    schema: MsgDeleteOutputSchema,
  },
  {
    protoTypeUrl: '/opinit.ophost.v1.MsgInitiateTokenDeposit',
    aminoType: 'ophost/MsgInitiateTokenDeposit',
    module: 'ophost',
    schema: MsgInitiateTokenDepositSchema,
  },
  {
    protoTypeUrl: '/opinit.ophost.v1.MsgFinalizeTokenWithdrawal',
    aminoType: 'ophost/MsgFinalizeTokenWithdrawal',
    module: 'ophost',
    schema: MsgFinalizeTokenWithdrawalSchema,
  },
  {
    protoTypeUrl: '/opinit.ophost.v1.MsgUpdateProposer',
    aminoType: 'ophost/MsgUpdateProposer',
    module: 'ophost',
    schema: MsgUpdateProposerSchema,
  },
  {
    protoTypeUrl: '/opinit.ophost.v1.MsgUpdateChallenger',
    aminoType: 'ophost/MsgUpdateChallenger',
    module: 'ophost',
    schema: MsgUpdateChallengerSchema,
  },
  {
    protoTypeUrl: '/opinit.ophost.v1.MsgUpdateBatchInfo',
    aminoType: 'ophost/MsgUpdateBatchInfo',
    module: 'ophost',
    schema: MsgUpdateBatchInfoSchema,
  },
  {
    protoTypeUrl: '/opinit.ophost.v1.MsgUpdateMetadata',
    aminoType: 'ophost/MsgUpdateMetadata',
    module: 'ophost',
    schema: MsgUpdateMetadataSchema,
  },
  {
    protoTypeUrl: '/opinit.ophost.v1.MsgUpdateOracleConfig',
    aminoType: 'ophost/MsgUpdateOracleConfig',
    module: 'ophost',
    schema: MsgUpdateOracleConfigSchema,
  },
  {
    protoTypeUrl: '/opinit.ophost.v1.MsgUpdateParams',
    aminoType: 'ophost/MsgUpdateParams',
    module: 'ophost',
    schema: MsgUpdateOphostParamsSchema,
  },
  {
    protoTypeUrl: '/opinit.ophost.v1.MsgUpdateFinalizationPeriod',
    aminoType: 'ophost/MsgUpdateFinalizationPeriod',
    module: 'ophost',
    schema: MsgUpdateFinalizationPeriodSchema,
  },
  {
    protoTypeUrl: '/opinit.ophost.v1.MsgDisableBridge',
    aminoType: 'ophost/MsgDisableBridge',
    module: 'ophost',
  },
  {
    protoTypeUrl: '/opinit.ophost.v1.MsgRegisterMigrationInfo',
    aminoType: 'ophost/MsgRegisterMigrationInfo',
    module: 'ophost',
    schema: MsgRegisterL1MigrationInfoSchema,
  },

  // === Oracle (Connect) — NO BSR PACKAGE ===
  {
    protoTypeUrl: '/connect.oracle.v2.MsgAddCurrencyPairs',
    aminoType: 'connect/x/oracle/MsgAddCurrencyPairs',
    module: 'oracle',
  },
  {
    protoTypeUrl: '/connect.oracle.v2.MsgRemoveCurrencyPairs',
    aminoType: 'connect/x/oracle/MsgRemoveCurrencyPairs',
    module: 'oracle',
  },

  // === Reward ===
  {
    protoTypeUrl: '/initia.reward.v1.MsgUpdateParams',
    aminoType: 'reward/MsgUpdateParams',
    module: 'reward',
    schema: MsgUpdateRewardParamsSchema,
  },
  {
    protoTypeUrl: '/initia.reward.v1.MsgFundCommunityPool',
    aminoType: 'reward/MsgFundCommunityPool',
    module: 'reward',
  },

  // === Slashing ===
  {
    protoTypeUrl: '/cosmos.slashing.v1beta1.MsgUnjail',
    aminoType: 'cosmos-sdk/MsgUnjail',
    module: 'slashing',
    schema: MsgUnjailSchema,
  },
  {
    protoTypeUrl: '/cosmos.slashing.v1beta1.MsgUpdateParams',
    aminoType: 'cosmos-sdk/x/slashing/MsgUpdateParams',
    module: 'slashing',
    schema: MsgUpdateSlashingParamsSchema,
  },

  // === TokenFactory (Miniwasm) — NO BSR PACKAGE ===
  {
    protoTypeUrl: '/miniwasm.tokenfactory.v1.MsgCreateDenom',
    aminoType: 'tokenfactory/MsgCreateDenom',
    module: 'tokenfactory',
  },
  {
    protoTypeUrl: '/miniwasm.tokenfactory.v1.MsgMint',
    aminoType: 'tokenfactory/MsgMint',
    module: 'tokenfactory',
  },
  {
    protoTypeUrl: '/miniwasm.tokenfactory.v1.MsgBurn',
    aminoType: 'tokenfactory/MsgBurn',
    module: 'tokenfactory',
  },
  {
    protoTypeUrl: '/miniwasm.tokenfactory.v1.MsgChangeAdmin',
    aminoType: 'tokenfactory/MsgChangeAdmin',
    module: 'tokenfactory',
  },
  {
    protoTypeUrl: '/miniwasm.tokenfactory.v1.MsgSetDenomMetadata',
    aminoType: 'tokenfactory/MsgSetDenomMetadata',
    module: 'tokenfactory',
  },
  {
    protoTypeUrl: '/miniwasm.tokenfactory.v1.MsgSetBeforeSendHook',
    aminoType: 'tokenfactory/MsgSetBeforeSendHook',
    module: 'tokenfactory',
  },
  {
    protoTypeUrl: '/miniwasm.tokenfactory.v1.MsgUpdateParams',
    aminoType: 'tokenfactory/MsgUpdateParams',
    module: 'tokenfactory',
  },

  // === Upgrade ===
  {
    protoTypeUrl: '/cosmos.upgrade.v1beta1.MsgSoftwareUpgrade',
    aminoType: 'cosmos-sdk/MsgSoftwareUpgrade',
    module: 'upgrade',
    schema: MsgSoftwareUpgradeSchema,
  },
  {
    protoTypeUrl: '/cosmos.upgrade.v1beta1.MsgCancelUpgrade',
    aminoType: 'cosmos-sdk/MsgCancelUpgrade',
    module: 'upgrade',
    schema: MsgCancelUpgradeSchema,
  },

  // === Wasm (CosmWasm) ===
  {
    protoTypeUrl: '/cosmwasm.wasm.v1.MsgStoreCode',
    aminoType: 'wasm/MsgStoreCode',
    module: 'wasm',
    schema: MsgStoreCodeSchema,
  },
  {
    protoTypeUrl: '/cosmwasm.wasm.v1.MsgInstantiateContract',
    aminoType: 'wasm/MsgInstantiateContract',
    module: 'wasm',
    schema: MsgInstantiateContractSchema,
  },
  {
    protoTypeUrl: '/cosmwasm.wasm.v1.MsgInstantiateContract2',
    aminoType: 'wasm/MsgInstantiateContract2',
    module: 'wasm',
    schema: MsgInstantiateContract2Schema,
  },
  {
    protoTypeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
    aminoType: 'wasm/MsgExecuteContract',
    module: 'wasm',
    schema: MsgExecuteContractSchema,
  },
  {
    protoTypeUrl: '/cosmwasm.wasm.v1.MsgMigrateContract',
    aminoType: 'wasm/MsgMigrateContract',
    module: 'wasm',
    schema: MsgMigrateContractSchema,
  },
  {
    protoTypeUrl: '/cosmwasm.wasm.v1.MsgUpdateAdmin',
    aminoType: 'wasm/MsgUpdateAdmin',
    module: 'wasm',
    schema: MsgUpdateWasmAdminSchema,
  },
  {
    protoTypeUrl: '/cosmwasm.wasm.v1.MsgClearAdmin',
    aminoType: 'wasm/MsgClearAdmin',
    module: 'wasm',
    schema: MsgClearAdminSchema,
  },
  {
    protoTypeUrl: '/cosmwasm.wasm.v1.MsgUpdateInstantiateConfig',
    aminoType: 'wasm/MsgUpdateInstantiateConfig',
    module: 'wasm',
    schema: MsgUpdateInstantiateConfigSchema,
  },
  {
    protoTypeUrl: '/cosmwasm.wasm.v1.MsgUpdateParams',
    aminoType: 'wasm/MsgUpdateParams',
    module: 'wasm',
    schema: MsgUpdateWasmParamsSchema,
  },
  {
    protoTypeUrl: '/cosmwasm.wasm.v1.MsgSudoContract',
    aminoType: 'wasm/MsgSudoContract',
    module: 'wasm',
    schema: MsgSudoContractSchema,
  },
  {
    protoTypeUrl: '/cosmwasm.wasm.v1.MsgPinCodes',
    aminoType: 'wasm/MsgPinCodes',
    module: 'wasm',
    schema: MsgPinCodesSchema,
  },
  {
    protoTypeUrl: '/cosmwasm.wasm.v1.MsgUnpinCodes',
    aminoType: 'wasm/MsgUnpinCodes',
    module: 'wasm',
    schema: MsgUnpinCodesSchema,
  },
  {
    protoTypeUrl: '/cosmwasm.wasm.v1.MsgStoreAndInstantiateContract',
    aminoType: 'wasm/MsgStoreAndInstantiateContract',
    module: 'wasm',
    schema: MsgStoreAndInstantiateContractSchema,
  },
  {
    protoTypeUrl: '/cosmwasm.wasm.v1.MsgStoreAndMigrateContract',
    aminoType: 'wasm/MsgStoreAndMigrateContract',
    module: 'wasm',
    schema: MsgStoreAndMigrateContractSchema,
  },
  {
    protoTypeUrl: '/cosmwasm.wasm.v1.MsgAddCodeUploadParamsAddresses',
    aminoType: 'wasm/MsgAddCodeUploadParamsAddresses',
    module: 'wasm',
    schema: MsgAddCodeUploadParamsAddressesSchema,
  },
  {
    protoTypeUrl: '/cosmwasm.wasm.v1.MsgRemoveCodeUploadParamsAddresses',
    aminoType: 'wasm/MsgRemoveCodeUploadParamsAddresses',
    module: 'wasm',
    schema: MsgRemoveCodeUploadParamsAddressesSchema,
  },
  {
    protoTypeUrl: '/cosmwasm.wasm.v1.MsgUpdateContractLabel',
    aminoType: 'wasm/MsgUpdateContractLabel',
    module: 'wasm',
    schema: MsgUpdateContractLabelSchema,
  },
  {
    protoTypeUrl: '/cosmwasm.wasm.v1.MsgUpdateMaxWasmSize',
    aminoType: 'wasm/MsgUpdateMaxWasmSize',
    module: 'wasm',
  },

  // === WasmExtension (Miniwasm) — NO BSR PACKAGE ===
  {
    protoTypeUrl: '/miniwasm.wasmextension.v1.MsgStoreCodeAdmin',
    aminoType: 'wasmextension/MsgStoreCodeAdmin',
    module: 'wasmextension',
  },
]

// ============= Category A: Amino Type Name Comparison =============

const withSchema = V1_AMINO_REGISTRY.filter(e => e.schema != null) as Array<
  V1Entry & { schema: DescMessage }
>
const withoutSchema = V1_AMINO_REGISTRY.filter(e => e.schema == null)

describe('A. Amino type name: chain-registered vs v2', () => {
  const withAminoSupport = withSchema.filter(e => e.aminoType !== '')
  const withoutAminoSupport = withSchema.filter(e => e.aminoType === '')

  it.each(withAminoSupport.map(e => [e.protoTypeUrl, e.aminoType, e.schema] as const))(
    '%s → expected: %s',
    (protoTypeUrl, chainAminoType, schema) => {
      const v2AminoType = getAminoType(schema)
      expect(v2AminoType, `v2 should have amino.name for ${protoTypeUrl}`).toBeTruthy()
      expect(v2AminoType).toBe(chainAminoType)
    }
  )

  it.each(withoutAminoSupport.map(e => [e.protoTypeUrl, e.schema] as const))(
    '%s → amino unsupported (no amino.name on chain)',
    (_protoTypeUrl, schema) => {
      const v2AminoType = getAminoType(schema)
      // Empty string or undefined means no amino support — matches chain
      expect(!v2AminoType || v2AminoType === '').toBe(true)
    }
  )
})

// ============= Category B: Field Name Comparison =============

describe('B. Field name: v2 amino field names via getAminoFieldName()', () => {
  it.each(withSchema.map(e => [e.protoTypeUrl, e.schema] as const))(
    '%s fields should have valid amino names',
    (_protoTypeUrl, schema) => {
      for (const field of schema.fields) {
        const aminoName = getAminoFieldName(field)
        expect(aminoName.length).toBeGreaterThan(0)
        // Amino field names should be snake_case (no uppercase)
        expect(aminoName).toMatch(/^[a-z0-9_]+$/)
      }
    }
  )
})

// ============= Category C: Coverage Gap =============

describe('C. Coverage gap: messages without BSR schema', () => {
  const grouped = new Map<string, V1Entry[]>()
  for (const entry of withoutSchema) {
    const list = grouped.get(entry.module) ?? []
    list.push(entry)
    grouped.set(entry.module, list)
  }

  it('should report v1-only messages (no BSR package)', () => {
    const gaps: string[] = []
    for (const [module, entries] of grouped) {
      for (const entry of entries) {
        gaps.push(`[${module}] ${entry.protoTypeUrl} → ${entry.aminoType}`)
      }
    }

    // Print report for visibility
    if (gaps.length > 0) {
      console.log('\n=== V1-only messages (no v2 BSR schema) ===')
      for (const gap of gaps) {
        console.log(`  ${gap}`)
      }
      console.log(`  Total: ${gaps.length} messages\n`)
    }

    // This is informational — not a failure
    expect(gaps.length).toBeGreaterThanOrEqual(0)
  })

  it('should list all gap modules', () => {
    const modules = [...grouped.keys()].sort()
    console.log('\n=== Modules with no BSR coverage ===')
    for (const mod of modules) {
      console.log(`  ${mod}: ${grouped.get(mod)!.length} messages`)
    }
    expect(modules.length).toBeGreaterThanOrEqual(0)
  })
})

// ============= Summary Stats =============

describe('Summary', () => {
  it('should report registry stats', () => {
    const total = V1_AMINO_REGISTRY.length
    const matched = withSchema.length
    const unmatched = withoutSchema.length

    console.log('\n=== Amino Mismatch Report ===')
    console.log(`  Total v1 messages: ${total}`)
    console.log(`  With BSR schema (comparable): ${matched}`)
    console.log(`  Without BSR schema (gap): ${unmatched}`)
    console.log(`  Coverage: ${((matched / total) * 100).toFixed(1)}%\n`)

    expect(total).toBeGreaterThan(0)
    expect(matched + unmatched).toBe(total)
  })
})
