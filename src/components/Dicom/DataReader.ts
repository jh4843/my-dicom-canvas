import * as MyType from "@/types";

/*
 * Is the Native endianness Little Endian.
 * 2Byte 배열에 1을 넣었을 때, [0] 번째 배열에 1이 들어가면 Little endian
 */
export const isNativeLittleEndian = () => {
  const temp = new Int16Array([1]);
  console.log("isNativeLittleEndian", temp);
  return new Int8Array(temp.buffer)[0] > 0;
};

/**
 * Flip an array's endianness.
 * Inspired from [DataStream.js]{@link https://github.com/kig/DataStream.js}.
 *
 * @param {object} array The array to flip (modified).
 */
export const flipArrayEndianness = (array) => {
  const blen = array.byteLength;
  const u8 = new Uint8Array(array.buffer, array.byteOffset, blen);
  const bpe = array.BYTES_PER_ELEMENT;
  let tmp;
  for (let i = 0; i < blen; i += bpe) {
    for (let j = i + bpe - 1, k = i; j > k; j--, k++) {
      tmp = u8[k];
      u8[k] = u8[j];
      u8[j] = tmp;
    }
  }
};

export default class DataReader {
  //
  private _buffer: ArrayBufferLike;
  private _view: DataView;
  //
  private _isLittleEndian: boolean;
  private _isNativeLittleEndian: boolean;
  private _needFlip: boolean;

  constructor(buffer: ArrayBufferLike, isLittleEndian?: boolean) {
    this._buffer = buffer;
    this._view = new DataView(buffer);

    if (isLittleEndian == undefined) {
      this._isLittleEndian = true;
    } else {
      this._isLittleEndian = isLittleEndian;
    }

    this._isNativeLittleEndian = isNativeLittleEndian();
    this._needFlip = this._isNativeLittleEndian !== isLittleEndian ? true : false;
  }

  // Read Uint16 (2 bytes) data.
  readUint16(byteOffset: number): number {
    return this._view.getUint16(byteOffset, this._isLittleEndian);
  }

  // Read Int16 (2 bytes) data.
  readInt16(byteOffset: number) {
    return this._view.getInt16(byteOffset, this._isLittleEndian);
  }

  // Read Uint32 (4 bytes) data.
  readUint32(byteOffset: number) {
    return this._view.getUint32(byteOffset, this._isLittleEndian);
  }

  // Read BigUint64 (8 bytes) data.
  readBigUint64(byteOffset: number) {
    return this._view.getBigUint64(byteOffset, this._isLittleEndian);
  }

  // Read Int32 (4 bytes) data.
  readInt32(byteOffset: number) {
    return this._view.getInt32(byteOffset, this._isLittleEndian);
  }

  // Read BigInt64 (8 bytes) data.
  readBigInt64(byteOffset: number) {
    return this._view.getBigInt64(byteOffset, this._isLittleEndian);
  }

  readFloat32(byteOffset: number) {
    return this._view.getFloat32(byteOffset, this._isLittleEndian);
  }

  readFloat64(byteOffset: number) {
    return this._view.getFloat64(byteOffset, this._isLittleEndian);
  }

  readBinaryArray(byteOffset: number, size: number): Uint8Array {
    // input
    const bitArray = new Uint8Array(this._buffer, byteOffset, size);
    // result
    const byteArrayLength = 8 * bitArray.length;
    const data = new Uint8Array(byteArrayLength);
    let bitNumber = 0;
    let bitIndex = 0;
    for (let i = 0; i < byteArrayLength; ++i) {
      bitNumber = i % 8;
      bitIndex = Math.floor(i / 8);
      // see https://stackoverflow.com/questions/4854207/get-a-specific-bit-from-byte/4854257
      data[i] = 255 * ((bitArray[bitIndex] & (1 << bitNumber)) !== 0 ? 1 : 0);
    }
    return data;
  }

  readUint8Array(byteOffset: number, size: number): Uint8Array {
    return new Uint8Array(this._buffer, byteOffset, size);
  }

  readInt8Array(byteOffset: number, size: number): Int8Array {
    return new Int8Array(this._buffer, byteOffset, size);
  }

  readUint16Array(byteOffset: number, size: number): Uint16Array | null {
    const bpe = Uint16Array.BYTES_PER_ELEMENT;
    const arraySize = size / bpe;
    let data: Uint16Array | null = null;
    // byteOffset should be a multiple of Uint16Array.BYTES_PER_ELEMENT (=2)
    if (byteOffset % bpe === 0) {
      data = new Uint16Array(this._buffer, byteOffset, arraySize);
      if (this._needFlip) {
        flipArrayEndianness(data);
      }
    } else {
      data = new Uint16Array(arraySize);
      for (let i = 0; i < arraySize; ++i) {
        data[i] = this.readUint16(byteOffset + bpe * i);
      }
    }
    return data;
  }

