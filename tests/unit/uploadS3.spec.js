import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { expect } from 'chai';
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
  const rc = new RestClient();
  const mock = new MockAdapter(rc);
  const s3Mock = new MockAdapter(axios);
  const blob = new Blob(['hello world'], { type: 'text/plain' });
  blob.name = 'hello.txt';

  afterEach(() => {
    mock.reset();
    s3Mock.reset();
  });

  after(() => {
    s3Mock.restore();
  });

  it('successfully upload a single chunk upload', async () => {
    mock.onPost('file').replyOnce(200, S3_SINGLE_CHUNK_RESP);
    mock.onPost('file/completion').replyOnce(200, { _id: '789' });
    s3Mock.onPut(S3_SINGLE_CHUNK_RESP.s3.request.url).replyOnce(({ headers }) => {
      expect(headers).to.have.own.property('x-amz-acl').that.equals('private');
      return [200];
    });

    const upload = new Upload(rc, blob, { _id: '123', _modelType: 'folder' });
    expect((await upload.start())._id).to.equal('789');
  });

  it('fail and resume a single-chunk upload', async () => {
    mock.onGet(/file\/offset/).replyOnce(200, S3_SINGLE_CHUNK_RESP.s3.request);
    mock.onPost('file').replyOnce(200, S3_SINGLE_CHUNK_RESP);
    mock.onPost('file/completion').replyOnce(200, { _id: '789' });
    s3Mock.onPut(S3_SINGLE_CHUNK_RESP.s3.request.url).replyOnce(500);
    s3Mock.onPut(S3_SINGLE_CHUNK_RESP.s3.request.url).replyOnce(200);

    let error;
    const upload = new Upload(rc, blob, { _id: '123', _modelType: 'folder' });
    try {
      await upload.start();
    } catch (e) {
      error = e;
    }
    expect(error).to.be.an('Error');
    expect((await upload.resume())._id).to.equal('789');
  });

  it('fail and resume a multipart upload', async () => {
    let finalized = false;
    const upload = new Upload(rc, blob, { _id: '123', _modelType: 'folder' });

    mock.onPost('file').replyOnce(200, S3_MULTIPART_INIT_RESP);
    mock.onPost('file/chunk').reply(200, S3_MULTIPART_CHUNK_RESP);
    mock.onPost('file/completion').reply(200, {
      _id: '789',
      s3FinalizeRequest: S3_MULTIPART_FINALIZE_RESP,
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
      expect(parts.length).to.equal(etags.length).to.equal(2);
      expect([...parts].map(el => el.textContent)).to.eql(['1', '2']);
      expect([...etags].map(el => el.textContent)).to.eql(['etag1', 'etag2']);

      finalized = true;
      return [200];
    });

    let error = null;
    const expectError = (request) => {
      expect(error).to.be.an('Error');
      expect(error.config.url).to.equal(request.url);
      expect(error.config.method.toLowerCase()).to.equal(request.method.toLowerCase());
      error = null;
    };

    try {
      await upload.start();
    } catch (e) {
      error = e;
    }
    expectError(S3_MULTIPART_INIT_RESP.s3.request);

    try {
      await upload.resume();
    } catch (e) {
      error = e;
    }
    expectError(S3_MULTIPART_CHUNK_RESP.s3.request);

    try {
      await upload.resume();
    } catch (e) {
      error = e;
    }
    expectError(S3_MULTIPART_FINALIZE_RESP);

    // This one will now succeed
    expect((await upload.resume())._id).to.equal('789');
    expect(finalized).to.equal(true);
  });
});
