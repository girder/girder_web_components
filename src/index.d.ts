import { DefineComponent, Plugin } from 'vue'
import { AxiosInstance, AxiosResponse } from 'axios'

export type GirderModelType = 'item' | 'folder' | 'file' | 'user' | 'collection'

export interface GirderModelBase {
  name: string
  _id: string
  _modelType: GirderModelType
  created: string
  updated: string
  public: boolean
  parentId?: string | null
  meta: { [key: string]: any }
  [key: string]: any
}

export interface GirderModel extends GirderModelBase {
  baseParentType: GirderModelType
  creatorId: string
  description: string
  parentCollection?: string
}

export interface GirderRestClientParams {
  apiRoot: string
  token?: string
  axios?: AxiosInstance
  authenticateWithCredentials?: boolean
  userGirderAuthorizationHeader?: boolean
  setLocalCookie?: boolean
}

export interface Location {
  _modelType?: GirderModelType
  _id?: string
  type?: string
}

export interface FormatSizeOptions {
  base?: number
  unit?: string
}

export interface ProgressPercentOptions {
  current?: number
  total?: number
}

export interface Resource {
  _modelType: GirderModelType | string
  public?: boolean
}

export interface S3Upload {
  chunked: boolean
  chunkLength: number
  uploadId?: string
  request: S3UploadRequest
}

export interface Upload {
  _id: string
  s3: S3Upload
}

export interface ProgressArgs {
  current: number
  total: number
  indeterminate?: boolean
}

export interface S3UploadManagerOptions {
  file: File
  upload: Upload
  $rest: AxiosInstance
  progress?: (args: ProgressArgs) => void
}

export const GirderAuthentication: DefineComponent
export const GirderLogin: DefineComponent
export const GirderOAuth: DefineComponent
export const GirderRegister: DefineComponent

export const GirderDataBrowser: DefineComponent
export const GirderDataTable: DefineComponent

export const GirderDataDetails: DefineComponent
export const GirderDetailList: DefineComponent

export const GirderMarkdown: DefineComponent
export const GirderMarkdownEditor: DefineComponent

export const GirderUpload: DefineComponent
export const GirderDropzone: DefineComponent
export const GirderFileUploadList: DefineComponent

export const GirderAccessControl: DefineComponent
export const GirderBreadcrumb: DefineComponent
export const GirderFileManager: DefineComponent
export const GirderSearch: DefineComponent
export const GirderUpsertFolder: DefineComponent

export const GoogleIcon: DefineComponent
export const GirderBreadcrumb: DefineComponent
export const GirderFileManager: DefineComponent
export const GirderSearch: DefineComponent
export const GirderUpsertFolder: DefineComponent


export class RestClient {
  constructor(params: GirderRestClientParams)

  fetchUser(): Promise<GirderModel>
  login(username: string, password: string, opt: string | null): Promise<AxiosResponse>
  logout(): void
  setApiRoot(): void
  register(
    login: string,
    email: string,
    firstName: string,
    lastName: string,
    password: string,
    admin: boolean,
  ): Promise<AxiosResponse>

  apiRoot: string
  setLocalCookie: boolean
  authenticateWithCredentials: boolean
  useGirderAuthorizationHeader: boolean
  user: GirderModel
  token: string | null

  interceptors: AxiosInstance['interceptors']
  request: AxiosInstance['request']
  delete: AxiosInstance['delete']
  put: AxiosInstance['put']
  get: AxiosInstance['get']
  post: AxiosInstance['post']
  patch: AxiosInstance['patch']
}

export class NotificationBus {
  constructor(
    gr: RestClient,
    args?: {
      EventSource?: EventSource
      listenToRestClient?: boolean
      pollingInterval?: number[]
      since?: Date
      useEventSource?: boolean
      withCredentials?: boolean
    }
  )

  connect(): void
  disconnect(): void
  connected: boolean
}

export class UploadManager {
  constructor(
    file: File,
    args?: {
      $rest: AxiosInstance
      parent: Location
      progress?: () => null
      params?: Record<string, unknown>
      chunkLen?: number
    }
  )

  start(): Promise<unknown>
  resume(): Promise<unknown>
}

export class S3UploadManager {
  file: File
  upload: Upload
  $rest: AxiosInstance
  progress: (args: ProgressArgs) => void
  etags: Record<number, string>
  offset: number
  partNumber: number

  constructor(base: S3UploadManagerOptions)

  start(): Promise<any>
  resume(): Promise<any>

  /** internal methods */
  _multiChunkUpload(): Promise<any>
  _sendChunks(): Promise<any>
  complete(): Promise<AxiosResponse>
}

export class DebounceCounter {
  // properties
  delay: number
  timeout: ReturnType<typeof setTimeout> | null
  count: number
  flag: boolean
  onFlagChange: (flag: boolean) => void

  // constructor
  constructor(delay?: number, onFlagChange?: (flag: boolean) => void)

  // methods
  inc(): void
  dec(): void

  // internal method (can be public or private)
  _toggleFlag(val: boolean): void
}


export function hasWriteAccess(resource: GirderModel): boolean
export function hasAdminAccess(resource: GirderModel): boolean

export function progressPercent(options?: ProgressPercentOptions): number
export function formatDate(datestring: string | Date): string
export function formatSize(size: number | string, options?: FormatSizeOptions): string
export function formatUsername(user: GirderModel): string

export function getLocationType(location: Location): string | undefined
export function isRootLocation(location: Location): boolean
export function getSingularLocationTypeName(location: Location): 'collection' | 'user' | ''
export function createLocationValidator(allowRoot: boolean): (location: Location | undefined | null) => boolean
export function getResourceIcon(resource: Resource): string | undefined

export type VuetifyConfig = Record<string, any>
export const vuetifyConfig: VuetifyConfig

declare const GirderPlugin: Plugin
export default GirderPlugin
