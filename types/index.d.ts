import { VueConstructor } from 'vue/types/umd';
import Vue from 'vue/types';
import { Config } from 'vuetify/types';
import { AxiosInstance, AxiosResponse } from 'axios';

import './status';

declare module '@girder/components/src' {
  type GirderModelType = 'item' | 'folder' | 'file' | 'user' | 'collection';

  interface GirderModelBase {
    name: string;
    _id: string;
    _modelType: GirderModelType;
    created: string;
    updated: string;
    public: boolean;
    parentId?: string | null;
    meta: { [key: string]: any };
    [key: string]: any;
  }

  interface GirderModel extends GirderModelBase {
    baseParentType: GirderModelType;
    creatorId: string;
    description: string;
    parentCollection?: string;
  }

  interface GirderJob extends GirderModelBase {
    _accessLevel: number;
    status: number;
    args: any[];
    asynchronous: boolean;
    celeryTaskId: string;
    handler: string;
    interval: number;
    jobInfoSpec: any;
    kwargs: any;
  }

  interface GirderRestClientParams {
    apiRoot: string;
    token?: string;
    axios?: AxiosInstance;
    authenticateWithCredentials?: boolean;
    userGirderAuthorizationHeader?: boolean;
    setLocalCookie?: boolean;
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
    setLocalCookie: boolean;
    authenticateWithCredentials: boolean;
    useGirderAuthorizationHeader: boolean;
    user: GirderModel;
    token: string | null;

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
  const GirderBreadcrumb: VueConstructor;
  const GirderDataBrowser: VueConstructor;
  const GirderDataDetails: VueConstructor;
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
  const GirderDropzone: VueConstructor;
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

  export default function install(): Vue.PluginFunction<void>;
}
