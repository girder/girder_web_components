import axios from 'axios';
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
    fd.append('folder', this.parent.id);
    // problem 1: host (we can fix this with another env var, but somewhat annoying)
    // problem 2: CSRF token required. Even if just a cookie was allowed, then we are in cors land and the default cors settings don't work
    // problem 3: we can't get human-readable output from this endpoint even if we request it. Always comes back HTML
    return (await axios.post('http://localhost:8000/admin/core/file/add/', fd, {
      withCredentials: true,
      onUploadProgress: (e) => this.progress({
        indeterminate: !e.lengthComputable,
        current: e.loaded,
        size: e.total,
      }),
      headers: {
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json',
      },
    })).data;
  }

  async resume() {
    return this.start();
  }
}
