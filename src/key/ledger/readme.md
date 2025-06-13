# LedgerKey

LedgerKey extends Key

LedgerKey has the one of the Apps
- EthereumApp
- CosmosApp

EthereumApp:
- extends LedgerApp
- has Eth from @ledgerhq/hw-app-eth

CosmosApp:
- extends LedgerApp
- has Cosmos from @zondax/ledger-cosmos-js
