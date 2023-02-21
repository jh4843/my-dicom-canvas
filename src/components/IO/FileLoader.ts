import * as myType from "@/types";
import * as myUtil from "@/utils";
import { augmentCallbackEvent } from "@/utils/Event";
import BaseLoader from "@/components/IO/BaseLoader";
import DicomLoader from "@/components/IO/DicomLoader";
import ImageLoader from "@/components/IO/ImageLoader";
import { eEventType } from "@/types";

export default class FileLoader extends BaseLoader {
  // Input Files
  private _inputFiles: Array<File> = [];
  private _fileReaders: Array<FileReader> = [];
  private _loaders: Array<myType.SubLoader> = [];
  private _runningLoader: myType.Loader = null;

  private _reservedLoadCount: number = 0;
  private _endLoadCount: number = 0;

  private _self = this;

  constructor() {
    super();

    this._inputFiles = [];
    this._fileReaders = [];
    this._runningLoader = null;

    this._reservedLoadCount = 0;
    this._endLoadCount = 0;

    this._loaders = [];
    this._loaders.push(new DicomLoader());
    this._loaders.push(new ImageLoader());
  }

  getLoader(file: File): myType.Loader {
    console.log("getLoader: ", this._loaders);
    if (this._loaders == undefined) return null;

    for (let i = 0; i < this._loaders.length; ++i) {
      const loader = this._loaders[i];
      if (loader != undefined && loader != null) {
        if (loader.canLoadFile(file)) {
          console.log("getLoader: ", loader, file);
          return this._loaders[i];
        }
      }
    }

    return null;
  }

  canLoadFile(file: File): boolean {
    const fileType = myUtil.getFileType(file);

    if (fileType > myType.eFileType.file_type_invalid) return true;

    return false;
  }

  // Load
  load(data: Array<File>) {
    console.log(`FileLoader::onloaditem: `, data);

    // check input
    if (typeof data === "undefined" || data.length === 0) {
      return;
    }

    this.insertInputFile(data);

    const evtInfo: myType.IEventInfo = {
      type: eEventType.event_type_loadstart,
      src: data,
    };

    // send start event
    this.onloadstart(evtInfo);

    // (_TODO) create prgress handler
    // const mproghandler = new dwv.utils.MultiProgressHandler(self.onprogress);
    // mproghandler.setNToLoad(data.length);

    // create loaders
    // const loaders = [];
    // for (let m = 0; m < dwv.io.loaderList.length; ++m) {
    //   loaders.push(new dwv.io[dwv.io.loaderList[m]]());
    // }

    // find an appropriate loader
    let dataElement = data[0];

    const loader = this.getLoader(dataElement);

    console.log(`FileLoader::load - select loader `, loader);

    if (loader == null) {
      console.log(`FileLoader::load - invalid loader ${typeof loader} ${dataElement} `);
      throw new Error("Invalid loader: " + dataElement);
    }

    // load options
    loader.setOptions(this.getOptions());

    // (_TODO) set loader callbacks
    // loader.onloadstart: nothing to do
    // loader.onprogress = mproghandler.getUndefinedMonoProgressHandler(1);
    if (typeof loader.onloaditem === "undefined") {
      // handle loaditem locally
      console.log("FileLoader::load - local");
      loader.onload = (event: myType.IEventInfo) => {
        console.log(`${this.constructor.name}::addLoadItem`, event);
        this.onloaditem(event);
      }; //this.addLoadItem;
      loader.onloaditem = this.addLoad;
    } else {
      console.log("FileLoader::load - remote");

      loader.onload = this.addLoadItem;

      // loader.onload = (event: myType.IEventInfo) => {
      //   console.log(`${this.constructor.name}::addLoadItem`, event);
      //   this.onloaditem(event);
      // }; //this.addLoadItem;
      loader.onloaditem = this.addLoad;

      // loader.onloaditem = this.onloaditem;
      // loader.onload = this.addLoad;
    }
    loader.onloadend = this.addLoadend;
    loader.onerror = this.onerror;
    loader.onabort = this.onabort;

    // store loader
    this.storeLoader(loader);

    const getLoadHandler = function (loader: myType.Loader, dataElement: any, i: number) {
      if (loader == undefined || loader == null) return null;

      return function (event: any) {
        loader.load(event.target.result, dataElement, i);
      };
    };

    // loop on I/O elements
    for (let i = 0; i < data.length; ++i) {
      dataElement = data[i];

      // check loader
      if (!loader.canLoadFile(dataElement)) {
        throw new Error("Input file of different type: " + dataElement);
      }

      /**
       * The file reader.
       *
       * @external FileReader
       * @see https://developer.mozilla.org/en-US/docs/Web/API/FileReader
       */
      const reader = new FileReader();
      // store reader
      this.storeReader(reader);

      //reader.onprogress = augmentCallbackEvent(mproghandler.getMonoProgressHandler(i, 0), dataElement);
      reader.onload = getLoadHandler(loader, dataElement, i);
      reader.onloadend = (event) => {
        augmentCallbackEvent(this.addLoadend, dataElement)(event);
      };
      reader.onerror = (event) => {
        augmentCallbackEvent(this.onerror, dataElement)(event);
      };
      reader.onabort = (event) => {
        augmentCallbackEvent(this.onabort, dataElement)(event);
      };

      // read
      if (loader.loadFileAs() === myType.eImageContentType.image_content_type_text) {
        reader.readAsText(dataElement);
      } else if (loader.loadFileAs() === myType.eImageContentType.image_content_type_data_url) {
        reader.readAsDataURL(dataElement);
      } else if (loader.loadFileAs() === myType.eImageContentType.image_content_type_array_buffer) {
        reader.readAsArrayBuffer(dataElement);
      }
    }
  }

