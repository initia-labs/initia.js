import { APIRequester } from '../APIRequester'
import { TendermintAPI } from './TendermintAPI'
import { Tx } from '../../../core'
import { bytesFromBase64 } from '../../../util/polyfill'
import { Tx as Tx_pb } from '@initia/initia.proto/cosmos/tx/v1beta1/tx'

const c = new APIRequester('https://lcd.devnet.initia.xyz/')
const tendermint = new TendermintAPI(c)

describe('TendermintAPI', () => {
  it('load block and decode txs', async () => {
    const blockInfo = await tendermint.blockInfo(1)
    if (blockInfo.block.data.txs != null) {
      blockInfo.block.data.txs.every((txBytes) => {
        const txProto = Tx_pb.decode(bytesFromBase64(txBytes))
        expect(Tx.fromProto(txProto)).toBeDefined()
      })
    }
  })

  it('node info', async () => {
    await expect(tendermint.nodeInfo()).resolves.toBeInstanceOf(Object)
  })

  it('validator set (latest)', async () => {
    const vals = await tendermint.validatorSet()

    expect(vals[0]).toContainEqual({
      address: expect.any(String),
      pub_key: {
        '@type': expect.any(String),
        key: expect.any(String),
      },
      proposer_priority: expect.any(String),
      voting_power: expect.any(String),
    })
  })

  it('validator set (1)', async () => {
    const vals = await tendermint.validatorSet(1)

    expect(vals[0]).toContainEqual({
      address: expect.any(String),
      pub_key: {
        '@type': expect.any(String),
        key: expect.any(String),
      },
      proposer_priority: expect.any(String),
      voting_power: expect.any(String),
    })
  })

  it('block info', async () => {
    const block = await tendermint.blockInfo()

    expect(block).toMatchObject({
      block: expect.any(Object),
    })
  })
})
