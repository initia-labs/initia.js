import axios from 'axios';
import { APIRequester } from './APIRequester';

jest.mock('axios');
const mockedAxios = jest.mocked(axios);

describe('APIRequester', () => {
  beforeAll(() => {
    // @ts-expect-error
    axios.create.mockReturnThis();
  });

  it('accept a standard URL', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: null });

    const request = new APIRequester('https://stone-rest.initia.tech/');
    await request.get('/foo');

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://stone-rest.initia.tech/foo',
      {
        headers: new axios.AxiosHeaders(),
        params: {},
      }
    );
  });

  it('accept a deep URL', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: null });

    const request = new APIRequester('https://stone-rest.initia.tech/bar');
    await request.get('/foo');

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://stone-rest.initia.tech/bar/foo',
      {
        headers: new axios.AxiosHeaders(),
        params: {},
      }
    );
  });

  it('accept an URL with search params', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: null });

    const request = new APIRequester('https://stone-rest.initia.tech?key=123');
    await request.get('/foo');

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://stone-rest.initia.tech/foo?key=123',
      {
        headers: new axios.AxiosHeaders(),
        params: {},
      }
    );
  });

  it('accept an URL with credentials', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: null });

    const request = new APIRequester('https://abc:123@stone-rest.initia.tech/');
    await request.get('/foo');

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://:123@stone-rest.initia.tech/foo',
      {
        headers: new axios.AxiosHeaders(),
        params: {},
      }
    );
  });
});
