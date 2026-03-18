import { createBaseConfig } from './common'
import { Query as MoveQuery } from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/query_pb'
import { Msg as MoveTxMsg } from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/tx_pb'
import { Query as OpchildQuery } from '@buf/initia-labs_opinit.bufbuild_es/opinit/opchild/v1/query_pb'
import { Msg as OpchildTxMsg } from '@buf/initia-labs_opinit.bufbuild_es/opinit/opchild/v1/tx_pb'
import { Query as NftTransferQuery } from '@buf/initia-labs_initia.bufbuild_es/ibc/applications/nft_transfer/v1/query_pb'
import { Msg as NftTransferTxMsg } from '@buf/initia-labs_initia.bufbuild_es/ibc/applications/nft_transfer/v1/tx_pb'
import { Query as IbcFeeQuery } from '@buf/cosmos_ibc.bufbuild_es/ibc/applications/fee/v1/query_pb'
import { Msg as IbcFeeTxMsg } from '@buf/cosmos_ibc.bufbuild_es/ibc/applications/fee/v1/tx_pb'
import { file_initia_move_v1_auth } from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/auth_pb'

export const minimoveChain = createBaseConfig()
  .addModule('move', { query: MoveQuery, tx: MoveTxMsg })
  .addModule('opchild', { query: OpchildQuery, tx: OpchildTxMsg })
  .addModule('nftTransfer', { query: NftTransferQuery, tx: NftTransferTxMsg })
  .addModule('ibcFee', { query: IbcFeeQuery, tx: IbcFeeTxMsg })
  .addTypes(file_initia_move_v1_auth)
