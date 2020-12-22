import { VueConstructor } from 'vue/types/umd';

declare module '@girder/components' {
  import Vue from 'vue/types';
  import { Config } from 'vuetify/types';
  import { AxiosInstance, AxiosResponse } from 'axios';

  type GirderModelType = 'item' | 'folder' | 'file' | 'user';

  export interface GirderModel {
    name: string;
    _id: string;
    _modelType: GirderModelType;
    parentCollection?: string;
    parentId?: string;
    meta: unknown;
  }

  interface GirderRestClientParams {
    apiRoot: string;
    token?: string;
    axios?: AxiosInstance;
    authenticateWithCredentials?: boolean;
    userGirderAuthorizationHeader?: boolean;
    setLocalCokie?: boolean;
  }

  class RestClient extends Vue {
    constructor(params: GirderRestClientParams);

    fetchUser(): Promise<GirderModel>;

    login(username: string, password: string, opt: string | null): Promise<AxiosResponse>;

    logout(): void;

    register(
      login: string,
      email: string,
      firstName: string,
      lastName: string,
      password: string,
      admin: boolean,
    ): Promise<AxiosResponse>;

    apiRoot: string;

    // inherited from Axios
    defaults: AxiosInstance['defaults'];
    interceptors: AxiosInstance['interceptors'];
    getUri: AxiosInstance['getUri'];
    request: AxiosInstance['request'];
    delete: AxiosInstance['delete'];
    put: AxiosInstance['put'];
    get: AxiosInstance['get'];
    head: AxiosInstance['head'];
    options: AxiosInstance['options'];
    post: AxiosInstance['post'];
    patch: AxiosInstance['patch'];
  }

  interface Location {
    _modelType?: GirderModelType;
    _id?: string;
    type?: string;
  }

  /* Components */
  const GirderAccessControl: VueConstructor;
  const GirderAuthentication: VueConstructor;
  const GirderBreadcrumb: VueConstructor;
  const GirderDataBrowser: VueConstructor;
  const GirderDataDetails: VueConstructor;
  const GirderJobList: VueConstructor;
  const GirderMarkdown: VueConstructor;
  const GirderMarkdownEditor: VueConstructor;
  const GirderSearch: VueConstructor;
  const GirderUpload: VueConstructor;
  const GirderUpsertFolder: VueConstructor;
  /* Snippets */
  const GirderFileManager: VueConstructor;
  /* Presentation */
  const GirderDataTable: VueConstructor;
  const GirderDetailList: VueConstructor;
  const GirderDropZone: VueConstructor;
  const GirderFileUploadList: VueConstructor;
  /* Jobs */
  const GirderFilterForm: VueConstructor;
  const GirderJobList: VueConstructor;
  const GirderJobProgress: VueConstructor;
  const GirderJobTable: VueConstructor;
  /* Authentication */
  const GirderAuthentication: VueConstructor;
  const GirderLogin: VueConstructor;
  const GirderOAuth: VueConstructor;
  const GirderRegister: VueConstructor;

  namespace mixins {
    const accessLevelChecker: Record<string, unknown>;
    const dateFormatter: Record<string, unknown>;
    const fileUploader: Record<string, unknown>;
    const jobFormatter: Record<string, unknown>;
    const progressReporter: Record<string, unknown>;
    const sizeFormatter: Record<string, unknown>;
    const usernameFormatter: Record<string, unknown>;

    export {
      accessLevelChecker,
      dateFormatter,
      fileUploader,
      jobFormatter,
      progressReporter,
      sizeFormatter,
      usernameFormatter,
    };
  }

  class NotificationBus extends Vue {
    constructor(gr: RestClient, args?: {
      EventSource?: EventSource,
      listenToRestClient?: boolean,
      pollingInterval?: number[],
      since?: Date,
      useEventSource?: Boolean,
      withCredentials?: Boolean,
    });
    connect: () => void;
    disconnect: () => void;
    connected: boolean;
  }

  class UploadManager extends Vue {
    constructor(file: File, args?: {
      $rest: AxiosInstance,
      parent: Location,
      progress?: () => null,
      params?: Record<string, unknown>,
      chunkLen?: number,
    });
    start(): Promise<unknown>;
    resume(): Promise<unknown>;
  }

  function createLocationValidator(allowRoot: boolean): (location: Location) => boolean;
  function getLocationType(location: Location): string;
  function getSingularLocationTypeName(location: Location): 'collection' | 'user' | '';
  function isRootLocation(location: Location): boolean;

  const vuetifyConfig: Config;

  export {
    mixins,
    NotificationBus,
    UploadManager,
    createLocationValidator,
    getLocationType,
    getSingularLocationTypeName,
    isRootLocation,
    vuetifyConfig,
    RestClient,
    // Components
    GirderAccessControl,
    GirderAuthentication,
    GirderBreadcrumb,
    GirderDataBrowser,
    GirderDataDetails,
    GirderJobList,
    GirderMarkdown,
    GirderMarkdownEditor,
    GirderSearch,
    GirderUpload,
    GirderUpsertFolder,
    // Snippets
    GirderFileManager,
    // Presentation
    GirderDataTable,
    GirderDetailList,
    GirderDropZone,
    GirderFileUploadList,
    // Job
    GirderFilterForm,
    GirderJobList,
    GirderJobProgress,
    GirderJobTable,
    // Authentication
    GirderAuthentication,
    GirderLogin,
    GirderOAuth,
    GirderRegister,
  };
    
  function install(): Vue.PluginFunction<void>;

  export default install;
}
