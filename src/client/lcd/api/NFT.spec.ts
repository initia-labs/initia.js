import { LCDClient } from '../..';
import { Fee, MsgExecute, Tx } from '../../../core';
import { MnemonicKey } from '../../../key';
import { BCS } from '../../../util';
const mk = new MnemonicKey({
  mnemonic: '...',
});
const initia = new LCDClient('https://stone-rest.initia.tech', {
  chainId: 'stone-8',
});
const wallet = initia.wallet(mk);

const testOni = `0xfa5f07319724580ef16dcef6ce4d3b0bd0348e48::test_nfts::OniForce`;
const moduleAddr = '0xfa5f07319724580ef16dcef6ce4d3b0bd0348e48';
const bcs = BCS.getInstance();

// 일종의 faucet
async function mintTest(amount: number) {
  const msgs = [
    new MsgExecute(
      mk.accAddress,
      moduleAddr,
      'test_nfts',
      'mint_oni',
      [],
      [
        bcs.serialize('u64', amount), // amount 10개 정도로 나눠서 하는게 좋습니다,
        bcs.serialize('address', mk.accAddress),
      ]
    ),
  ];

  const tx = await wallet.createAndSignTx({ msgs });
  await initia.tx.broadcastSync(tx);
}

// 이건 client 단에서 구현을 해야할거 같습니다.
async function createRegisterNftTx(
  collectionStructTag: string,
  forTest: boolean // 항상 같은 tx가 나오도록 fee, account number, sequence 지정
): Promise<Tx> {
  const msgs = [
    new MsgExecute(mk.accAddress, '0x1', 'nft', 'register', [
      collectionStructTag,
    ]),
  ];

  if (forTest) {
    return wallet.createAndSignTx({
      msgs,
      ...forTestOptions,
    });
  } else {
    return wallet.createAndSignTx({ msgs });
  }
}

// NFT send
async function createTransferTx(
  to: string,
  collectionStructTag: string,
  tokenId: string,
  forTest: boolean // 항상 같은 tx가 나오도록 fee, account number, sequence 지정
): Promise<Tx> {
  const msgs = [
    new MsgExecute(
      mk.accAddress,
      '0x1',
      'nft',
      'transfer',
      [collectionStructTag],
      [bcs.serialize('address', to), bcs.serialize('string', tokenId)]
    ),
  ];

  if (forTest) {
    return wallet.createAndSignTx({
      msgs,
      ...forTestOptions,
    });
  } else {
    return wallet.createAndSignTx({
      msgs,
    });
  }
}

async function isAccountRegistered(
  addr: string,
  collectionStructTag: string
): Promise<boolean> {
  return initia.move.viewFunction<boolean>(
    '0x1',
    'nft',
    'is_account_registered',
    [collectionStructTag],
    [bcs.serialize('address', addr)]
  );
}

const forTestOptions = {
  fee: new Fee(1000, '1000uinit'),
  accountNumber: 1,
  sequence: 1,
};

async function sample() {
  // register 안되어 있으면 register
  if (!(await isAccountRegistered(mk.accAddress, testOni))) {
    const tx = await createRegisterNftTx(testOni, false);
    await initia.tx.broadcastSync(tx);
    console.log('registered');
  }

  setTimeout(() => {
    mintTest(10); // 10개 mint
    console.log('mint test');
  }, 7000);

  let ids: string[] = [];

  setTimeout(() => {
    // 내가 가지고 있는 token id 보기
    initia.move
      .viewFunction<string[]>(
        '0x1',
        'nft',
        'all_token_ids',
        [testOni],
        [bcs.serialize('option<string>', null), bcs.serialize('u8', 10)]
      )
      .then(res => (ids = res));
    console.log('get ids');
  }, 14000);

  // transfer

  setTimeout(() => {
    console.log('transfer');
    createTransferTx(mk.accAddress, testOni, ids[0], false)
      .then(tx => initia.tx.broadcastSync(tx).catch(e => console.log(e)))
      .catch(e => console.log(e));
  }, 21000);
}

sample().catch(e => console.log(e));
