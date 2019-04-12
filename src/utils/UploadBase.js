export default class UploadBase {
  /**
   * The abstract base class of a single file uploader.
   * @abstract
   * @param {File | Blob} file the file to upload
   * @param {Object} opts upload options.
   * @param {Object} opts.$rest an axios instance used for communicating with Girder.
   * @param {Object} opts.parent upload destination. Must have ``_id`` and ``_modelType``.
   * @param {Function} opts.progress A progress callback for the upload. It can take an Object
   *   argument with either ``"indeterminate": true``, or numeric ``current`` and ``size`` fields.
   */
  constructor(
    file,
    {
      $rest,
      parent,
      progress = () => null,
    } = {},
  ) {
    Object.assign(this, {
      $rest,
      file,
      parent,
      progress,
    });
  }

  /**
   * Start the upload. The returned Promise will be resolved with the Girder file that was created
   * or rejected with an ``Error`` that has ``config``, ``request``, and ``response`` properties.
   * @abstract
   */
  async start() { // eslint-disable-line class-methods-use-this
    throw new Error('not implemented');
  }

  /**
   * If an error has been encountered, when user clicks the Resume button,
   * this ``resume()`` will be called. The simplest implementation is to call ``start()`` directly.
   */
  async resume() {
    return this.start();
  }

  /**
   * This callback is called before the upload is started. This callback is asynchronous.
   * If it returns a Promise, the caller will await its resolution before continuing.
   */
  // eslint-disable-next-line class-methods-use-this, no-unused-vars
  beforeUpload() {}

  /**
   * This callback is called after the upload is completed. This callback is asynchronous.
   * If it returns a Promise, the caller will await its resolution before continuing.
   */
  // eslint-disable-next-line class-methods-use-this, no-unused-vars
  afterUpload() {}

  /**
   * This callback is called if an error occurs during the upload. This callback is asynchronous.
   * If it returns a Promise, the caller will await its resolution before continuing.
   * @param {Exception} error The exception object.
   */
  // eslint-disable-next-line class-methods-use-this, no-unused-vars
  onError(error) {}
}
