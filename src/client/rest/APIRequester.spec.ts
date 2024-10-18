import axios from 'axios'
import { APIRequester } from './APIRequester'

jest.mock('axios')
const mockedAxios = jest.mocked(axios)

describe('APIRequester', () => {
  beforeAll(() => {
    // @ts-expect-error
    axios.create.mockReturnThis()
  })

  it('accept a standard URL', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: null })

    const request = new APIRequester('https://rest.devnet.initia.xyz/')
    await request.get('/foo')

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://rest.devnet.initia.xyz/foo',
      {
        headers: new axios.AxiosHeaders(),
        params: {},
      }
    )
  })

  it('accept a deep URL', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: null })

    const request = new APIRequester('https://rest.devnet.initia.xyz/bar')
    await request.get('/foo')

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://rest.devnet.initia.xyz/bar/foo',
      {
        headers: new axios.AxiosHeaders(),
        params: {},
      }
    )
  })

  it('accept an URL with search params', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: null })

    const request = new APIRequester('https://rest.devnet.initia.xyz?key=123')
    await request.get('/foo')

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://rest.devnet.initia.xyz/foo?key=123',
      {
        headers: new axios.AxiosHeaders(),
        params: {},
      }
    )
  })
})
