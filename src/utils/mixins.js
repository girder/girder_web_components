import moment from 'moment';

import { AccessType } from '../constants';
import * as jobstatus from '../components/Job/status';
import UploadManager from './upload';

/**
 * for components that need to show a locale-formatted date
 */
const dateFormatter = {
  methods: {
    formatDate(datestring) {
      const d = new Date(datestring);
      return d.toLocaleString();
    },
  },
};

/**
 * Any view component that needs to display human-readable data sizes should use this.
 */
const sizeFormatter = {
  methods: {
    formatSize(size, { base = 1024, unit = 'B' } = {}) {
      if (size < base) {
        return `${size} ${unit}`;
      }

      let i;
      let val = size;
      for (i = 0; val >= base && i < 4; i += 1) {
        val /= base;
      }

      return `${val.toFixed(2)}  ${['', 'K', 'M', 'G', 'T'][i]}${unit}`;
    },
  },
};

/**
 * This mixin exposes helper methods for components that need to check that the current user has
 * a certain access level on a given resource.
 */
const accessLevelChecker = {
  methods: {
    hasWriteAccess: (resource) => resource._accessLevel >= AccessType.WRITE,
    hasAdminAccess: (resource) => resource._accessLevel >= AccessType.ADMIN,
  },
};

/**
 * Convert file progress properties to percent.
 */
const progressReporter = {
  methods: {
    progressPercent(progress) {
      if (!progress.total) {
        return 0;
      }
      return Math.round((100 * (progress.current || 0)) / progress.total);
    },
  },
};

/**
 * For components that need to show a full formatted username
 */
const usernameFormatter = {
  methods: {
    formatUsername(user) {
      return `${user.firstName} ${user.lastName} (${user.login})`;
    },
  },
};

/**
 * A mixin to generically fetch display properties
 * from a girder_jobs.Job schema'd json object.
 */
const jobFormatter = {
  methods: {
    progressAsNumber(progress) {
      if (!progress) {
        return 100;
      }
      return 100 * (progress.current / progress.total);
    },
    formatJob(job) {
      const statusDef = { text: 'Unknown', ...jobstatus.getByValue(job.status) };
      return {
        statusText: statusDef.text,
        statusColor: statusDef.color,
        statusTextColor: statusDef.textColor || 'white',
        statusIcon: statusDef.icon,
        updateString: moment(job.updated).format('dddd, MMMM D, YYYY @ h:mm a'),
        progressNumber: this.progressAsNumber(job.progress),
        indeterminate: statusDef.indeterminate,
        class: statusDef.class,
        ...job,
      };
    },
  },
};

/**
 * A mixin to allow components to maintan a list of files for upload.
 * The consumer is responsible for how the file list is populated, but
 * the helper methods `inputFilesChanged` and `setFiles` must be used
 * rather than setting `this.files` directly.
 */
const fileUploader = {
  inject: ['girderRest'],

  data() {
    return {
      errorMessage: null,
      files: [],
      uploading: false,
      indeterminate: false,
    };
  },

  watch: {
    files(val) {
      this.$emit('filesChanged', val);
    },
  },

  computed: {
    totalProgress() {
      return this.files.reduce((v, f) => v + (f.progress.current), 0);
    },
    totalSize() {
      return this.files.reduce((v, f) => v + f.file.size, 0);
    },
    totalProgressPercent() {
      return this.progressPercent({
        current: this.totalProgress,
        total: this.totalSize,
      });
    },
  },

  methods: {
    reset() {
      this.files = [];
      this.errorMessage = null;
      this.uploading = false;
      this.indeterminate = false;
    },

    /**
     * Populate the internal list of files from an HTML FileList
     * @param {FileList} files from an input element
     */
    inputFilesChanged(files) {
      this.files = files.map((file) => ({
        file,
        status: 'pending',
        progress: {
          indeterminate: false,
          current: 0,
          size: file.size,
        },
        upload: null,
        result: null,
        uploadClsParams: {},
      }));
    },

    /**
     * Set internal state from an array of existing file objects.
     * Differs from `inputFileChanged` because the input array should already be a wrapped
     * object array with the additional state added by that function.
     * @param {Array<Object>} files new file list
     */
    setFiles(files) {
      this.files = files;
    },

    uploadFile({
      file,
      hookResult,
      dest,
      uploadCls,
    }) {
      let promiseChain = Promise.resolve();
      if (file.status === 'done') {
        // We are resuming, skip already completed files
        return promiseChain.then(() => file.result);
      }
      const progress = (event) => {
        this.$set(file, 'progress', event);
      };
      file.status = 'uploading';
      file.progress.indeterminate = true;
      if (file.upload) {
        promiseChain = promiseChain.then(() => file.upload.resume());
      } else {
        // eslint-disable-next-line new-cap
        file.upload = new uploadCls(file.file, {
          $rest: this.girderRest,
          parent: (hookResult && hookResult.dest) ? hookResult.dest : dest,
          progress,
          params: file.uploadClsParams,
        });
        promiseChain = promiseChain
          .then(() => file.upload.beforeUpload())
          .then(() => file.upload.start());
      }
      return promiseChain
        .then(async (result) => {
          await file.upload.afterUpload();
          delete file.upload;
          file.status = 'done';
          file.progress.current = file.file.size;
          result.file = file.file;
          return result;
        })
        .catch(async (error) => {
          await file.upload.onError(error);
          if (error.response) {
            this.errorMessage = error.response.data.message || 'An error occurred during upload.';
          } else {
            this.errorMessage = 'Connection failed.';
          }
          file.status = 'error';
          this.uploading = false;
          this.$emit('error', { error, file });
          throw error;
        });
    },

    /**
     * Begin uploading the current list of files.
     */
    async start({
      dest,
      preUpload = async () => {},
      postUpload = async () => {},
      uploadCls = UploadManager,
    }) {
      this.uploading = true;
      this.indeterminate = true;
      this.errorMessage = null;
      const hookResult = await preUpload();
      this.indeterminate = false;
      const results = [];
      let i = 0;
      const WORKER_POOL_SIZE = 5;
      const workerPool = [...new Array(WORKER_POOL_SIZE)];
      await Promise.all(workerPool.map(async () => {
        while (i < this.files.length) {
          const file = this.files[i];
          i += 1;
          // eslint-disable-next-line no-await-in-loop
          results.push(await this.uploadFile({
            file, hookResult, dest, uploadCls,
          }));
        }
      }));

      this.indeterminate = true;
      await postUpload({ results });
      this.indeterminate = false;
      this.uploading = false;
      this.files = [];
      this.$emit('done', results);
    },
  },
};

export {
  accessLevelChecker,
  dateFormatter,
  fileUploader,
  jobFormatter,
  progressReporter,
  sizeFormatter,
  usernameFormatter,
};
