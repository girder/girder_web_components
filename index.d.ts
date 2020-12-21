declare module '@girder/components' {
  import { AxiosInstance, AxiosResponse } from 'axios';
  import Vue from 'vue/types';
  import { VueConstructor } from 'vue/types/umd';
  import { Config } from 'vuetify/types';

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

  namespace components {
    const AccessControl: VueConstructor;
    const Authentication: VueConstructor;
    const Breadcrumb: VueConstructor;
    const DataBrowser: VueConstructor;
    const DataDetails: VueConstructor;
    const JobList: VueConstructor;
    const Markdown: VueConstructor;
    const MarkdownEditor: VueConstructor;
    const Search: VueConstructor;
    const Upload: VueConstructor;
    const UpsertFolder: VueConstructor;

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

  namespace snippets {
    const FileManager: VueConstructor;

    export {
      FileManager,
    };
  }

  namespace utils {
    interface Location {
      _modelType?: GirderModelType;
      _id?: string;
      type?: string;
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

    class Upload extends Vue {
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
      NotificationBus,
      Upload,
      createLocationValidator,
      getLocationType,
      getSingularLocationTypeName,
      isRootLocation,
      vuetifyConfig,
    };
  }

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

  namespace plugin {
    function install(): Vue.PluginFunction<void>;

    export {
      install
    };
  }

  export default plugin;

  export {
    RestClient,
    components,
    mixins,
    snippets,
    utils
  };
}
