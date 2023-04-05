import * as MyType from "@/types";
import * as MyUtil from "@/utils";
import ImageSize from "../ImageSize";

import { JpegImage } from "./pdfjs/jpg";
import { JpxImage } from "./pdfjs/jpx";
import * as jpeg from "./rii-mango/lossless-min.js";

export class PixelBufferDecoder {
  private _algoName: string;
  private _numberOfData: number;
  private _pixelDecoder: AsynchPixelBufferDecoder | SynchPixelBufferDecoder | null;
  private _areCallbacksSet: boolean;

  constructor(algoName: string, numberOfData: number) {
    this._algoName = algoName;
    this._numberOfData = numberOfData;
    this._pixelDecoder = null;
    this._areCallbacksSet = false;

    // initialise the asynch decoder (if possible)
    if (MyType.decoderScripts !== undefined && MyType.decoderScripts[algoName] !== undefined) {
      this._pixelDecoder = new AsynchPixelBufferDecoder(MyType.decoderScripts[algoName], numberOfData);
    } else {
      this._pixelDecoder = new SynchPixelBufferDecoder(algoName, numberOfData);
    }
  }

  get numberOfData() {
    return this._numberOfData;
  }

  /**
   * Get data from an input buffer using a DICOM parser.
   */
  decode(pixelBuffer: ArrayBuffer & any[], pixelMeta: MyType.iImageMetaData, info: MyType.iEventInfo) {
    if (this._pixelDecoder == undefined) return;

    if (!this._areCallbacksSet) {
      this._areCallbacksSet = true;

      // set callbacks
      this._pixelDecoder.ondecodestart = this.ondecodestart;
      this._pixelDecoder.ondecodeditem = this.ondecodeditem;
      this._pixelDecoder.ondecoded = this.ondecoded;
      this._pixelDecoder.ondecodeend = this.ondecodeend;
      this._pixelDecoder.onerror = this.onerror;
      this._pixelDecoder.onabort = this.onabort;
    }
    // decode and call the callback
    this._pixelDecoder.decode(pixelBuffer, pixelMeta, info);
  }

  /**
   * Abort decoding.
   */
  abort() {
    if (this._pixelDecoder == undefined) return;

    this._pixelDecoder.abort();
  }

  // prototypes
  ondecodestart(_event: MyType.iEventInfo) {}
  ondecodeditem(_event: MyType.iEventInfo) {}
  ondecoded(_event: MyType.iEventInfo) {}
  ondecodeend(_event: MyType.iEventInfo) {}
  onerror(_event: MyType.iEventInfo) {}
  onabort(_event: MyType.iEventInfo) {}
}

export class AsynchPixelBufferDecoder {
  private _numberOfData: number;
  private _script: string;

  private _pool: MyUtil.ThreadPool;
  private _areCallbacksSet: boolean;

  constructor(script: string, numberOfData: number) {
    this._script = script;
    this._numberOfData = numberOfData;

    this._pool = new MyUtil.ThreadPool(10);
    this._areCallbacksSet = false;
  }

  get numberOfData() {
    return this._numberOfData;
  }

  /**
   * Decode a pixel buffer.
   */
  decode(pixelBuffer: ArrayBuffer, pixelMeta: MyType.iImageMetaData, info: MyType.iEventInfo) {
    if (!this._areCallbacksSet) {
      this._areCallbacksSet = true;
      // set event handlers
      this._pool.onworkstart = this.ondecodestart;
      this._pool.onworkitem = this.ondecodeditem;
      this._pool.onwork = this.ondecoded;
      this._pool.onworkend = this.ondecodeend;
      this._pool.onerror = this.onerror;
      this._pool.onabort = this.onabort;
    }
    // create worker task
    const workerTask = new MyUtil.WorkerTask(
      this._script,
      {
        buffer: pixelBuffer,
        meta: pixelMeta,
      },
      info
    );
    // add it the queue and run it
    this._pool.addWorkerTask(workerTask);
  }

  /**
   * Abort decoding.
   */
  abort() {
    this._pool.abort();
  }

