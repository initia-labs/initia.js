import { APIRequester } from './APIRequester'

describe('APIRequester', () => {
  let fetchSpy: jest.SpyInstance

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(async () => 
      new Response(JSON.stringify(null), {
        headers: { 'Content-Type': 'application/json' }
      })
    )
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('accept a standard URL', async () => {
    const request = new APIRequester('https://rest.testnet.initia.xyz')
    await request.get('/foo')

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://rest.testnet.initia.xyz/foo',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'accept': 'application/json'
        })
      })
    )
  })

  it('accept a deep URL', async () => {
    const request = new APIRequester('https://rest.testnet.initia.xyz/bar')
    await request.get('/foo')

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://rest.testnet.initia.xyz/bar/foo',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'accept': 'application/json'
        })
      })
    )
  })

  it('accept an URL with search params', async () => {
    const request = new APIRequester('https://rest.testnet.initia.xyz?key=123')
    await request.get('/foo')

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://rest.testnet.initia.xyz/foo?key=123',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'accept': 'application/json'
        })
      })
    )
  })
  
  it('handles baseURL with path and endpoint without leading slash', async () => {
    const request = new APIRequester('https://rest.testnet.initia.xyz/bar')
    await request.get('foo')

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://rest.testnet.initia.xyz/bar/foo',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'accept': 'application/json'
        })
      })
    )
  })
})
