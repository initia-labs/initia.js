import { createBaseConfig } from './common'

// Query services
import { Query as MoveQuery } from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/query_pb'
import { Query as MstakingQuery } from '@buf/initia-labs_initia.bufbuild_es/initia/mstaking/v1/query_pb'
import { Query as DistributionQuery } from '@buf/initia-labs_initia.bufbuild_es/initia/distribution/v1/query_pb'
import { Query as GovQuery } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/gov/v1/query_pb'
import { Query as OphostQuery } from '@buf/initia-labs_opinit.bufbuild_es/opinit/ophost/v1/query_pb'
import { Query as SlashingQuery } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/slashing/v1beta1/query_pb'
import { Query as EvidenceQuery } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/evidence/v1beta1/query_pb'
import { Query as RewardQuery } from '@buf/initia-labs_initia.bufbuild_es/initia/reward/v1/query_pb'
import { Query as NftTransferQuery } from '@buf/initia-labs_initia.bufbuild_es/ibc/applications/nft_transfer/v1/query_pb'
import { Query as PermQuery } from '@buf/initia-labs_initia.bufbuild_es/ibc/applications/perm/v1/query_pb'
import { Query as InitiaTxQuery } from '@buf/initia-labs_initia.bufbuild_es/initia/tx/v1/query_pb'

// Tx services — full modules (query + tx)
import {
  Msg as MoveTxMsg,
  MsgWhitelistSchema,
  MsgDelistSchema,
} from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/tx_pb'
import { Msg as MstakingTxMsg } from '@buf/initia-labs_initia.bufbuild_es/initia/mstaking/v1/tx_pb'
import { Msg as DistributionTxMsg } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/distribution/v1beta1/tx_pb'
import { Msg as GovTxMsg } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/gov/v1/tx_pb'
import { Msg as OphostTxMsg } from '@buf/initia-labs_opinit.bufbuild_es/opinit/ophost/v1/tx_pb'

// Tx services — tx-only modules
import { Msg as RewardTxMsg } from '@buf/initia-labs_initia.bufbuild_es/initia/reward/v1/tx_pb'
import { Msg as InitiaBankTxMsg } from '@buf/initia-labs_initia.bufbuild_es/initia/bank/v1/tx_pb'
import { Msg as DynamicFeeTxMsg } from '@buf/initia-labs_initia.bufbuild_es/initia/dynamicfee/v1/tx_pb'
import { Msg as InitiaDistributionTxMsg } from '@buf/initia-labs_initia.bufbuild_es/initia/distribution/v1/tx_pb'
import { Msg as InitiaGovTxMsg } from '@buf/initia-labs_initia.bufbuild_es/initia/gov/v1/tx_pb'
import { Msg as SlashingTxMsg } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/slashing/v1beta1/tx_pb'
import { Msg as EvidenceTxMsg } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/evidence/v1beta1/tx_pb'
import { Msg as VestingTxMsg } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/vesting/v1beta1/tx_pb'
import { Msg as NftTransferTxMsg } from '@buf/initia-labs_initia.bufbuild_es/ibc/applications/nft_transfer/v1/tx_pb'
import { Msg as PermTxMsg } from '@buf/initia-labs_initia.bufbuild_es/ibc/applications/perm/v1/tx_pb'

// Type-only registrations
import { file_initia_move_v1_auth } from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/auth_pb'

export const initiaChain = createBaseConfig()
  .addModule('move', { query: MoveQuery, tx: MoveTxMsg })
  .addModule('mstaking', { query: MstakingQuery, tx: MstakingTxMsg })
  .addModule('distribution', { query: DistributionQuery, tx: DistributionTxMsg })
  .addModule('gov', { query: GovQuery, tx: GovTxMsg })
  .addModule('ophost', { query: OphostQuery, tx: OphostTxMsg })
  .addModule('reward', { query: RewardQuery, tx: RewardTxMsg })
  .addModule('initiaBank', { tx: InitiaBankTxMsg })
  .addModule('dynamicFee', { tx: DynamicFeeTxMsg })
  .addModule('initiaDistribution', { tx: InitiaDistributionTxMsg })
  .addModule('initiaGov', { tx: InitiaGovTxMsg })
  .addModule('slashing', { query: SlashingQuery, tx: SlashingTxMsg })
  .addModule('evidence', { query: EvidenceQuery, tx: EvidenceTxMsg })
  .addModule('vesting', { tx: VestingTxMsg })
  .addModule('nftTransfer', { query: NftTransferQuery, tx: NftTransferTxMsg })
  .addModule('perm', { query: PermQuery, tx: PermTxMsg })
  .addModule('initiaTx', { query: InitiaTxQuery })
  .addDecodeTypes(MsgWhitelistSchema, MsgDelistSchema)
  .addTypes(file_initia_move_v1_auth)