  ondecodestart(event: MyType.iEventInfo) {}
  ondecodeditem(event: MyType.iEventInfo) {}
  ondecoded(event: MyType.iEventInfo) {}
  ondecodeend(event: MyType.iEventInfo) {}
  onerror(event: MyType.iEventInfo) {}
  onabort(event: MyType.iEventInfo) {}
}

export class SynchPixelBufferDecoder {
  private _algoName: string;
  private _numberOfData: number;
  //
  private _decodeCount: number;

  constructor(algoName: string, numberOfData: number) {
    this._algoName = algoName;
    this._numberOfData = numberOfData;
    //
    this._decodeCount = 0;
  }

  /**
   * Decode a pixel buffer.
   *
   * @param {Array} pixelBuffer The pixel buffer.
   * @param {object} pixelMeta The input meta data.
   * @param {object} info Information object about the input data.
   * @external jpeg
   * @external JpegImage
   * @external JpxImage
   */
  decode(pixelBuffer: ArrayBuffer, pixelMeta: MyType.iImageMetaData, info: MyType.iEventInfo) {
    ++this._decodeCount;

    let decoder = null;
    let decodedBuffer = null;
    if (this._algoName === "jpeg-lossless") {
      // bytes per element

      const bitsAllocated = pixelMeta.bitsAllocated ? pixelMeta.bitsAllocated : 8;

      //const bpe = pixelMeta.bitsAllocated / 8;
      const bpe = bitsAllocated / 8;
      const buf = new Uint8Array(pixelBuffer);
      decoder = new jpeg.lossess.Decoer();
      const decoded = decoder.decode(buf.buffer, 0, buf.buffer.byteLength, bpe);
      if (pixelMeta.bitsAllocated === 8) {
        if (pixelMeta.isSigned) {
          decodedBuffer = new Int8Array(decoded.buffer);
        } else {
          decodedBuffer = new Uint8Array(decoded.buffer);
        }
      } else if (pixelMeta.bitsAllocated === 16) {
        if (pixelMeta.isSigned) {
          decodedBuffer = new Int16Array(decoded.buffer);
        } else {
          decodedBuffer = new Uint16Array(decoded.buffer);
        }
      }
    } else if (this._algoName === "jpeg-baseline") {
      decoder = new JpegImage();
      decoder.parse(pixelBuffer);
      decodedBuffer = decoder.getData({ width: decoder.width, height: decoder.height });
    } else if (this._algoName === "jpeg2000") {
      // decompress pixel buffer into Int16 image
      decoder = new JpxImage();
      decoder.parse(pixelBuffer);
      // set the pixel buffer

      if (decoder.tiles == undefined) {
        return;
      }

      decodedBuffer = decoder.tiles[0].items;
    } else if (this._algoName === "rle") {
      // decode DICOM buffer
      decoder = new dwv.decoder.RleDecoder();

      const tmpBuf = new Array(pixelBuffer);

      const tmpSize = new ImageSize(0, 0, 1);
      // set the pixel buffer
      decodedBuffer = decoder.decode(
        tmpBuf,
        pixelMeta.bitsAllocated ? pixelMeta.bitsAllocated : 8,
        pixelMeta.isSigned ? pixelMeta.isSigned : true,
        pixelMeta.sliceSize ? pixelMeta.sliceSize.getTotalSize() : tmpSize.getTotalSize(),
        pixelMeta.samplesPerPixel ? pixelMeta.samplesPerPixel : 1,
        pixelMeta.planarConfiguration ? pixelMeta.planarConfiguration : 1
      );
    }
    // send decode events
    this.ondecodeditem({
      data: [decodedBuffer],
      index: info.itemNumber,
    });
    // decode end?
    if (this._decodeCount === this._numberOfData) {
      this.ondecoded({});
      this.ondecodeend({});
    }
  }

  /**
   * Abort decoding.
   */
  abort() {
    // nothing to do in the synchronous case.
    // callback
    this.onabort({});
    this.ondecodeend({});
  }

  ondecodestart(event: MyType.iEventInfo) {}
  ondecodeditem(event: MyType.iEventInfo) {}
  ondecoded(event: MyType.iEventInfo) {}
  ondecodeend(event: MyType.iEventInfo) {}
  onerror(event: MyType.iEventInfo) {}
  onabort(event: MyType.iEventInfo) {}
}
