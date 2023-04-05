import * as MyType from "@/types";
import * as MyUtil from "@/utils";
import ImageSize from "@/components/Image/ImageSize";
import DicomParser from "../Dicom/DicomParser";
import ImageFactory from "../Image/ImageFactory";
import { PixelBufferDecoder } from "@/components/Image/Decode/DecoderMain";

/**
 * Create a dwv.image.View from a DICOM buffer.
 *
 * @class
 */
export default class DicomParseManager {
  private _options: MyType.iLoaderOptions | undefined;
  private _dicomParserStore: DicomParser[];
  private _finalBufferStore: MyType.tImageBufferType[];
  private _decompressedSizes: number[];
  private _pixelDecoder: PixelBufferDecoder | undefined;

  constructor() {
    this._options = {
      numberOfFiles: 0,
      defaultCharacterSet: "",
    };
    this._dicomParserStore = [];
    this._finalBufferStore = [];
    this._decompressedSizes = [];
  }

  convert(buffer: ArrayBufferLike, origin: string, dataIndex: number) {
    this.onloadstart({
      type: MyType.eEventType.event_type_loadstart,
      src: origin,
      dataIndex: dataIndex,
    });

    // DICOM parser
    const dicomParser = new DicomParser();
    const imageFactory = new ImageFactory();

    if (this._options !== undefined && this._options.defaultCharacterSet !== undefined) {
      dicomParser.setDefaultCharacterSet(this._options.defaultCharacterSet);
    }
    // parse the buffer
    try {
      dicomParser.parse(buffer);
      // check elements are good for image
      imageFactory.checkElements(dicomParser.getDicomElements());
    } catch (error) {
      this.onerror({
        error: error,
        src: origin,
      });
      this.onloadend({
        src: origin,
      });
      return;
    }

    const pixelBuffer = dicomParser.getRawDicomElements()["x7FE00010"].value;
    // help GC: discard pixel buffer from elements
    dicomParser.getRawDicomElements()["x7FE00010"].value = [];
    const syntax = MyUtil.cleanString(dicomParser.getRawDicomElements()["x00020010"].value[0]);
    const algoName = dicomParser.getSyntaxDecompressionName(syntax);
    const needDecompression = algoName !== null;

    // store
    this._dicomParserStore[dataIndex] = dicomParser;
    this._finalBufferStore[dataIndex] = pixelBuffer[0];

    if (needDecompression) {
      // gather pixel buffer meta data
      const bitsAllocated = dicomParser.getRawDicomElements()["x00280100"].value[0];
      const pixelRepresentation = dicomParser.getRawDicomElements()["x00280103"].value[0];
      const pixelMeta: MyType.iImageMetaData = {
        bitsAllocated: bitsAllocated,
        isSigned: pixelRepresentation === 1,
      };
      const columnsElement = dicomParser.getRawDicomElements()["x00280011"];
      const rowsElement = dicomParser.getRawDicomElements()["x00280010"];
      if (typeof columnsElement !== "undefined" && typeof rowsElement !== "undefined") {
        pixelMeta.sliceSize = new ImageSize(columnsElement.value[0], rowsElement.value[0]);
      }
      const samplesPerPixelElement = dicomParser.getRawDicomElements()["x00280002"];
      if (typeof samplesPerPixelElement !== "undefined") {
        pixelMeta.samplesPerPixel = samplesPerPixelElement.value[0];
      }
      const planarConfigurationElement = dicomParser.getRawDicomElements()["x00280006"];
      if (typeof planarConfigurationElement !== "undefined") {
        pixelMeta.planarConfiguration = planarConfigurationElement.value[0];
      }

      // number of items
      const numberOfItems = pixelBuffer.length;

      // setup the decoder (one decoder per all converts)
      if (this._pixelDecoder === null) {
        this._pixelDecoder = new PixelBufferDecoder(algoName, numberOfItems);
        // callbacks
        // this._pixelDecoder.ondecodestart: nothing to do
        this._pixelDecoder.ondecodeditem = (event) => {
          this.onDecodedItem(event);

          if (event.itemNumber == undefined) {
            console.log("event.itemNumber is undefined");
          } else if (event.itemNumber + 1 === event.numberOfItems) {
            this.onload(event);
            this.onloadend(event);
          }
        };
        // this._pixelDecoder.ondecoded: nothing to do
        // this._pixelDecoder.ondecodeend: nothing to do
        this._pixelDecoder.onerror = this.onerror;
        this._pixelDecoder.onabort = this.onabort;
      }

      if (this._pixelDecoder != undefined) {
        // launch decode
        for (let i = 0; i < numberOfItems; ++i) {
          console.log("pixelDecoder.decode");
          this._pixelDecoder.decode(pixelBuffer[i], pixelMeta, {
            itemNumber: i,
            numberOfItems: numberOfItems,
            dataIndex: dataIndex,
          });
        }
      }
    } else {
      // no decompression
      // send progress
      this.onprogress({
        lengthComputable: true,
        loaded: 100,
        total: 100,
        index: dataIndex,
        src: origin,
      });
      // generate image
      this.generateImage(dataIndex, origin);
      // send load events
      this.onload({
        src: origin,
      });
      this.onloadend({
        src: origin,
      });
    }
  }

