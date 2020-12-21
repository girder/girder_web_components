declare module '@girder/components/src/components' {

  export {
    AccessControl,
    Authentication,
    Breadcrumb,
    DataBrowser,
    DataDetails,
    JobList,
    Markdown,
    MarkdownEditor,
    Search,
    Upload,
    UpsertFolder,
  };
}

declare module '@girder/components/src/snippets' {
  import { VueConstructor } from 'vue/types/umd';

  const FileManager: VueConstructor;

  export {
    FileManager,
  };
}
