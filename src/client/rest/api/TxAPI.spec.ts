import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest'
import { RESTClient } from '../RESTClient'
import { APIRequester } from '../APIRequester'
import { isTxError } from './TxAPI'
import { MsgSend } from '../../../core'
import { MnemonicKey } from '../../../key'

const mk = new MnemonicKey({
  mnemonic:
    'sound hour era feature bacon code drift deal raw toward soldier nation winter consider tissue jewel script result mean faculty water exist lunch betray',
})
const initia = new RESTClient('https://rest.devnet.initia.xyz', {
  chainId: 'initiation-2',
})
const wallet = initia.wallet(mk)

describe('TxAPI', () => {
  describe('broadcast', () => {
    beforeEach(() => {
      // Need to respond to requests made by createAndSignTx.
      vi.spyOn(APIRequester.prototype, 'get').mockImplementation((route) => {
        if (route.includes('/cosmos/auth/v1beta1/accounts')) {
          return Promise.resolve({
            account: {
              '@type': '/cosmos.auth.v1beta1.BaseAccount',
              address: 'AccAddress',
              pub_key: '',
              account_number: 1,
              sequence: 1,
            },
          })
        }
        return Promise.resolve()
      })

      vi.spyOn(APIRequester.prototype, 'post').mockImplementation((route) => {
        if (route.includes('/cosmos/tx/v1beta1/simulate')) {
          return Promise.resolve({
            gas_info: {
              gas_wanted: 1000,
              gas_used: 1000,
            },
            result: {
              data: '',
              log: '',
              events: [],
            },
          })
        }

        return Promise.resolve({
          tx_response: {
            txhash:
              '4E63BF998EC3C8765400C800122207FB151B84123673554AAEB8BDF443AEDC39',
          },
          tx: {},
        })
      })
    })

    afterEach(() => {
      vi.clearAllMocks()
    })

    it('broadcast fetches and returns txInfo', async () => {
      vi
        .spyOn(APIRequester.prototype, 'getRaw')
        .mockImplementation((route) => {
          if (route.includes('/cosmos/tx/v1beta1/txs/')) {
            return Promise.resolve({
              tx_response: {
                txhash: 'txInfo.txhash',
                raw_log: '[]',
                gas_wanted: 20000,
                gas_used: 20000,
                height: 20000,
                logs: [],
                timestamp: '1650608740',
                tx: {
                  '@type': '/cosmos.tx.v1beta1.Tx',
                  body: {
                    messages: [],
                    memo: '',
                  },
                  auth_info: {
                    signer_infos: [],
                    fee: {
                      amount: [],
                      gas_limit: '300000',
                      payer: '',
                      granter: '',
                    },
                  },
                  signatures: [],
                },
              },
            })
          }
          return Promise.resolve()
        })

      const send = new MsgSend(
        'init1wlvk4e083pd3nddlfe5quy56e68atra3gu9xfs',
        'init1wlvk4e083pd3nddlfe5quy56e68atra3gu9xfs',
        { uinit: '1000000' }
      )

      const tx = await wallet.createAndSignTx({ msgs: [send] })
      const txInfo = await initia.tx.broadcast(tx)

      expect(isTxError(txInfo)).toBeFalsy()
    })

    it('broadcast timesout if txInfo not found in time', async () => {
      vi
        .spyOn(APIRequester.prototype, 'getRaw')
        .mockImplementation((route) => {
          if (route.includes('/cosmos/tx/v1beta1/txs/')) {
            // Force an error to emulate a transaction not found.
            return Promise.reject()
          }

          return Promise.resolve()
        })

      const send = new MsgSend(
        'init1wlvk4e083pd3nddlfe5quy56e68atra3gu9xfs',
        'init1wlvk4e083pd3nddlfe5quy56e68atra3gu9xfs',
        { uinit: '1000000' }
      )

      const tx = await wallet.createAndSignTx({ msgs: [send] })

      await expect(async () => {
        await initia.tx.broadcast(tx, 500)
      }).rejects.toThrow('Transaction was not included in a block')
    })
  })
})
