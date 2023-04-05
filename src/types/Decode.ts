export class BaseException {
  public message;
  public name;

  constructor(message: string, name: string) {
    this.message = message;
    this.name = name;
  }
}

export interface iDecodeCode {
  index: number;
  children: Uint8Array;
}

export interface iDecodeComponent {
  blockData: Int16Array;
}

export const decoderScripts: { [key: string]: string } = {
  jpeg2000: "../components/Image/Decode/Script/decode-jpeg2000.js",
  "jpeg-lossless": "../components/Image/Decode/Script/decode-jpegloss.js",
  "jpeg-baseline": "../components/Image/Decode/Script/decode-jpegbaseline.js",
  rle: "../components/Image/Decode/Script//decode-rle.js",
};