  readInt16Array(byteOffset: number, size: number): Int16Array | null {
    const bpe = Int16Array.BYTES_PER_ELEMENT;
    const arraySize = size / bpe;
    let data = null;
    // byteOffset should be a multiple of Int16Array.BYTES_PER_ELEMENT (=2)
    if (byteOffset % bpe === 0) {
      data = new Int16Array(this._buffer, byteOffset, arraySize);
      if (this._needFlip) {
        flipArrayEndianness(data);
      }
    } else {
      data = new Int16Array(arraySize);
      for (let i = 0; i < arraySize; ++i) {
        data[i] = this.readInt16(byteOffset + bpe * i);
      }
    }
    return data;
  }

  readUint32Array(byteOffset: number, size: number): Uint32Array | null {
    const bpe = Uint32Array.BYTES_PER_ELEMENT;
    const arraySize = size / bpe;
    let data = null;
    // byteOffset should be a multiple of Uint32Array.BYTES_PER_ELEMENT (=4)
    if (byteOffset % bpe === 0) {
      data = new Uint32Array(this._buffer, byteOffset, arraySize);
      if (this._needFlip) {
        flipArrayEndianness(data);
      }
    } else {
      data = new Uint32Array(arraySize);
      for (let i = 0; i < arraySize; ++i) {
        data[i] = this.readUint32(byteOffset + bpe * i);
      }
    }
    return data;
  }

  readUint64Array(byteOffset: number, size: number): BigUint64Array | null {
    const bpe = BigUint64Array.BYTES_PER_ELEMENT;
    const arraySize = size / bpe;
    let data = null;
    // byteOffset should be a multiple of BigUint64Array.BYTES_PER_ELEMENT (=8)
    if (byteOffset % bpe === 0) {
      data = new BigUint64Array(this._buffer, byteOffset, arraySize);
      if (this._needFlip) {
        flipArrayEndianness(data);
      }
    } else {
      data = new BigUint64Array(arraySize);
      for (let i = 0; i < arraySize; ++i) {
        data[i] = this.readBigUint64(byteOffset + bpe * i);
      }
    }
    return data;
  }

  readInt32Array(byteOffset: number, size: number): Int32Array | null {
    const bpe = Int32Array.BYTES_PER_ELEMENT;
    const arraySize = size / bpe;
    let data = null;
    // byteOffset should be a multiple of Int32Array.BYTES_PER_ELEMENT (=4)
    if (byteOffset % bpe === 0) {
      data = new Int32Array(this._buffer, byteOffset, arraySize);
      if (this._needFlip) {
        flipArrayEndianness(data);
      }
    } else {
      data = new Int32Array(arraySize);
      for (let i = 0; i < arraySize; ++i) {
        data[i] = this.readInt32(byteOffset + bpe * i);
      }
    }
    return data;
  }

  readInt64Array(byteOffset: number, size: number): BigInt64Array | null {
    const bpe = BigInt64Array.BYTES_PER_ELEMENT;
    const arraySize = size / bpe;
    let data = null;
    // byteOffset should be a multiple of BigInt64Array.BYTES_PER_ELEMENT (=8)
    if (byteOffset % bpe === 0) {
      data = new BigInt64Array(this._buffer, byteOffset, arraySize);
      if (this._needFlip) {
        flipArrayEndianness(data);
      }
    } else {
      data = new BigInt64Array(arraySize);
      for (let i = 0; i < arraySize; ++i) {
        data[i] = this.readBigInt64(byteOffset + bpe * i);
      }
    }
    return data;
  }

  readFloat32Array(byteOffset: number, size: number): Float32Array | null {
    const bpe = Float32Array.BYTES_PER_ELEMENT;
    const arraySize = size / bpe;
    let data = null;
    // byteOffset should be a multiple of Float32Array.BYTES_PER_ELEMENT (=4)
    if (byteOffset % bpe === 0) {
      data = new Float32Array(this._buffer, byteOffset, arraySize);
      if (this._needFlip) {
        flipArrayEndianness(data);
      }
    } else {
      data = new Float32Array(arraySize);
      for (let i = 0; i < arraySize; ++i) {
        data[i] = this.readFloat32(byteOffset + bpe * i);
      }
    }
    return data;
  }

  readFloat64Array(byteOffset: number, size: number): Float64Array | null {
    const bpe = Float64Array.BYTES_PER_ELEMENT;
    const arraySize = size / bpe;
    let data = null;
    // byteOffset should be a multiple of Float64Array.BYTES_PER_ELEMENT (=8)
    if (byteOffset % bpe === 0) {
      data = new Float64Array(this._buffer, byteOffset, arraySize);
      if (this._needFlip) {
        flipArrayEndianness(data);
      }
    } else {
      data = new Float64Array(arraySize);
      for (let i = 0; i < arraySize; ++i) {
        data[i] = this.readFloat64(byteOffset + bpe * i);
      }
    }
    return data;
  }

  readHex(byteOffset: number) {
    // read and convert to hex string
    const str = this.readUint16(byteOffset).toString(16);
    // return padded
    return "0x0000".substring(0, 6 - str.length) + str.toUpperCase();
  }
}
