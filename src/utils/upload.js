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

    return (await this.$rest.post('files', {
      name: this.file.name,
      content_type: this.file.type,
      blob: value,
      folder: this.parent.id,
    })).data;
  }
}
