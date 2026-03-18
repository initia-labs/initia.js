import { createBaseConfig } from './common'
import { Query as WasmQuery } from '@buf/cosmwasm_wasmd.bufbuild_es/cosmwasm/wasm/v1/query_pb'
import { Msg as WasmTxMsg } from '@buf/cosmwasm_wasmd.bufbuild_es/cosmwasm/wasm/v1/tx_pb'
import { Query as TokenFactoryQuery } from '@buf/initia-labs_miniwasm.bufbuild_es/miniwasm/tokenfactory/v1/query_pb'
import { Msg as TokenFactoryTxMsg } from '@buf/initia-labs_miniwasm.bufbuild_es/miniwasm/tokenfactory/v1/tx_pb'
import { Msg as WasmExtTxMsg } from '@buf/initia-labs_miniwasm.bufbuild_es/miniwasm/wasmextension/v1/tx_pb'
import { Query as OpchildQuery } from '@buf/initia-labs_opinit.bufbuild_es/opinit/opchild/v1/query_pb'
import { Msg as OpchildTxMsg } from '@buf/initia-labs_opinit.bufbuild_es/opinit/opchild/v1/tx_pb'
import { Query as IbcFeeQuery } from '@buf/cosmos_ibc.bufbuild_es/ibc/applications/fee/v1/query_pb'
import { Msg as IbcFeeTxMsg } from '@buf/cosmos_ibc.bufbuild_es/ibc/applications/fee/v1/tx_pb'

export const miniwasmChain = createBaseConfig()
  .addModule('wasm', { query: WasmQuery, tx: WasmTxMsg })
  .addModule('tokenFactory', { query: TokenFactoryQuery, tx: TokenFactoryTxMsg })
  .addModule('wasmExtension', { tx: WasmExtTxMsg })
  .addModule('opchild', { query: OpchildQuery, tx: OpchildTxMsg })
  .addModule('ibcFee', { query: IbcFeeQuery, tx: IbcFeeTxMsg })
