import * as myType from "@/types";

export interface ILoaderOptions {
  numberOfFiles?: number;
  defaultCharacterSet?: string;
}

export enum eLoaderStatus {
  loader_status_none = 0,
  loader_status_loadstart = 10,
  loader_status_loading,
  loader_status_loadend,

  loader_status_aborted = 20,
}

export default class BaseLoader {
  protected _options?: ILoaderOptions;
  protected _loadStatus: eLoaderStatus;

  onloadstart?(_event: myType.IEventInfo): void;
  onprogress?(_event: myType.IEventInfo): void;
  onloaditem?(_event: myType.IEventInfo): void;
  onload?(_event: myType.IEventInfo): void;
  onloadend?(_event: myType.IEventInfo): void;
  onerror?(_event: myType.IEventInfo): void;
  onabort?(_event: myType.IEventInfo): void;

  constructor() {
    this._options = {
      numberOfFiles: 0,
      defaultCharacterSet: "",
    };
    this._loadStatus = eLoaderStatus.loader_status_none;
  }

  set loadStatus(status: eLoaderStatus) {
    this._loadStatus = status;
  }

  get loadStatus(): eLoaderStatus {
    return this._loadStatus;
  }

  canLoadFile(file: File): boolean {
    return false;
  }

  loadFileAs(): myType.eImageContentType {
    return myType.eImageContentType.image_content_type_invalid;
  }

  loadUrlAs(): myType.eImageContentType {
    return myType.eImageContentType.image_content_type_invalid;
  }

  setOptions(option: ILoaderOptions | undefined) {
    this._options = option;
  }

  getOptions() {
    return this._options;
  }

  isLoading(): boolean {
    return this._loadStatus == eLoaderStatus.loader_status_loading ? true : false;
  }

  // load
  load(buffer: object, origin: string, index: number) {
    console.log(`${BaseLoader.constructor().name}::load ${origin} ${index}`);
  }
}
