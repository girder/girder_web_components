import axios from 'axios';
import { stringify } from 'qs';

export default class S3UploadManager {
  constructor(base) {
    Object.assign(this, base, { etags: {}, offset: 0, partNumber: 1 });
  }

  _finalizeMultipartXml() {
    const doc = document.implementation.createDocument(null, null, null);
    const root = doc.createElement('CompleteMultipartUpload');

    Object.entries(this.etags).forEach(([part, etag]) => {
      const partEl = doc.createElement('Part');
      const partNumberEl = doc.createElement('PartNumber');
      const etagEl = doc.createElement('ETag');

      partNumberEl.appendChild(doc.createTextNode(part));
      etagEl.appendChild(doc.createTextNode(etag));
      partEl.appendChild(partNumberEl);
      partEl.appendChild(etagEl);
      root.appendChild(partEl);
    });
    return root.outerHTML;
  }

  async complete() {
    this.progress({
      indeterminate: true,
      current: this.file.size,
      total: this.file.size,
    });
    return this.$rest.post('file/completion', stringify({ uploadId: this.upload._id }));
  }

  async _multiChunkUpload() {
    const { headers, method, url } = this.upload.s3.request;
    const resp = await axios.request({
      data: null, headers, method, url,
    });
    const xml = new DOMParser().parseFromString(resp.data, 'text/xml');
    this.upload.s3.uploadId = xml.querySelector('InitiateMultipartUploadResult > UploadId').textContent;
    return this._sendChunks();
  }

  async _sendChunks() {
    const onUploadProgress = (e) => this.progress({
      current: this.offset + e.loaded,
      total: this.file.size,
      indeterminate: !e.lengthComputable,
    });

    while (this.offset < this.file.size) {
      const blob = this.file.slice(this.offset, this.offset + this.upload.s3.chunkLength);
      // eslint-disable-next-line no-await-in-loop
      const { method, url } = (await this.$rest.post('file/chunk', stringify({
        chunk: JSON.stringify({
          contentLength: blob.size,
          partNumber: this.partNumber,
          s3UploadId: this.upload.s3.uploadId,
        }),
        offset: 0,
        uploadId: this.upload._id,
      }))).data.s3.request;

      // eslint-disable-next-line no-await-in-loop
      const resp = await axios.request({
        data: blob, method, url, onUploadProgress,
      });
      this.etags[this.partNumber] = resp.headers.etag;
      this.partNumber += 1;
      this.offset += blob.size;
    }
    const resp = await this.complete();
    const { headers, method, url } = resp.data.s3FinalizeRequest;
    await axios.request({
      data: this._finalizeMultipartXml(), headers, method, url,
    });
    return resp.data;
  }

  async start() {
    if (this.upload.s3.chunked) {
      return this._multiChunkUpload();
    }
    const { headers, method, url } = this.upload.s3.request;
    await axios.request({
      data: this.file,
      headers,
      method,
      url,
      onUploadProgress: (e) => this.progress({
        current: e.loaded,
        total: this.file.size,
        indeterminate: !e.lengthComputable,
      }),
    });
    return (await this.complete()).data;
  }

  async resume() {
    if (this.upload.s3.chunked) {
      return this._sendChunks();
    }
    this.upload.s3.request = (await this.$rest.get(`file/offset?uploadId=${this.upload._id}`)).data;
    return this.start();
  }
}
