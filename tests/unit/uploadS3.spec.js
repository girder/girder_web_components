import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import RestClient from '@/rest';
import Upload from '@/utils/upload';

const S3_SINGLE_CHUNK_RESP = {
  _id: '456',
  behavior: 's3',
  s3: {
    chunked: false,
    request: {
      method: 'PUT',
      headers: { 'x-amz-acl': 'private' },
      url: 'https://bucket.s3.amazonaws.com/key',
    },
  },
};

const S3_MULTIPART_INIT_RESP = {
  ...S3_SINGLE_CHUNK_RESP,
  s3: {
    ...S3_SINGLE_CHUNK_RESP.s3,
    chunked: true,
    chunkLength: 8,
    request: {
      ...S3_SINGLE_CHUNK_RESP.s3.request,
      method: 'POST',
    },
  },
};

const S3_MULTIPART_CHUNK_RESP = {
  ...S3_SINGLE_CHUNK_RESP,
  s3: {
    request: {
      url: 'https://bucket.s3.amazonaws.com/key?partNumber=i&uploadId=foo',
      method: 'PUT',
    },
  },
};

const S3_MULTIPART_FINALIZE_RESP = {
  method: 'POST',
  url: 'https://bucket.s3.amazonaws.com/key?uploadId=foo',
  headers: { 'Content-Type': 'text/xml' },
};

const INIT_XML = `
<InitiateMultipartUploadResult>
  <Bucket>bucket</Bucket>
  <Key>key</Key>
  <UploadId>foo</UploadId>
</InitiateMultipartUploadResult>`;

describe('S3 upload behavior', () => {
  const $rest = new RestClient();
  const mock = new MockAdapter($rest);
  const s3Mock = new MockAdapter(axios);
  const blob = new Blob(['hello world'], { type: 'text/plain' });
  blob.name = 'hello.txt';

  afterEach(() => {
    mock.reset();
    s3Mock.reset();
  });

  it('successfully upload a single chunk upload', async () => {
    mock.onPost('file').replyOnce(200, S3_SINGLE_CHUNK_RESP);
    mock.onPost('file/completion').replyOnce(200, { _id: '789' });
    s3Mock.onPut(S3_SINGLE_CHUNK_RESP.s3.request.url).replyOnce(({ headers }) => {
      expect(headers['x-amz-acl']).toBe('private');
      return [200];
    });

    const upload = new Upload(blob, {
      $rest,
      parent: { _id: '123', _modelType: 'folder' },
    });
    expect((await upload.start())._id).toBe('789');
  });

  it('fail and resume a single-chunk upload', async () => {
    mock.onGet(/file\/offset/).replyOnce(200, S3_SINGLE_CHUNK_RESP.s3.request);
    mock.onPost('file').replyOnce(200, S3_SINGLE_CHUNK_RESP);
    mock.onPost('file/completion').replyOnce(200, { _id: '789' });
    s3Mock.onPut(S3_SINGLE_CHUNK_RESP.s3.request.url).replyOnce(500);
    s3Mock.onPut(S3_SINGLE_CHUNK_RESP.s3.request.url).replyOnce(200);

    let error;
    const upload = new Upload(blob, {
      $rest,
      parent: { _id: '123', _modelType: 'folder' },
    });
    try {
      await upload.start();
    } catch (err) {
      error = err;
    }
    expect(error).toBeInstanceOf(Error);
    expect((await upload.resume())._id).toBe('789');
  });

  it('fail and resume a multipart upload', async () => {
    let finalized = false;
    const upload = new Upload(blob, {
      $rest,
      parent: { _id: '123', _modelType: 'folder' },
    });

    mock.onPost('file').replyOnce(200, S3_MULTIPART_INIT_RESP);
    mock.onPost('file/chunk').reply(200, S3_MULTIPART_CHUNK_RESP);
    mock.onPost('file/completion').reply(() => {
      finalized = true;
      return [200, { _id: '789' }];
    });

    // Fail once at multipart initialization
    s3Mock.onPost(S3_MULTIPART_INIT_RESP.s3.request.url).replyOnce(500);
    s3Mock.onPost(S3_MULTIPART_INIT_RESP.s3.request.url).replyOnce(200, INIT_XML, {
      'Content-Type': 'text/xml',
    });

    // Fail once during a chunk upload
    s3Mock.onPut(S3_MULTIPART_CHUNK_RESP.s3.request.url).replyOnce(500);
    s3Mock.onPut(S3_MULTIPART_CHUNK_RESP.s3.request.url).replyOnce(200, {}, { etag: 'etag1' });
    s3Mock.onPut(S3_MULTIPART_CHUNK_RESP.s3.request.url).replyOnce(200, {}, { etag: 'etag2' });

    // Fail once at finalization
    s3Mock.onPost(S3_MULTIPART_FINALIZE_RESP.url).replyOnce(500);
    s3Mock.onPost(S3_MULTIPART_FINALIZE_RESP.url).replyOnce(({ data, headers }) => {
      // Validate the multipart complete XML spec
      const doc = new window.DOMParser().parseFromString(data, headers['Content-Type']);
      const parts = doc.querySelectorAll('CompleteMultipartUpload > Part > PartNumber');
      const etags = doc.querySelectorAll('CompleteMultipartUpload > Part > ETag');
      expect(parts.length).toBe(etags.length);
      expect(etags.length).toBe(2);
      expect([...parts].map((el) => el.textContent)).toEqual(['1', '2']);
      expect([...etags].map((el) => el.textContent)).toEqual(['etag1', 'etag2']);

      finalized = true;
      return [200];
    });

    let error = null;
    const expectError = (request) => {
      expect(error).toBeInstanceOf(Error);
      expect(error.config.url).toBe(request.url);
      expect(error.config.method.toLowerCase()).toBe(request.method.toLowerCase());
      error = null;
    };

    try {
      await upload.start();
    } catch (err) {
      error = err;
    }
    expectError(S3_MULTIPART_INIT_RESP.s3.request);

    try {
      await upload.resume();
    } catch (err) {
      error = err;
    }
    expectError(S3_MULTIPART_CHUNK_RESP.s3.request);

    try {
      await upload.resume();
    } catch (err) {
      error = err;
    }
    expectError(S3_MULTIPART_FINALIZE_RESP);

    // This one will now succeed
    expect((await upload.resume())._id).toBe('789');
    expect(finalized).toBe(true);
  });
});
