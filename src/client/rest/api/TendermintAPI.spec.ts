import { describe, it, expect } from 'vitest'
import { APIRequester } from '../APIRequester'
import { TendermintAPI } from './TendermintAPI'
import { Tx } from '../../../core'
import { Tx as Tx_pb } from '@initia/initia.proto/cosmos/tx/v1beta1/tx'

const c = new APIRequester('https://rest.testnet.initia.xyz')
const api = new TendermintAPI(c)

describe('TendermintAPI', () => {
  it('load block and decode txs', async () => {
    const blockInfo = await api.blockInfo()
    if (blockInfo.block.data.txs != null) {
      // first tx is dummy one from skip
      blockInfo.block.data.txs.slice(1).every((txBytes) => {
        const txProto = Tx_pb.decode(Buffer.from(txBytes, 'base64'))
        expect(Tx.fromProto(txProto)).toBeDefined()
      })
    }
  })

  it('node info', async () => {
    await expect(api.nodeInfo()).resolves.toBeInstanceOf(Object)
  })

  it('validator set (latest)', async () => {
    const vals = await api.validatorSet()

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
    const block = await api.blockInfo()

    expect(block).toMatchObject({
      block: expect.any(Object),
    })
  })
})
