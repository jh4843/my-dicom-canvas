export interface ILoaderOptions {
  numberOfFiles: number;
  defaultCharacterSet: string;
}

export enum eLoaderStatus {
  loader_status_none = 0,
  loader_status_loadstart,
  loader_status_loading,
  loader_status_loadend,
}

export default class BaseLoader {
  protected _options: ILoaderOptions;
  protected _loadStatus: eLoaderStatus;

  constructor() {
    this._options = {
      numberOfFiles: 0,
      defaultCharacterSet: "",
    };
    this._loadStatus = eLoaderStatus.loader_status_none;
  }

  set options(option: ILoaderOptions) {
    this._options = option;
  }

  get options(): ILoaderOptions {
    return this._options;
  }

  set loadStatus(status: eLoaderStatus) {
    this._loadStatus = status;
  }

  get loadStatus(): eLoaderStatus {
    return this._loadStatus;
  }

  isLoading(): boolean {
    return this._loadStatus == eLoaderStatus.loader_status_loading ? true : false;
  }
}