  insertInputFile(inputFiles: Array<File>) {
    for (const file of inputFiles) {
      this._inputFiles.push(file);
    }

    this._reservedLoadCount = inputFiles.length;
    this._endLoadCount = 0;
  }

  // for Readers
  storeReader(reader: FileReader) {
    this._fileReaders.push(reader);
  }

  clearReaders() {
    this._fileReaders = [];
    //this._fileReaders.splice(0, this._fileReaders.length);
  }

  // for Loaders
  storeLoader(loader: myType.Loader) {
    this._runningLoader = loader;
  }

  clearLoader() {
    this._runningLoader = null;
  }

  /**
   * Launch a load item event and call addLoad.
   *
   * @param {object} event The load data event.
   * @private
   */
  addLoadItem = (event: myType.IEventInfo) => {
    console.log(`${this.constructor.name}::addLoadItem`, event);
    this.onloaditem(event);
    //this.addLoad();
  };

  /**
   * Increment the number of loaded data
   *   and call onload if loaded all data.
   *
   * @param {object} _event The load data event.
   * @private
   */
  addLoad = (event: myType.IEventInfo) => {
    console.log(`FileLoader::addLoad`, event);
    // this._reservedLoadCount++;
    // if (this._reservedLoadCount === this._inputFiles.length) {
    //   this.onload({
    //     source: this._inputFiles
    //   });
    // }
  };

  /**
   * Increment the counter of load end events
   *   and run callbacks when all done, erroneus or not.
   *
   * @param {object} _event The load end event.
   * @private
   */
  addLoadend = (_event: myType.IEventInfo) => {
    console.log(`FileLoader::addLoadend`, this._endLoadCount);
    this._endLoadCount++;
    // call self.onloadend when all is run
    // (not using the input event since it is not the
    //   general load end)
    // x2 to count for reader + load
    if (this._endLoadCount === 2 * this._inputFiles.length) {
      this.onloadend({
        src: this._inputFiles,
      });
    }
  };

  /**
   * Handle a load start event.
   * Default does nothing.
   *
   * @param {object} _event The load start event.
   */

  onloadstart = (_event: myType.IEventInfo) => {};
  /**
   * Handle a load progress event.
   * Default does nothing.
   *
   * @param {object} _event The progress event.
   */
  onprogress = (_event: myType.IEventInfo) => {};
  /**
   * Handle a load item event.
   * Default does nothing.
   *
   * @param {object} _event The load item event fired
   *   when a file item has been loaded successfully.
   */
  onloaditem = (_event: myType.IEventInfo) => {};
  /**
   * Handle a load event.
   * Default does nothing.
   *
   * @param {object} _event The load event fired
   *   when a file has been loaded successfully.
   */
  onload = (_event: myType.IEventInfo) => {};
  /**
   * Handle a load end event.
   * Default does nothing.
   *
   * @param {object} _event The load end event fired
   *  when a file load has completed, successfully or not.
   */
  onloadend = (_event: myType.IEventInfo) => {};
  /**
   * Handle an error event.
   * Default does nothing.
   *
   * @param {object} _event The error event.
   */
  onerror = (_event: myType.IEventInfo) => {};
  /**
   * Handle an abort event.
   * Default does nothing.
   *
   * @param {object} _event The abort event.
   */
  onabort = (_event: myType.IEventInfo) => {};
}
