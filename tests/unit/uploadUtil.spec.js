import MockAdapter from 'axios-mock-adapter';
import { expect } from 'chai';
import { parse } from 'qs';
import RestClient from '@/rest';
import Upload from '@/utils/upload';

describe('Upload module', () => {
  let mock;
  const rc = new RestClient();
  const blob = new Blob(['hello world'], { type: 'text/plain' });
  blob.name = 'hello.txt';

  before(() => {
    mock = new MockAdapter(rc);
  });

  afterEach(() => {
    mock.reset();
  });

  after(() => {
    mock.restore();
  });

  it('successfully upload a single-chunk file', async () => {
    mock.onPost('file').reply(({ data, headers }) => {
      expect(headers['Content-Type']).to.equal('application/x-www-form-urlencoded');

      const params = parse(data);
      expect(parseInt(params.size, 10)).to.equal(blob.size).to.equal('hello world'.length);
      expect(params.parentType).to.equal('folder');
      expect(params.parentId).to.equal('123');
      expect(params.mimeType).to.equal('text/plain');
      expect(params.name).to.equal('hello.txt');
      return [200, { _id: '456' }];
    });

    mock.onPost(/file\/chunk/).reply(({ url }) => {
      const params = parse(url.split('?')[1]);
      expect(params.uploadId).to.equal('456');
      expect(parseInt(params.offset, 10)).to.equal(0);
      return [200, { _id: '789' }];
    });

    const upload = new Upload(rc, blob, { _id: '123', _modelType: 'folder' });
    const file = await upload.start();
    expect(file._id).to.equal('789');
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
    expect(error).to.be.an('Error');

    mock.reset();
    mock.onPost('file').replyOnce(200, { _id: '456' });
    mock.onPost(/file\/chunk/).replyOnce(200, { _id: '789' });

    const file = await upload.resume();
    expect(file._id).to.equal('789');
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
    expect(error).to.be.an('Error');
    expect(error.response.data.message).to.equal('Internal error');
    expect(upload.offset).to.equal(8);

    mock.onGet(/file\/offset/).replyOnce(200, { offset: 8 });
    mock.onPost(/file\/chunk/).replyOnce(({ data }) => {
      expect(data).to.be.a('Blob');
      expect(data.size).to.equal(3);
      return [200, { _id: '789' }];
    });
    const file = await upload.resume();
    expect(file._id).to.equal('789');
  });

  it('successfully upload a single chunk upload to S3', async () => {
    // TODO
  });

  it('fail and resume a single-chunk S3 upload', async () => {
    // TODO
  });

  it('fail and resume a multipart S3 upload', async () => {
    // TODO
  });
});
