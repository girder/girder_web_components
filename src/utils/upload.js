import { stringify } from 'qs';
import S3Upload from './s3';

const UPLOAD_CHUNK_SIZE = 1024 * 1024 * 64;
const uploadBehaviors = { s3: S3Upload };

export default class Upload {
  /**
   * Represents an upload of a single file to the server.
   * @param file {File | Blob} the file to upload
   * @param opts {Object} upload options.
   * @param opts.$rest {Object} an axios instance used for communicating with Girder.
   * @param opts.parent {Object} upload destination. Must have ``_id`` and ``_modelType``.
   * @param opts.progress {Function} A progress callback for the upload. It will receive an Object
   *   argument with either ``"indeterminate": true``, or numeric ``current`` and ``total`` fields.
   * @param opts.params {Object} Additional parameters to pass on the upload init request.
   * @param opts.chunkLen {Number} Chunk size for sending the file (integer number of bytes).
   */
  constructor(file, {
    $rest,
    parent,
    progress = () => null,
    params = {},
    chunkLen = UPLOAD_CHUNK_SIZE,
  } = {}) {
    Object.assign(this, {
      $rest, file, params, parent, progress, chunkLen, upload: null, offset: 0, behavior: null,
    });
  }

  async _sendChunks() {
    const onUploadProgress = e => this.progress({
      current: this.offset + e.loaded,
      indeterminate: !e.lengthComputable,
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

  /**
   * Start the upload. The returned Promise will be resolved with the Girder file that was created
   * or rejected with an ``Error`` that has ``config``, ``request``, and ``response`` properties.
   */
  async start() {
    this.progress({ indeterminate: true });
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

  // eslint-disable-next-line class-methods-use-this
  beforeUpload() {}

  // eslint-disable-next-line class-methods-use-this
  afterUpload() {}

  // eslint-disable-next-line class-methods-use-this
  onError() {}
}