  setOptions(option: MyType.iLoaderOptions | undefined) {
    this._options = option;
  }

  generateImage(index: number, origin: object | string) {
    const dicomElements = this._dicomParserStore[index].getDicomElements();

    const modality = MyUtil.cleanString(dicomElements.getFromKey("x00080060"));
    let factory;
    if (modality && modality === "SEG") {
      //factory = new dwv.image.MaskFactory();
      console.log("this is SEG modality");
      return;
    } else {
      factory = new ImageFactory();
    }

    if (this._options?.numberOfFiles == null || this._options?.numberOfFiles < 1) {
      console.log("Invalid file count: ", this._options?.numberOfFiles);
      return;
    }

    // create the image
    try {
      const image = factory.create(dicomElements, this._finalBufferStore[index], this._options.numberOfFiles);
      // call onloaditem
      this.onloaditem({
        data: {
          image: image,
          info: this._dicomParserStore[index].getRawDicomElements(),
        } as MyType.iEventData,
        src: origin,
      });
    } catch (error) {
      this.onerror({
        error: error,
        src: origin,
      });
      this.onloadend({
        src: origin,
      });
    }
  }

  onDecodedItem(event: MyType.iEventInfo) {
    if (event == undefined) return;
    // send progress
    this.onprogress({
      lengthComputable: true,
      loaded: (event.itemNumber ? event.itemNumber : 0) + 1,
      total: event.numberOfItems,
      index: event.dataIndex,
      src: origin,
    });

    const dataIndex = event.dataIndex ? event.dataIndex : 0;

    if (event.data == undefined || event.data[0] == undefined) return;

    // store decoded data
    const decodedData = event.data[0];
    if (event.numberOfItems != undefined && event.numberOfItems !== 1) {
      // allocate buffer if not done yet
      if (this._decompressedSizes[dataIndex] == undefined) {
        this._decompressedSizes[dataIndex] = decodedData.length;
        const fullSize = event.numberOfItems * this._decompressedSizes[dataIndex];
        try {
          this._finalBufferStore[dataIndex] = new decodedData.constructor(fullSize);
        } catch (error) {
          if (error instanceof RangeError) {
            const powerOf2 = Math.floor(Math.log(fullSize) / Math.log(2));
            console.log(
              "Cannot allocate " +
                decodedData.constructor.name +
                " of size: " +
                fullSize +
                " (>2^" +
                powerOf2 +
                ") for decompressed data."
            );
          }
          // abort
          this._pixelDecoder?.abort();
          // send events
          this.onerror({
            error: error,
            src: origin,
          });
          this.onloadend({
            src: origin,
          });
          // exit
          return;
        }
      }
      // hoping for all items to have the same size...
      if (decodedData.length !== this._decompressedSizes[dataIndex]) {
        console.log(
          "Unsupported varying decompressed data size: " +
            decodedData.length +
            " != " +
            this._decompressedSizes[dataIndex]
        );
      }

      if (this._finalBufferStore != null && dataIndex != undefined && event.itemNumber != undefined) {
        const t = this._finalBufferStore[dataIndex];
        if (t != null) t.set(decodedData, this._decompressedSizes[dataIndex] * event.itemNumber);
      }
      // set buffer item data
    } else {
      this._finalBufferStore[dataIndex] = decodedData;
    }

    // create image for the first item
    if (event.itemNumber === 0) {
      this.generateImage(dataIndex, origin);
    }
  }

  /**
   * Get data from an input buffer using a DICOM parser.
   *
   * @param {Array} buffer The input data buffer.
   * @param {string} origin The data origin.
   * @param {number} dataIndex The data index.
   */

  /**
   * Abort a conversion.
   */
  abort() {
    // abort decoding, will trigger this._pixelDecoder.onabort
    if (this._pixelDecoder) {
      this._pixelDecoder.abort();
    }
  }

  // prototypes

  onloadstart(_event: MyType.iEventInfo) {}

  onloaditem(_event: MyType.iEventInfo) {}

  onprogress(_event: MyType.iEventInfo) {}

  onload(_event: MyType.iEventInfo) {}

  onloadend(_event: MyType.iEventInfo) {}

  onerror(_event: MyType.iEventInfo) {}

  onabort(_event: MyType.iEventInfo) {}
}
