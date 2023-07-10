import BaseLoader from "@/components/IO/BaseLoader";
//import DicomParseManager from "./DicomParseManager";
import * as myUtil from "@/utils";
import * as MyType from "@/types";
import DicomParser from "./DicomParser";

export default class DicomLoader extends BaseLoader {
  private _isLoading: boolean = false;
  private _dicomParse: DicomParser;

  constructor() {
    super();

    this._isLoading = false;
    this._dicomParse = new DicomParser();
  }

  getType(): MyType.eLoaderObjectType {
    return MyType.eLoaderObjectType.loader_object_type_dicom;
  }

  canLoadFile(file: File): boolean {
    const fileType = myUtil.getFileType(file);

    console.log(`FileLoader::canLoadFile`, fileType);

    if (fileType == MyType.eFileType.file_type_dicom) return true;

    return false;
  }

  loadFileAs(): MyType.eImageContentType {
    return MyType.eImageContentType.image_content_type_array_buffer;
  }

  loadUrlAs(): MyType.eImageContentType {
    return MyType.eImageContentType.image_content_type_array_buffer;
  }

  /**
   * Load data.
   *
   * @param {object} buffer The DICOM buffer.
   * @param {string} origin The data origin.
   * @param {number} index The data index.
   */
  load(buffer: ArrayBufferLike, origin: string, index: number) {
    // setup db2v ony once
    if (!this._isLoading) {
      // pass options
      // this._dicomParse.setOptions(this._options);
      // // connect handlers
      // this._dicomParse.onloadstart = this.onloadstart;
      // this._dicomParse.onprogress = this.onprogress;
      // this._dicomParse.onloaditem = this.onloaditem;
      // this._dicomParse.onload = this.onload;

      this._dicomParse.onloadend = (event: MyType.iEventInfo) => {
        // reset loading flag
        this._isLoading = false;
        console.log("DicomLoaders::onloadend");
        // call listeners
        this.onloadend(event);
      };

      this._dicomParse.onerror = (event: MyType.iEventInfo) => {
        // reset loading flag
        this._isLoading = false;
        console.log("DicomLoaders::onerror");
        // call listeners
        this.onerror(event);
      };
    }

    // set loading flag
    this._isLoading = true;
    // convert
    this._dicomParse.parse(buffer);
  }

  onloadstart(_event: MyType.iEventInfo) {}

  onloaditem(_event: MyType.iEventInfo) {}

  onprogress(_event: MyType.iEventInfo) {}

  onload(_event: MyType.iEventInfo) {}

  onloadend(_event: MyType.iEventInfo) {}

  onerror(_event: MyType.iEventInfo) {}

  onabort(_event: MyType.iEventInfo) {}
}
