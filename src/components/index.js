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
  Vue.component('GirderAccessControl', GirderAccessControl);
  Vue.component('GirderBreadcrumb', GirderBreadcrumb);
  Vue.component('GirderDataBrowser', GirderDataBrowser);
  Vue.component('GirderDataDetails', GirderDataDetails);
  Vue.component('GirderMarkdown', GirderMarkdown);
  Vue.component('GirderMarkdownEditor', GirderMarkdownEditor);
  Vue.component('GirderSearch', GirderSearch);
  Vue.component('GirderUpload', GirderUpload);
  Vue.component('GirderUpsertFolder', GirderUpsertFolder);
  Vue.component('GirderJobList', GirderJobList);
  Vue.component('GirderAuthentication', GirderAuthentication);
  Vue.component('GirderFileManager', GirderFileManager);
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
