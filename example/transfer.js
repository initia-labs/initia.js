import { LCDClient, MsgSend, RawKey, Wallet } from '@initia/initia.js';

const lcd = new LCDClient('https://lcd.initiation-1.initia.xyz', {
  chainId: 'initiation-1',
  gasPrices:'0.15move/944f8dd8dc49f96c25fea9849f16436dcfa6d564eec802f3ef7f8b3ea85368ff',
  gasAdjustment: '1.5',
});

async function fetchBalance(address) {
  const balances = await lcd.bank.balance(address);
  return JSON.stringify(balances)
}

async function send(privateKey, fromAddress,toAddress) {
  const key = new RawKey(Buffer.from(privateKey, "hex"));
  const wallet = new Wallet(lcd, key);

  const msg = new MsgSend(
    fromAddress,   // sender address
    toAddress,   // recipient address
    "1uinit" // send amount
  );
  const signedTx = await wallet.createAndSignTx({
    msgs: [msg]
  });
  return await lcd.tx.broadcast(signedTx);
}

async function example() {
  const address = ""; // your address
  const privateKey = ""; // your privateKey (should move to secure place)

  console.log("Fetching balance...");
  const fetchBalanceResult = await fetchBalance(address);
  console.log("Fetched balance: ", fetchBalanceResult);

  console.log("Sending...");
  const sendResult = await send(privateKey, address, address);
  console.log("Sent: ", sendResult);
}
example();

