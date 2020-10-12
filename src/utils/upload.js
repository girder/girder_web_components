import UploadBase from './UploadBase';

export default class Upload extends UploadBase {
  /**
   * Represents an upload of a single file to the server.
   * @param {File | Blob} file the file to upload
   * @param {Object} opts upload options.
   * @param {Object} opts.$rest an axios instance used for communicating with Girder.
   * @param {Object} opts.parent upload destination. Must have ``id`` property.
   * @param {Function} opts.progress A progress callback for the upload. It can take an Object
   *   argument with either ``"indeterminate": true``, or numeric ``current`` and ``size`` fields.
   */
  constructor(file, {
    $rest,
    parent,
    progress = () => null,
  } = {}) {
    super(file, {
      $rest, parent, progress,
    });
  }

  async start() {
    const fd = new FormData();
    fd.append('blob', this.file);
    fd.append('name', this.file.name);
    fd.append('content_type', this.file.type);
    fd.append('folder', this.parent.id);
    return (await this.$rest.post('files', fd, {
      onUploadProgress: (e) => this.progress({
        indeterminate: !e.lengthComputable,
        current: e.loaded,
        size: e.total,
      }),
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })).data;
  }

  async resume() {
    return this.start();
  }
}
