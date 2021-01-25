import S3FFClient, { ProgressState } from 'django-s3-file-field';
import UploadBase from './UploadBase';

export default class Upload extends UploadBase {
  constructor(file, opts) {
    super(file, opts);
    this.s3FFClient = new S3FFClient(`${opts.$rest.apiRoot}/s3-upload`, (e) => {
      if (e.state === ProgressState.Sending) {
        this.progress({
          current: e.uploaded,
          size: e.total,
        });
      } else {
        this.progress({
          indeterminate: true,
          current: e.state === ProgressState.Initializing ? 0 : file.size,
          size: file.size,
        });
      }
    });
  }

  async start() {
    const { value } = await this.s3FFClient.uploadFile(this.file, 'core.File.blob');

    try {
      return (await this.$rest.post('files', {
        name: this.file.name,
        content_type: this.file.type || 'application/octet-stream',
        blob: value,
        folder: this.parent.id,
      })).data;
    } catch (ex) {
      if (ex.response) {
        const data = ex.response.data;
        // Are there any other categories of validation errors besides __all__?
        if (data.__all__) {
          throw new Error(data.__all__[0]);
        } else {
          console.error(ex);
          throw new Error('An unexpected error occured. See console for details.');
        }
      } else {
        throw new Error('Could not connect to the server.');
      }
    }
  }
}
