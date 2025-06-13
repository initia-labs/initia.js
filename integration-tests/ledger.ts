//const TransportNodeHid = require("@ledgerhq/hw-transport-node-hid").default;
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid'
import { RESTClient, LedgerKey, MsgSend, MsgExecute, Wallet, SignMode, bcs, Kind, Fee, Coins} from '../src'

//testImports().catch(console.error);

async function main() {
  console.log("=== Starting Main Function ===");

  const isEth = false

  const t = await TransportNodeHid.create()
  const ledgerKey = isEth?(await LedgerKey.createEthereumApp(t)):(await LedgerKey.createCosmosApp(t));

  console.log("accAddress:", ledgerKey.accAddress)
  console.log("appConfiguration:", await ledgerKey.getAppConfiguration())

  const restClient = new RESTClient("https://rest.testnet.initia.xyz");
  const wallet = new Wallet(restClient, ledgerKey);

  const msg1 = new MsgSend(
    ledgerKey.accAddress,
    ledgerKey.accAddress,
    { uinit: "1" }
  );

  const msg2 = new MsgExecute(
    ledgerKey.accAddress,
    '0x1',
    'dex',
    'swap_script',
    [],
    [
      bcs.object().serialize('0xdbf06c48af3984ec6d9ae8a9aa7dbb0bb1e784aa9b8c4a5681af660cf8558d7d').toBase64(),
      bcs.object().serialize('0x8e4733bdabcf7d4afc3d14f0dd46c9bf52fb0fce9e4b996c939e195b8bc891d9').toBase64(),
      bcs.u64().serialize(1000000).toBase64(),
      bcs.option(bcs.u64()).serialize(null).toBase64(),
    ]
  )

  const fee = new Fee(1000000, Coins.fromString('300000uinit'))

  const textObj = {
    Title: "title",
    Content: "content",
    Indent: 2,
    Expert: false
  }

  const tx = await wallet.createAndSignTx({
    msgs: [msg1, msg2],
    fee,
    signMode: isEth?SignMode.SIGN_MODE_EIP_191:SignMode.SIGN_MODE_LEGACY_AMINO_JSON
  })
  console.log("Transaction signed:", JSON.stringify(tx.toData()));

  const result = await restClient.tx.broadcastSync(tx);
  console.log("Transaction broadcast result:", result);

  console.log("=== Main Function Completed ===");
}

main().catch(console.error);