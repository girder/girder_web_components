import S3FFClient, { S3FileFieldProgressState } from 'django-s3-file-field';
import UploadBase from './UploadBase';

export default class Upload extends UploadBase {
  constructor(file, opts) {
    super(file, opts);

    this.s3FFClient = new S3FFClient({
      baseUrl: `${opts.$rest.apiRoot}/s3-upload`,
      apiConfig: {
        headers: opts.$rest.defaults.headers.common,
      },
      onProgress: (e) => {
        if (e.state === S3FileFieldProgressState.Sending) {
          this.progress({
            current: e.uploaded,
            size: e.total,
          });
        } else if (e.state === S3FileFieldProgressState.Retrying) {
          this.progress({
            indeterminate: true,
            message: 'Request failed, retrying...',
            color: 'warning',
            current: 0,
            size: file.size,
          });
        } else {
          this.progress({
            indeterminate: true,
            current: e.state === S3FileFieldProgressState.Initializing ? 0 : file.size,
            size: file.size,
          });
        }
      },
    });
  }

  handleFileCreationError(response) {
    const data = response.data;
    if (data.name) {
      throw new Error(data.name[0]);
    } else if (data.size) {
      throw new Error(data.size[0]);
    } else if (data.__all__) {
      throw new Error(data.__all__[0]);
    } else {
      throw new Error('An unexpected error occured. See console for details.');
    }
  }

  async start() {
    let fileModel;
    let blobValue;

    try {
      fileModel = (await this.$rest.post('files', {
        name: this.file.name,
        content_type: this.file.type || 'application/octet-stream',
        size: this.file.size,
        folder: this.parent.id,
        ...this.fileParams,
      })).data;
    } catch (ex) {
      if (ex.response) {
        this.handleFileCreationError(ex.response);
      } else {
        throw new Error('Could not connect to the server.');
      }
    }

    try {
      blobValue = (await this.s3FFClient.uploadFile(this.file, 'core.File.blob')).value;
    } catch (ex) {
      console.error(ex);
      throw new Error('An error occurred when uploading to storage. See console for details.');
    }

    try {
      await this.$rest.patch(`files/${fileModel.id}`, { blob: blobValue });
    } catch (ex) {
      console.error(ex);
      throw new Error('Could not finalize file upload. See console for details.');
    }
    return fileModel;
  }
}
