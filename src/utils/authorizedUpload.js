import Upload from './upload';

export default class AuthorizedUpload extends Upload {
    constructor(file, opts) {
        super(file, opts);
        this.fileParams = {
            authorization: this.parent.authorization,
            description: this.parent.description,
            user_metadata: {
                'Uploader email': this.parent.email,
            },
        };
    }

    handleFileCreationError(response) {
        const data = response.data;
        if (data.authorization) {
            throw new Error(data.authorization[0]);
        }
        if (data.detail) {
            throw new Error(data.detail);
        }
        super.handleFileCreationError(response);
    }
}
