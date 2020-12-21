declare module '@girder/components/src' {
  import { AxiosInstance, AxiosResponse } from 'axios';
  import Vue, { Component } from 'vue';

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

  const AccessControl: Component;
  const Authentication: Component;
  const Breadcrumb: Component;
  const DataBrowser: Component;
  const DataDetails: Component;
  const Markdown: Component;
  const MarkdownEditor: Component;
  const Search: Component;
  const Upload: Component;
  const UpsertFolder: Component;

  const components = {
    AccessControl,
    Authentication,
    Breadcrumb,
    DataBrowser,
    DataDetails,
    Markdown,
    MarkdownEditor,
    Search,
    Upload,
    UpsertFolder,
  };

  interface Location {
    _modelType?: GirderModelType;
    _id?: string;
    type?: string;
  }
  
  function createLocationValidator(allowRoot: boolean): (location: Location) => boolean { }
  function getLocationType(location: Location): string { }
  function getSingularLocationTypeName(location: Location): 'collection' | 'user' | '' { }
  function isRootLocation(location: Location): boolean { }

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
    async start(): Promise<unknown>;
    async resume(): Promise<unknown>;
  }

  const utils = {
    createLocationValidator,
    getLocationType,
    getSingularLocationTypeName,
    isRootLocation,
    NotificationBus,
    Upload,
  };

  interface GirderPlugin {
    install: Vue.PluginFunction<void>;
  }

  const plugin: GirderPlugin;

  export { RestClient, components, utils };
  export default plugin;
}


  DebounceCounter,
  vuetifyConfig,
  Upload,
  createLocationValidator,
  getLocationType,
  isRootLocation,
  getSingularLocationTypeName,
