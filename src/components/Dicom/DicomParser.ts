import type ImageSize from "../Image/ImageSize";

export default class DicomParser {
  private _version: string;
  private _fileName: string;

  constructor() {
    this._fileName = "";
    this._version = "0.31.0-beta.23";
  }

  getVersion(): string {
    return this._version;
  }

  parse(fileName: string): boolean {
    return true;
  }

  getTypedArray(bitsAllocated: number, pixelRepresentation: number, size: number) {
    let res = null;
    try {
      if (bitsAllocated === 8) {
        if (pixelRepresentation === 0) {
          res = new Uint8Array(size);
        } else {
          res = new Int8Array(size);
        }
      } else if (bitsAllocated === 16) {
        if (pixelRepresentation === 0) {
          res = new Uint16Array(size);
        } else {
          res = new Int16Array(size);
        }
      } else if (bitsAllocated === 32) {
        if (pixelRepresentation === 0) {
          res = new Uint32Array(size);
        } else {
          res = new Int32Array(size);
        }
      }
    } catch (error) {
      if (error instanceof RangeError) {
        const powerOf2 = Math.floor(Math.log(size) / Math.log(2));
        console.log("Cannot allocate array of size: " + size + " (>2^" + powerOf2 + ").");
      }
    }
    return res;
  }
}
