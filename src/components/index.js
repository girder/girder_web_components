import Vue from 'vue';

import GirderAccessControl from './AccessControl.vue';
import GirderBreadcrumb from './Breadcrumb.vue';
import GirderDataBrowser from './DataBrowser.vue';
import GirderDataDetails from './DataDetails.vue';
import GirderMarkdown from './Markdown.vue';
import GirderMarkdownEditor from './MarkdownEditor.vue';
import GirderSearch from './Search.vue';
import GirderUpload from './Upload.vue';
import GirderUpsertFolder from './UpsertFolder.vue';
import { GirderJobList } from './Job';
import { GirderAuthentication } from './Authentication';
import { GirderFileManager } from './snippets';

function registerComponents() {
  Vue.component('girder-access-control', GirderAccessControl);
  Vue.component('girder-breadcrumb', GirderBreadcrumb);
  Vue.component('girder-data-browser', GirderDataBrowser);
  Vue.component('girder-data-details', GirderDataDetails);
  Vue.component('girder-markdown', GirderMarkdown);
  Vue.component('girder-markdown-editor', GirderMarkdownEditor);
  Vue.component('girder-search', GirderSearch);
  Vue.component('girder-upload', GirderUpload);
  Vue.component('girder-upsert-folder', GirderUpsertFolder);
  Vue.component('girder-job-list', GirderJobList);
  Vue.component('girder-authentication', GirderAuthentication);
  Vue.component('girder-file-manager', GirderFileManager);
}

export * from './Job';
export * from './Authentication';
export * from './Presentation';
export {
  registerComponents,
  GirderAccessControl,
  GirderBreadcrumb,
  GirderDataBrowser,
  GirderDataDetails,
  GirderMarkdown,
  GirderMarkdownEditor,
  GirderSearch,
  GirderUpload,
  GirderUpsertFolder,
};
