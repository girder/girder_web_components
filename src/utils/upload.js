import { stringify } from 'qs';

import S3UploadManager from './s3';
import UploadBase from './UploadBase';

const UPLOAD_CHUNK_SIZE = 1024 * 1024 * 64;
const uploadBehaviors = { s3: S3UploadManager };

export default class UploadManager extends UploadBase {
  /**
   * Represents an upload of a single file to the server.
   * @param {File | Blob} file the file to upload
   * @param {Object} opts upload options.
   * @param {Object} opts.$rest an axios instance used for communicating with Girder.
   * @param {Object} opts.parent upload destination. Must have ``_id`` and ``_modelType``.
   * @param {Function} opts.progress A progress callback for the upload. It can take an Object
   *   argument with either ``"indeterminate": true``, or numeric ``current`` and ``size`` fields.
   * @param {Object} opts.params Additional parameters to pass on the upload init request.
   * @param {Number} opts.chunkLen Chunk size for sending the file (integer number of bytes).
   */
  constructor(file, {
    $rest,
    parent,
    progress = () => null,
    params = {},
    chunkLen = UPLOAD_CHUNK_SIZE,
  } = {}) {
    super(file, {
      $rest, parent, progress,
    });
    Object.assign(this, {
      params, chunkLen, upload: null, offset: 0, behavior: null,
    });
  }

  async _sendChunks() {
    const onUploadProgress = (e) => this.progress({
      indeterminate: !e.lengthComputable,
      current: this.offset + e.loaded,
      size: this.file.size,
    });

    while (this.offset < this.file.size) {
      const end = Math.min(this.offset + this.chunkLen, this.file.size);
      const blob = this.file.slice(this.offset, end);
      const url = `file/chunk?offset=${this.offset}&uploadId=${this.upload._id}`;
      // eslint-disable-next-line no-await-in-loop
      this.upload = (await this.$rest.post(url, blob, {
        onUploadProgress,
        headers: { 'Content-Type': 'application/octet-stream' },
      })).data;
      this.offset = end;
    }
    return this.upload;
  }

  async start() {
    this.upload = (await this.$rest.post('/file', stringify({
      parentType: this.parent._modelType,
      parentId: this.parent._id,
      name: this.file.name,
      size: this.file.size,
      mimeType: this.file.type,
      ...this.params,
    }))).data;

    if (this.upload.behavior && uploadBehaviors[this.upload.behavior]) {
      this.behavior = new uploadBehaviors[this.upload.behavior](this);
      return this.behavior.start();
    }
    return this._sendChunks();
  }

  async resume() {
    if (!this.upload) {
      return this.start();
    }

    this.progress({ indeterminate: true });

    if (this.behavior) {
      return this.behavior.resume();
    }
    this.offset = (await this.$rest.get(`file/offset?uploadId=${this.upload._id}`)).data.offset;
    return this._sendChunks();
  }
}
