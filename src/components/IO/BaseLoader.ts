import * as MyType from "@/types";

export default class BaseLoader {
  protected _options?: MyType.iLoaderOptions;
  protected _loadStatus: MyType.eLoaderStatus;

  onloadstart?(_event: MyType.iEventInfo): void;
  onprogress?(_event: MyType.iEventInfo): void;
  onloaditem?(_event: MyType.iEventInfo): void;
  onload?(_event: MyType.iEventInfo): void;
  onloadend?(_event: MyType.iEventInfo): void;
  onerror?(_event: MyType.iEventInfo): void;
  onabort?(_event: MyType.iEventInfo): void;

  constructor() {
    this._options = {
      numberOfFiles: 0,
      defaultCharacterSet: "",
    };
    this._loadStatus = MyType.eLoaderStatus.loader_status_none;
  }

  set loadStatus(status: MyType.eLoaderStatus) {
    this._loadStatus = status;
  }

  get loadStatus(): MyType.eLoaderStatus {
    return this._loadStatus;
  }

  getType(): MyType.eLoaderObjectType {
    return MyType.eLoaderObjectType.loader_object_type_base;
  }

  canLoadFile(file: File): boolean {
    return false;
  }

  loadFileAs(): MyType.eImageContentType {
    return MyType.eImageContentType.image_content_type_invalid;
  }

  loadUrlAs(): MyType.eImageContentType {
    return MyType.eImageContentType.image_content_type_invalid;
  }

  setOptions(option: MyType.iLoaderOptions | undefined) {
    this._options = option;
  }

  getOptions() {
    return this._options;
  }

  isLoading(): boolean {
    return this._loadStatus == MyType.eLoaderStatus.loader_status_loading ? true : false;
  }

  // load
  load(buffer: object, origin: string, index: number) {
    console.log(`${BaseLoader.constructor().name}::load ${origin} ${index}`);
  }
}
