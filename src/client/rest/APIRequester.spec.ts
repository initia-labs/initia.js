import axios from 'xior'
import { APIRequester } from './APIRequester'

jest.mock('xior')
const mockedAxios = jest.mocked(axios)

describe('APIRequester', () => {
  beforeAll(() => {
    // @ts-expect-error
    axios.create.mockReturnThis()
  })

  it('accept a standard URL', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: null } as any)

    const request = new APIRequester('https://rest.testnet.initia.xyz')
    await request.get('/foo')

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://rest.testnet.initia.xyz/foo',
      {
        headers: {},
        params: {},
      }
    )
  })

  it('accept a deep URL', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: null } as any)

    const request = new APIRequester('https://rest.testnet.initia.xyz/bar')
    await request.get('/foo')

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://rest.testnet.initia.xyz/bar/foo',
      {
        headers: {},
        params: {},
      }
    )
  })

  it('accept an URL with search params', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: null } as any)

    const request = new APIRequester('https://rest.testnet.initia.xyz?key=123')
    await request.get('/foo')

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://rest.testnet.initia.xyz/foo?key=123',
      {
        headers: {},
        params: {},
      }
    )
  })

  it('handles baseURL with path and endpoint without leading slash', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: null } as any)

    const request = new APIRequester('https://rest.testnet.initia.xyz/bar')
    await request.get('foo')

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://rest.testnet.initia.xyz/bar/foo',
      {
        headers: {},
        params: {},
      }
    )
  })
})
