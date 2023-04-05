export default class DicomDefaultTextDecoder {
  constructor() {}

  decode = (buffer: Uint8Array) => {
    let result = "";
    for (let i = 0, leni = buffer.length; i < leni; ++i) {
      result += String.fromCharCode(buffer[i]);
    }
    return result;
  };

  decodeString = (buffer: Uint8Array) => {
    return this.decode(buffer);
  };

  decodeSpecialString = (buffer) => {
    return this.decode(buffer);
  };
}

export default class DicomDefaultTextDecoder {
  constructor() {}

  decodeSpecialString = function (buffer) {
    return textDecoder.decode(buffer);
  };
}
