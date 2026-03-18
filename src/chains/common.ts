import { createChainConfig } from '../chain-config'

// Query services
import { Query as OracleQuery } from '@buf/skip-mev_connect.bufbuild_es/connect/oracle/v2/query_pb'
import { Query as AuthQuery } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/auth/v1beta1/query_pb'
import { Query as BankQuery } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/bank/v1beta1/query_pb'
import { Service as TxService } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/tx/v1beta1/service_pb'
import { Service as TendermintService } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/base/tendermint/v1beta1/query_pb'
import { Query as AuthzQuery } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/authz/v1beta1/query_pb'
import { Query as FeegrantQuery } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/feegrant/v1beta1/query_pb'
import { Query as GroupQuery } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/group/v1/query_pb'
import { Query as UpgradeQuery } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/upgrade/v1beta1/query_pb'
import { Query as ConsensusQuery } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/consensus/v1/query_pb'
import { Query as IbcHooksQuery } from '@buf/initia-labs_initia.bufbuild_es/initia/ibchooks/v1/query_pb'
import { Query as IbcTransferQuery } from '@buf/cosmos_ibc.bufbuild_es/ibc/applications/transfer/v1/query_pb'
import { Query as IbcChannelQuery } from '@buf/cosmos_ibc.bufbuild_es/ibc/core/channel/v1/query_pb'
import { Query as IbcClientQuery } from '@buf/cosmos_ibc.bufbuild_es/ibc/core/client/v1/query_pb'
import { Query as IbcConnectionQuery } from '@buf/cosmos_ibc.bufbuild_es/ibc/core/connection/v1/query_pb'
import { Query as IcaControllerQuery } from '@buf/cosmos_ibc.bufbuild_es/ibc/applications/interchain_accounts/controller/v1/query_pb'
import { Query as IcaHostQuery } from '@buf/cosmos_ibc.bufbuild_es/ibc/applications/interchain_accounts/host/v1/query_pb'

// Tx services
import { Msg as BankTxMsg } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/bank/v1beta1/tx_pb'
import { Msg as IbcTransferTxMsg } from '@buf/cosmos_ibc.bufbuild_es/ibc/applications/transfer/v1/tx_pb'
import { Msg as ChannelTxMsg } from '@buf/cosmos_ibc.bufbuild_es/ibc/core/channel/v1/tx_pb'
import { Msg as ClientTxMsg } from '@buf/cosmos_ibc.bufbuild_es/ibc/core/client/v1/tx_pb'
import { Msg as ConnectionTxMsg } from '@buf/cosmos_ibc.bufbuild_es/ibc/core/connection/v1/tx_pb'
import { Msg as IcaControllerTxMsg } from '@buf/cosmos_ibc.bufbuild_es/ibc/applications/interchain_accounts/controller/v1/tx_pb'
import { Msg as IcaHostTxMsg } from '@buf/cosmos_ibc.bufbuild_es/ibc/applications/interchain_accounts/host/v1/tx_pb'
import { Msg as AuthzTxMsg } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/authz/v1beta1/tx_pb'
import { Msg as FeegrantTxMsg } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/feegrant/v1beta1/tx_pb'
import { Msg as GroupTxMsg } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/group/v1/tx_pb'
import { Msg as CrisisTxMsg } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/crisis/v1beta1/tx_pb'
import { Msg as UpgradeTxMsg } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/upgrade/v1beta1/tx_pb'
import { Msg as ConsensusTxMsg } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/consensus/v1/tx_pb'
import { Msg as AuthTxMsg } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/auth/v1beta1/tx_pb'
import { Msg as IbcHooksTxMsg } from '@buf/initia-labs_initia.bufbuild_es/initia/ibchooks/v1/tx_pb'
import { Msg as InterTxTxMsg } from '@buf/initia-labs_initia.bufbuild_es/initia/intertx/v1/tx_pb'

// Type-only registrations (for Any decode)
import { file_cosmos_crypto_ed25519_keys } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/crypto/ed25519/keys_pb'
import { file_cosmos_crypto_secp256k1_keys } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/crypto/secp256k1/keys_pb'
import { file_initia_crypto_v1beta1_ethsecp256k1_keys } from '@buf/initia-labs_initia.bufbuild_es/initia/crypto/v1beta1/ethsecp256k1/keys_pb'
import { file_cosmos_auth_v1beta1_auth } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/auth/v1beta1/auth_pb'

export function createBaseConfig() {
  return createChainConfig()
    .addModule('auth', { query: AuthQuery })
    .addModule('bank', { query: BankQuery, tx: BankTxMsg })
    .addModule('tx', { query: TxService })
    .addModule('tendermint', { query: TendermintService })
    .addModule('ibc', {
      query: [IbcTransferQuery, IbcChannelQuery, IbcClientQuery, IbcConnectionQuery] as const,
      tx: [IbcTransferTxMsg, ChannelTxMsg, ClientTxMsg, ConnectionTxMsg] as const,
    })
    .addModule('ibcIca', {
      query: [IcaControllerQuery, IcaHostQuery] as const,
      tx: [IcaControllerTxMsg, IcaHostTxMsg] as const,
    })
    .addModule('authz', { query: AuthzQuery, tx: AuthzTxMsg })
    .addModule('feegrant', { query: FeegrantQuery, tx: FeegrantTxMsg })
    .addModule('group', { query: GroupQuery, tx: GroupTxMsg })
    .addModule('crisis', { tx: CrisisTxMsg })
    .addModule('upgrade', { query: UpgradeQuery, tx: UpgradeTxMsg })
    .addModule('consensus', { query: ConsensusQuery, tx: ConsensusTxMsg })
    .addModule('cosmosAuth', { tx: AuthTxMsg })
    .addModule('ibcHooks', { query: IbcHooksQuery, tx: IbcHooksTxMsg })
    .addModule('interTx', { tx: InterTxTxMsg })
    .addModule('oracle', { query: OracleQuery })
    .addTypes(
      file_cosmos_crypto_ed25519_keys,
      file_cosmos_crypto_secp256k1_keys,
      file_initia_crypto_v1beta1_ethsecp256k1_keys,
      file_cosmos_auth_v1beta1_auth
    )
}
