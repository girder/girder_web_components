import { reactive, computed, watch, toRefs } from 'vue';
import UploadManager from '@/utils/uploadManager';
import { progressPercent } from '@/utils';

export default function usefileUploader({ girderRest, onFilesChanged, onError, onDone }) {
  const state = reactive({
    files: [],
    uploading: false,
    indeterminate: false,
    errorMessage: null,
  });

  // watch files -> callback
  watch(() => state.files, (val) => onFilesChanged?.(val), { deep: true });

  // computed properties
  const totalProgress = computed(() => state.files.reduce((v, f) => f.progress.current + v, 0));
  const totalSize = computed(() => state.files.reduce((v, f) => f.file.size + v, 0));
  const totalProgressPercent = computed(() => progressPercent({ current: totalProgress.value, total: totalSize.value }));

  // methods
  function reset() {
    state.files = [];
    state.uploading = false;
    state.indeterminate = false;
    state.errorMessage = null;
  }

  function inputFilesChanged(files) {
    state.files = files.map(file => ({
      file,
      status: 'pending',
      progress: { current: 0, indeterminate: false, size: file.size },
      upload: null,
      result: null,
      uploadClsParams: {},
    }));
  }

  function setFiles(files) {
    state.files = files;
  }

  async function uploadFile({ file, hookResult, dest, uploadCls }) {
    let chain = Promise.resolve();
    if (file.status === 'done') {return chain.then(() => file.result);}

    const progress = (event) => { file.progress = event; };
    file.status = 'uploading';
    file.progress.indeterminate = true;

    if (file.upload) {
      chain = chain.then(() => file.upload.resume());
    } else {
      file.upload = new uploadCls(file.file, {
        $rest: girderRest,
        parent: hookResult?.dest || dest,
        progress,
        params: file.uploadClsParams,
      });
      chain = chain.then(() => file.upload.beforeUpload()).then(() => file.upload.start());
    }

    return chain
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
        state.errorMessage = error.response?.data?.message || 'Connection failed.';
        file.status = 'error';
        state.uploading = false;
        onError?.({ error, file });
        throw error;
      });
  }

  async function start({ dest, preUpload = async () => {}, postUpload = async () => {}, uploadCls = UploadManager }) {
    state.uploading = true;
    state.indeterminate = true;
    state.errorMessage = null;

    const hookResult = await preUpload();
    state.indeterminate = false;

    const results = [];
    let i = 0;
    const WORKERS = 5;
    const pool = new Array(WORKERS).fill(0);

    await Promise.all(
      pool.map(async () => {
        while (i < state.files.length) {
          const file = state.files[i];
          i += 1;
          results.push(await uploadFile({ file, hookResult, dest, uploadCls }));
        }
      })
    );

    state.indeterminate = true;
    await postUpload({ results });
    state.indeterminate = false;
    state.uploading = false;
    state.files = [];

    onDone?.(results);
    return results;
  }

  return {
    ...toRefs(state),
    totalProgress,
    totalSize,
    totalProgressPercent,
    reset,
    inputFilesChanged,
    setFiles,
    uploadFile,
    start,
  };
}