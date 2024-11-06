import { APIRequester } from '../APIRequester'
import { IbcTransferAPI } from './IbcTransferAPI'
import { DenomTrace } from '../../../core/ibc/applications/transfer/DenomTrace'

const c = new APIRequester('https://rest.devnet.initia.xyz')
const ibctx = new IbcTransferAPI(c)

describe('IbcTransferAPI', () => {
  it('denomTraces', async () => {
    const denomTraces = await ibctx.denomTraces().then((v) => v[0])
    denomTraces.forEach(function (denomTrace: DenomTrace.Data) {
      expect(denomTrace.path).toMatch('transfer/channel-')
      expect(denomTrace.base_denom).not.toBeUndefined()
    })
  })

  it('params', async () => {
    const param = await ibctx.parameters()
    expect(param.send_enabled).toEqual(expect.any(Boolean))
    expect(param.receive_enabled).toEqual(expect.any(Boolean))
  })
})
