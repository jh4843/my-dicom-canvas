import type { ILoaderOptions } from "@/components/IO/BaseLoader";
import FileLoader from "@/components/IO/FileLoader";
import { augmentCallbackEvent } from "@/utils/Event";
import { eEventLoadType, type IEventInfo } from "@/types/Event";

export interface ILoaderController {
  onloadstart(_event: IEventInfo): void;
  onprogress(_event: IEventInfo): void;
  onloaditem(_event: IEventInfo): void;
  onload(_event: IEventInfo): void;
  onloadend(_event: IEventInfo): void;
  onerror(_event: IEventInfo): void;
  onabort(_event: IEventInfo): void;
}

export default class FileLoaderManager implements ILoaderController {
  private _currentLoaders: Array<Object>;
  private _countForId: number;
  private _lastDate: Date;

  constructor() {
    this._currentLoaders = [];
    this._countForId = -1;
    this._lastDate = new Date();
  }

  a(files: FileList): void {
    console.log("dd", files);
  }

  getNextLoadId() {
    ++this._countForId;

    if (this._lastDate != new Date()) {
      this._lastDate = new Date();
    }

    const curDate = this._lastDate.getDate();
    const res = curDate.toString() + this._countForId.toString();

    return Number(res);
  }

  loadFiles(files: FileList): void {
    if (files == undefined || files.length < 1) return;

    const fileName = files[0].name;
    const ext = fileName.split(".").pop()?.toLowerCase();

    console.log("FileLoaderManager::loadFiles ", fileName);

    if (ext === "json") {
      // create IO
      this.loadStateFile(files[0]);
    } else {
      this.loadImageFile(files);
    }
  }

  loadStateFile(file: File) {
    const fileIO = new FileLoader();
    // load data
    this.loadFileData([file], fileIO, eEventLoadType.event_load_type_state);
  }

  loadImageFile(files: FileList) {
    console.log("FileLoaderManager::loadImageFile ", files);
    const fileIO = new FileLoader();
    // load data
    const fileArray: Array<File> = Array.from(files);
    this.loadFileData(fileArray, fileIO, eEventLoadType.event_load_type_state);
  }

  loadFileData(data: Array<File>, loader: FileLoader, loadType: eEventLoadType, options?: ILoaderOptions) {
    const loadId = this.getNextLoadId();

    const eventInfo: IEventInfo = {
      id: loadId,
      loadType: loadType,
    };

    loader.onloadstart = (event) => {
      console.log(`FileLoaderManager::onloadstart `, event);

      // store loader to allow abort
      this._currentLoaders[loadId] = {
        loader: loader,
        isFirstItem: true,
      };

      augmentCallbackEvent(this.onloadstart, eventInfo)(event);

      this.onloadstart(event);
    };

    loader.onprogress = (event) => {
      console.log(`FileLoaderManager::::onprogress `, event);
      augmentCallbackEvent(this.onloadstart, eventInfo)(event);
    };

    loader.onloaditem = (event) => {
      console.log(`FileLoaderManager::onloaditem `, event);
      augmentCallbackEvent(this.onloadend, eventInfo)(event);
    };

    loader.onerror = (event) => {
      console.log(`FileLoaderManager::onerror: `, event);
      augmentCallbackEvent(this.onerror, eventInfo)(event);
    };
    loader.onabort = (event) => {
      console.log(`FileLoaderManager::onabort: `, event);
      augmentCallbackEvent(this.onabort, eventInfo)(event);
    };

    // launch load
    try {
      console.log(`FileLoaderManager::loader::load: `, data);
      loader.setOptions(options);
      loader.load(data);
    } catch (error) {
      this.onerror({
        id: loadId,
        loadType: eEventLoadType.event_load_type_error,
        error: error,
      });
      this.onloadend({
        id: loadId,
        loadType: eEventLoadType.event_load_type_error,
      });
      return;
    }
  }

  getLoaderCount(): number {
    return this._currentLoaders.length;
  }

  /**
   * Handle a load start event.
   * Default does nothing.
   *
   * @param {object} _event The load start event.
   */

  onloadstart(_event: IEventInfo) {
    console.log(_event);
  }
  /**
   * Handle a load progress event.
   * Default does nothing.
   *
   * @param {object} _event The progress event.
   */
  onprogress(_event: IEventInfo) {
    console.log(_event);
  }
  /**
   * Handle a load item event.
   * Default does nothing.
   *
   * @param {object} _event The load item event fired
   *   when a file item has been loaded successfully.
   */
  onloaditem(_event: IEventInfo) {
    console.log(_event);
  }
  /**
   * Handle a load event.
   * Default does nothing.
   *
   * @param {object} _event The load event fired
   *   when a file has been loaded successfully.
   */
  onload(_event: IEventInfo) {
    console.log(_event);
  }
  /**
   * Handle a load end event.
   * Default does nothing.
   *
   * @param {object} _event The load end event fired
   *  when a file load has completed, successfully or not.
   */
  onloadend(_event: IEventInfo) {
    console.log(_event);
  }
  /**
   * Handle an error event.
   * Default does nothing.
   *
   * @param {object} _event The error event.
   */
  onerror(_event: IEventInfo) {
    console.log(_event);
  }
  /**
   * Handle an abort event.
   * Default does nothing.
   *
   * @param {object} _event The abort event.
   */
  onabort(_event: IEventInfo) {
    console.log(_event);
  }
}
