import MockAdapter from 'axios-mock-adapter';
import { parse } from 'qs';
import RestClient from '@/rest';
import Upload from '@/utils/upload';

describe('Upload module', () => {
  const rc = new RestClient();
  const mock = new MockAdapter(rc);
  const blob = new Blob(['hello world'], { type: 'text/plain' });
  blob.name = 'hello.txt';

  afterEach(() => {
    mock.reset();
  });

  it('successfully upload a single-chunk file', async () => {
    mock.onPost('file').reply(({ data, headers }) => {
      expect(headers['Content-Type']).toBe('application/x-www-form-urlencoded');

      const params = parse(data);
      expect(parseInt(params.size, 10)).toBe(blob.size);
      expect(blob.size).toBe('hello world'.length);
      expect(params.parentType).toBe('folder');
      expect(params.parentId).toBe('123');
      expect(params.mimeType).toBe('text/plain');
      expect(params.name).toBe('hello.txt');
      return [200, { _id: '456' }];
    });

    mock.onPost(/file\/chunk/).reply(({ url }) => {
      const params = parse(url.split('?')[1]);
      expect(params.uploadId).toBe('456');
      expect(parseInt(params.offset, 10)).toBe(0);
      return [200, { _id: '789' }];
    });

    const upload = new Upload(rc, blob, { _id: '123', _modelType: 'folder' });
    expect((await upload.start())._id).toBe('789');
  });

  it('fail during init step and resume', async () => {
    mock.onPost('file').networkError();

    let error;
    const upload = new Upload(rc, blob, { _id: '123', _modelType: 'folder' });

    try {
      await upload.start();
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(Error);

    mock.reset();
    mock.onPost('file').replyOnce(200, { _id: '456' });
    mock.onPost(/file\/chunk/).replyOnce(200, { _id: '789' });

    const file = await upload.resume();
    expect(file._id).toBe('789');
  });

  it('first chunk succeeds, second chunk fails', async () => {
    mock.onPost('file').replyOnce(200, { _id: '456' });
    mock.onPost(/file\/chunk/).replyOnce(200, { _id: '456' });
    mock.onPost(/file\/chunk/).replyOnce(500, { message: 'Internal error' });

    let error;
    const upload = new Upload(rc, blob, { _id: '123', _modelType: 'folder' }, { chunkLen: 8 });

    try {
      await upload.start();
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(Error);
    expect(error.response.data.message).toBe('Internal error');
    expect(upload.offset).toBe(8);

    mock.onGet(/file\/offset/).replyOnce(200, { offset: 8 });
    mock.onPost(/file\/chunk/).replyOnce(({ data }) => {
      expect(data).toBeInstanceOf(Blob);
      expect(data.size).toBe(3);
      return [200, { _id: '789' }];
    });
    const file = await upload.resume();
    expect(file._id).toBe('789');
  });
});
