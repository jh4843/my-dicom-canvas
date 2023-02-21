import BaseLoader from "@/components/IO/BaseLoader";
import * as myUtil from "@/utils";
import * as myType from "@/types";

export default class DicomLoader extends BaseLoader {
  constructor() {
    super();
  }

  canLoadFile(file: File): boolean {
    const fileType = myUtil.getFileType(file);

    console.log(`FileLoader::canLoadFile`, fileType);

    if (fileType == myType.eFileType.file_type_dicom) return true;

    return false;
  }

  loadFileAs(): myType.eImageContentType {
    return myType.eImageContentType.image_content_type_array_buffer;
  }

  loadUrlAs(): myType.eImageContentType {
    return myType.eImageContentType.image_content_type_array_buffer;
  }

  /**
   * Load data.
   *
   * @param {object} buffer The DICOM buffer.
   * @param {string} origin The data origin.
   * @param {number} index The data index.
   */
  load(buffer: object, origin: string, index: number) {
    // setup db2v ony once
    if (!isLoading) {
      // pass options
      db2v.setOptions(options);
      // connect handlers
      db2v.onloadstart = self.onloadstart;
      db2v.onprogress = self.onprogress;
      db2v.onloaditem = self.onloaditem;
      db2v.onload = self.onload;
      db2v.onloadend = function (event) {
        // reset loading flag
        isLoading = false;
        // call listeners
        self.onloadend(event);
      };
      db2v.onerror = self.onerror;
      db2v.onabort = self.onabort;
    }

    // set loading flag
    isLoading = true;
    // convert
    db2v.convert(buffer, origin, index);
  }
}
