import BaseLoader, { eLoaderStatus } from "@/components/IO/BaseLoader";
import * as myUtil from "@/utils";
import * as myType from "@/types";
import DomReader from "../Image/DomReader";

export default class ImageLoader extends BaseLoader {
  constructor() {
    super();
  }

  canLoadFile(file: File): boolean {
    const fileType = myUtil.getFileType(file);

    if (fileType == myType.eFileType.file_type_raster_image) return true;

    return false;
  }

  loadFileAs(): myType.eImageContentType {
    console.log("loadFileAs");
    return myType.eImageContentType.image_content_type_data_url;
  }

  loadUrlAs(): myType.eImageContentType {
    console.log("loadUrlAs");
    return myType.eImageContentType.image_content_type_array_buffer;
  }

  createDataUri(response: any, dataType: string) {
    // image type
    let imageType = dataType;
    if (!imageType || imageType === "jpg") {
      imageType = "jpeg";
    }
    // create uri
    const file = new Blob([response], { type: "image/" + imageType });
    return window.URL.createObjectURL(file);
  }

  /**
   * Load data.
   *
   * @param {object} buffer The read data.
   * @param {string} origin The data origin.
   * @param {number} index The data index.
   */
  load(buffer: object, origin: string, index: number) {
    console.log(`ImageLoader::load `, origin, index);

    this.loadStatus = eLoaderStatus.loader_status_loadstart;

    const image = new Image();

    image.onload = () => {
      console.log(`ImageLoader::image.onload `, this.loadStatus);

      if (this.loadStatus != eLoaderStatus.loader_status_aborted) {
        this.onprogress({
          lengthComputable: true,
          loaded: 100,
          total: 100,
          index: index,
          source: origin,
        });
        const domReader = new DomReader();
        this.onload(domReader.getViewFromDOMImage(image, origin));
      }
    };

    image.origin = origin;
    image.index = index;
    if (typeof origin === "string") {
      // url case
      const ext = origin.split(".").pop().toLowerCase();
      image.src = this.createDataUri(buffer, ext);
    } else {
      image.src = buffer;
    }
  }

  abort() {
    this.loadStatus = eLoaderStatus.loader_status_aborted;

    this.onabort({});
    this.onloadend({});
  }

  /**
   * Check if the loader can load the provided memory object.
   *
   * @param {object} mem The memory object.
   * @returns {boolean} True if the object can be loaded.
   */
  canLoadMemory(mem: object) {
    if (typeof mem.filename !== "undefined") {
      return this.canLoadFile(mem.filename);
    }
    return false;
  }

  /**
   * Handle a load start event.
   * Default does nothing.
   *
   * @param {object} _event The load start event.
   */
  onloadstart(_event) {}

  /**
   * Handle a progress event.
   * Default does nothing.
   *
   * @param {object} _event The progress event.
   */
  onprogress(_event: object) {}
  /**
   * Handle a load event.
   * Default does nothing.
   *
   * @param {object} _event The load event fired
   *   when a file has been loaded successfully.
   */
  onload(_event) {}
  /**
   * Handle an load end event.
   * Default does nothing.
   *
   * @param {object} _event The load end event fired
   *  when a file load has completed, successfully or not.
   */
  onloadend(_event) {}
  /**
   * Handle an error event.
   * Default does nothing.
   *
   * @param {object} _event The error event.
   */
  onerror(_event) {}
  /**
   * Handle an abort event.
   * Default does nothing.
   *
   * @param {object} _event The abort event.
   */
  onabort(_event) {}
}
