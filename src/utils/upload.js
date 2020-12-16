import S3FFClient from 'django-s3-file-field';
import UploadBase from './UploadBase';

export default class Upload extends UploadBase {
  constructor(file, opts) {
    super(file, opts);
    this.s3FFClient = new S3FFClient(`${opts.$rest.apiRoot}/s3-upload`);
  }

  async start() {
    // TODO progress
    const { value } = await this.s3FFClient.uploadFile(this.file, 'core.File.blob');

    return (await this.$rest.post('files', {
      name: this.file.name,
      content_type: this.file.type,
      blob: value,
      folder: this.parent.id,
    })).data;
  }
}
