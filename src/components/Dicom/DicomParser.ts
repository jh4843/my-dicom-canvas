import * as MyType from "@/types";
import * as MyUtil from "@/utils";
import DicomTag, { isPixelDataTag, isSequenceDelimitationItemTag, isItemDelimitationItemTag } from "./DicomTag";
import DataReader from "./DataReader";
import DicomElement, { type tDicomElement, type tElementValueType } from "./DicomElement";
import DicomDS from "./DicomDS";
import DicomItem from "./DicomItem";

interface iTag {
  tag: DicomTag;
  endOffset: number;
}

export class DefaultTextDecoder {
  private _decode;

  get decode() {
    return this._decode;
  }

  constructor() {
    this._decode = function (buffer: Uint8Array) {
      let result = "";
      for (let i = 0, leni = buffer.length; i < leni; ++i) {
        result += String.fromCharCode(buffer[i]);
      }
      return result;
    };
  }
}

export const getVersion = (): string => {
  return "0.31.0-beta.23";
};

export default class DicomParser {
  //private _version: string;
  private _fileName: string;
  private _textDecoder: DefaultTextDecoder | TextDecoder;
  //
  private _defaultTextDecoder: DefaultTextDecoder;
  private _defaultCharacterSet: string;
  private _characterSet: string;
  //
  private _dicomElements: tDicomElement[] = [];

  constructor() {
    this._fileName = "";
    //this._version = "0.31.0-beta.23";
    this._defaultTextDecoder = new DefaultTextDecoder();
    this._textDecoder = this._defaultTextDecoder;
    this._defaultCharacterSet = "ISO_IR 192";
    this._characterSet = this._defaultCharacterSet;
  }

  decodeString(buffer: Uint8Array): string {
    return this._defaultTextDecoder.decode(buffer);
  }

  decodeSpecialString(buffer: Uint8Array): string {
    return this._textDecoder.decode(buffer);
  }

  hasDicomPrefix(buffer: ArrayBuffer): boolean {
    // offset: 128 byte => Header size
    const prefixArray = new Uint8Array(buffer, 128, 4);
    const stringReducer = function (previous: string, current: number) {
      console.log("hasDicomPrefix: ", previous, current);
      return (previous += String.fromCharCode(current));
    };
    return prefixArray.reduce(stringReducer, "") === "DICM";
  }

  // For character set.
  getDefaultCharacterSet() {
    return this._defaultCharacterSet;
  }

  setDefaultCharacterSet(characterSet: string) {
    this._defaultCharacterSet = characterSet;
    this.setCharacterSet(characterSet);
  }

  setCharacterSet(characterSet: string) {
    this._characterSet = characterSet;
  }

  interpret(elements: tDicomElement[], reader: DataReader, pixelRepresentation: number, bitsAllocated: number) {
    const keys = Object.keys(elements);
    for (let i = 0; i < keys.length; ++i) {
      const element = elements[keys[i]];
      if (typeof element.value === "undefined") {
        element.value = this.interpretElement(element, reader, pixelRepresentation, bitsAllocated);
      }
      // delete interpretation specific properties
      delete element.startOffset;
      delete element.endOffset;
    }
  }

  //
  // Parse
  //
  parse(buffer: ArrayBufferLike) {
    let offset = 0;
    let syntax = "";
    let dataElement = null;
    // default readers
    const metaReader = new DataReader(buffer);
    let dataReader = new DataReader(buffer);

    console.log("DicomParser parse[metaReader]: ", metaReader);
    console.log("DicomParser parse[DataReader]: ", dataReader);

    // 128 -> 132: magic word
    offset = 128;
    const magicword = this.decodeString(metaReader.readUint8Array(offset, 4));
    offset += 4 * Uint8Array.BYTES_PER_ELEMENT;
    if (magicword === "DICM") {
      // 0x0002, 0x0000: FileMetaInformationGroupLength
      dataElement = this.readDataElement(metaReader, offset, false);
      dataElement.value = this.interpretElement(dataElement, metaReader);
      // increment offset
      offset = dataElement.endOffset ? dataElement.endOffset : 0;
      // store the data element
      this._dicomElements[dataElement.tag.getKey()] = dataElement;
      // get meta length
      let metaLength = 0;
      if (dataElement.value !== null && dataElement.value?.length > 0) {
        if (typeof dataElement.value[0] == "number") {
          metaLength = dataElement.value[0];
        } else if (typeof dataElement.value[0] == "string") {
          metaLength = parseInt(dataElement.value[0], 10);
        }
      }

      // meta elements
      const metaEnd = offset + metaLength;
      while (offset < metaEnd) {
        // get the data element
        dataElement = this.readDataElement(metaReader, offset, false);
        offset = dataElement.endOffset ? dataElement.endOffset : 0;
        // store the data element
        this._dicomElements[dataElement.tag.getKey()] = dataElement;
      }

      // check the TransferSyntaxUID (has to be there!)
      dataElement = this._dicomElements["x00020010"];
      if (typeof dataElement === "undefined") {
        throw new Error("Not a valid DICOM file (no TransferSyntaxUID found)");
      }
      dataElement.value = this.interpretElement(dataElement, metaReader);
      syntax = MyUtil.cleanString(dataElement.value[0]);
    } else {
      console.log("No DICM prefix, trying to guess tansfer syntax.");
      // read first element
      dataElement = this.readDataElement(dataReader, 0, false);
      // guess transfer syntax
      const tsElement = this.guessTransferSyntaxType(dataElement);
      // store
      this._dicomElements[tsElement.tag.getKey()] = tsElement;

      if (tsElement.value != undefined && typeof tsElement.value[0] === "string") {
        syntax = MyUtil.cleanString(tsElement.value[0]);
      }

      // reset offset
      offset = 0;
    }

    // check transfer syntax support
    if (!this.isReadSupportedTransferSyntax(syntax)) {
      throw new Error(
        "Unsupported DICOM transfer syntax: '" + syntax + "' (" + this.getTransferSyntaxName(syntax) + ")"
      );
    }

    // set implicit flag
    let implicit = false;
    if (this.isImplicitTransferSyntax(syntax)) {
      implicit = true;
    }

    // Big Endian
    if (this.isBigEndianTransferSyntax(syntax)) {
      dataReader = new DataReader(buffer, false);
    }

    // DICOM data elements
    while (offset < buffer.byteLength) {
      // get the data element
      dataElement = this.readDataElement(dataReader, offset, implicit);
      // increment offset
      offset = dataElement.endOffset ? dataElement.endOffset : 0;
      // store the data element
      if (typeof this._dicomElements[dataElement.tag.getKey()] === "undefined") {
        this._dicomElements[dataElement.tag.getKey()] = dataElement;
      } else {
        console.log("Not saving duplicate tag: " + dataElement.tag.getKey());
      }
    }
    ////

    // safety checks...
    if (isNaN(offset)) {
      throw new Error("Problem while parsing, bad offset");
    }
    if (buffer.byteLength !== offset) {
      console.log("Did not reach the end of the buffer: " + offset + " != " + buffer.byteLength);
    }

    //-------------------------------------------------
    // values needed for data interpretation

    // pixel specific
    let pixelRepresentation = 0;
    let bitsAllocated = 16;
    if (typeof this._dicomElements["x7FE00010"] !== "undefined") {
      // PixelRepresentation 0->unsigned, 1->signed

      dataElement = this._dicomElements["x00280103"];
      if (typeof dataElement !== "undefined") {
        dataElement.value = this.interpretElement(dataElement, dataReader);
        pixelRepresentation = dataElement.value[0];
      } else {
        console.log("Reading DICOM pixel data with default pixelRepresentation.");
      }

      // BitsAllocated

      dataElement = this._dicomElements["x00280100"];
      if (typeof dataElement !== "undefined") {
        dataElement.value = this.interpretElement(dataElement, dataReader);
        bitsAllocated = dataElement.value[0];
      } else {
        console.log("Reading DICOM pixel data with default bitsAllocated.");
      }
    }

    // default character set
    if (typeof this.getDefaultCharacterSet() !== "undefined") {
      this.setDecoderCharacterSet(this.getDefaultCharacterSet());
    }

    // SpecificCharacterSet
    dataElement = this._dicomElements["x00080005"];
    if (typeof dataElement !== "undefined") {
      dataElement.value = this.interpretElement(dataElement, dataReader);
      let charSetTerm;
      if (dataElement.value.length === 1) {
        charSetTerm = MyUtil.cleanString(dataElement.value[0]);
      } else {
        charSetTerm = MyUtil.cleanString(dataElement.value[1]);
        console.log("Unsupported character set with code extensions: '" + charSetTerm + "'.");
      }
      this.setDecoderCharacterSet(this.getUtfLabel(charSetTerm));
    }

    // interpret the dicom elements
    this.interpret(this._dicomElements, dataReader, pixelRepresentation, bitsAllocated);

    // handle fragmented pixel buffer
    // Reference: http://dicom.nema.org/dicom/2013/output/chtml/part05/sect_8.2.html
    // (third note, "Depending on the transfer syntax...")
    dataElement = this._dicomElements["x7FE00010"];
    if (typeof dataElement !== "undefined") {
      if (dataElement.undefinedLength) {
        let numberOfFrames = 1;
        if (typeof this._dicomElements["x00280008"] !== "undefined") {
          numberOfFrames = parseInt(MyUtil.cleanString(this._dicomElements["x00280008"].value[0]));
        }
        const pixItems = dataElement.value;
        if (pixItems.length > 1 && pixItems.length > numberOfFrames) {
          // concatenate pixel data items
          // concat does not work on typed arrays
          //this.pixelBuffer = this.pixelBuffer.concat( dataElement.data );
          // manual concat...
          const nItemPerFrame = pixItems.length / numberOfFrames;
          const newPixItems = [];
          let index = 0;
          for (let f = 0; f < numberOfFrames; ++f) {
            index = f * nItemPerFrame;
            // calculate the size of a frame
            let size = 0;
            for (let i = 0; i < nItemPerFrame; ++i) {
              size += pixItems[index + i].length;
            }
            // create new buffer
            const newBuffer = new pixItems[0].constructor(size);
            // fill new buffer
            let fragOffset = 0;
            for (let j = 0; j < nItemPerFrame; ++j) {
              newBuffer.set(pixItems[index + j], fragOffset);
              fragOffset += pixItems[index + j].length;
            }
            newPixItems[f] = newBuffer;
          }
          // store as pixel data
          dataElement.value = newPixItems;
        }
      }
    }
  }

  setDecoderCharacterSet(characterSet: string) {
    /**
     * The text decoder.
     *
     * @external TextDecoder
     * @see https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder
     */
    this._textDecoder = new TextDecoder(characterSet);
  }

  // Prototype
  getRawDicomElements(): tDicomElement[] {
    return this._dicomElements;
  }

  getDicomElements(): DicomDS {
    return new DicomDS(this._dicomElements);
  }

  /**
   * Read a DICOM tag.
   * @returns {iTag} An object containing the tag and the end offset.
   */
  readTag(reader: DataReader, offset: number): iTag {
    // group
    const group = reader.readHex(offset);
    offset += Uint16Array.BYTES_PER_ELEMENT;
    // element
    const element = reader.readHex(offset);
    offset += Uint16Array.BYTES_PER_ELEMENT;

    const res: iTag = {
      tag: new DicomTag(group, element),
      endOffset: offset,
    };

    // return
    return res;
  }

  /**
   * Read an item data element.
   *
   * @param {dwv.dicom.DataReader} reader The raw data reader.
   * @param {number} offset The offset where to start to read.
   * @param {boolean} implicit Is the DICOM VR implicit?
   * @returns {object} The item data as a list of data elements.
   */
  readItemDataElement(reader: DataReader, offset: number, implicit: boolean): DicomItem {
    const itemData: tDicomElement = {};

    // read the first item
    let item = this.readDataElement(reader, offset, implicit);
    offset = item.endOffset ? item.endOffset : 0;

    // exit if it is a sequence delimitation item
    if (isSequenceDelimitationItemTag(item.tag)) {
      const res = new DicomItem(itemData, 0, undefined, true);
      return res;
    }

    // store item (mainly to keep vl)
    itemData[item.tag.getKey()] = new DicomElement(item.tag, "NONE", item.vl);
    itemData[item.tag.getKey()].undefinedLength = item.undefinedLength;

    if (!item.undefinedLength) {
      // explicit VR item: read until the end offset
      const endOffset = offset;
      offset -= item.vl ? item.vl : 0;
      while (offset < endOffset) {
        item = this.readDataElement(reader, offset, implicit);
        offset = item.endOffset ? item.endOffset : 0;
        itemData[item.tag.getKey()] = item;
      }
    } else {
      // implicit VR item: read until the item delimitation item
      let isItemDelim = false;
      while (!isItemDelim) {
        item = this.readDataElement(reader, offset, implicit);
        offset = item.endOffset ? item.endOffset : 0;
        isItemDelim = isItemDelimitationItemTag(item.tag);
        if (!isItemDelim) {
          itemData[item.tag.getKey()] = item;
        }
      }
    }

    return new DicomItem(itemData, offset, undefined, false);
  }

  /**
   * Read the pixel item data element.
   * Ref: [Single frame fragments]{@link http://dicom.nema.org/dicom/2013/output/chtml/part05/sect_A.4.html#table_A.4-1}.
   */
  readPixelItemDataElement(reader: DataReader, offset: number, implicit: boolean): DicomItem {
    const itemData: DicomElement[] = [];

    // first item: basic offset table
    let item: DicomElement = this.readDataElement(reader, offset, implicit);
    const offsetTableVl = item.vl ? item.vl : 0;
    let ResOffset: number = item.endOffset ? item.endOffset : 0;

    // read until the sequence delimitation item
    let isSeqDelim = false;
    while (!isSeqDelim) {
      item = this.readDataElement(reader, ResOffset, implicit);
      ResOffset = item.endOffset ? item.endOffset : 0;
      isSeqDelim = isSequenceDelimitationItemTag(item.tag);
      if (!isSeqDelim) {
        // force pixel item vr to OB
        item.vr = "OB";
        itemData.push(item);
      }
    }

    return new DicomItem(itemData, ResOffset, offsetTableVl);
  }

  /**
   * Read a DICOM data element.
   * Reference: [DICOM VRs]{@link http://dicom.nema.org/dicom/2013/output/chtml/part05/sect_6.2.html#table_6.2-1}.
   * @returns {object} An object containing the element
   *   'tag', 'vl', 'vr', 'data' and 'endOffset'.
   */
  readDataElement(reader: DataReader, offset: number, implicit: boolean): DicomElement {
    // Tag: group, element
    const readTagRes: iTag = this.readTag(reader, offset);
    const tag = readTagRes.tag;
    offset = readTagRes.endOffset;

    // Value Representation (VR)
    let vr = null;
    let is32bitVLVR = false;
    if (tag.isWithVR()) {
      // implicit VR
      if (implicit) {
        vr = tag.getVrFromDictionary();
        if (vr === null) {
          vr = "UN";
        }
        is32bitVLVR = true;
      } else {
        vr = this.decodeString(reader.readUint8Array(offset, 2));
        offset += 2 * Uint8Array.BYTES_PER_ELEMENT;
        is32bitVLVR = this.is32bitVLVR(vr);
        // reserved 2 bytes
        if (is32bitVLVR) {
          offset += 2 * Uint8Array.BYTES_PER_ELEMENT;
        }
      }
    } else {
      vr = "NONE";
      is32bitVLVR = true;
    }

    // Value Length (VL)
    let vl = 0;
    if (is32bitVLVR) {
      vl = reader.readUint32(offset);
      offset += Uint32Array.BYTES_PER_ELEMENT;
    } else {
      vl = reader.readUint16(offset);
      offset += Uint16Array.BYTES_PER_ELEMENT;
    }

    // check the value of VL
    let undefinedLength = false;
    if (vl === 0xffffffff) {
      undefinedLength = true;
      vl = 0;
    }

    // treat private tag with unknown VR and zero VL as a sequence (see #799)
    if (tag.isPrivate() && vr === "UN" && vl === 0) {
      vr = "SQ";
    }

    let startOffset = offset;
    let endOffset = startOffset + vl;

    const items: Array<DicomItem> = [];

    // read sequence elements
    let data = null;
    if (isPixelDataTag(tag) && undefinedLength) {
      // pixel data sequence (implicit)
      const pixelItem = this.readPixelItemDataElement(reader, offset, implicit);
      offset = pixelItem.endOffset;
      startOffset += pixelItem.offsetTableVl ? pixelItem.offsetTableVl : 0;
      data = pixelItem.data;
      endOffset = offset;
      vl = offset - startOffset;
      items.push(pixelItem);
    } else if (vr === "SQ") {
      // sequence
      data = [] as tDicomElement[];
      let itemData: DicomItem;
      if (!undefinedLength) {
        if (vl !== 0) {
          // explicit VR sequence: read until the end offset
          const sqEndOffset = offset + vl;
          while (offset < sqEndOffset) {
            itemData = this.readItemDataElement(reader, offset, implicit);

            data.push(itemData.data);
            offset = itemData.endOffset ? itemData?.endOffset : 0;
          }
          endOffset = offset;
          vl = offset - startOffset;
        }
      } else {
        // implicit VR sequence: read until the sequence delimitation item
        let isSeqDelim = false;
        while (!isSeqDelim) {
          const item = this.readItemDataElement(reader, offset, implicit);

          data.push(item.data);
          offset = item.endOffset ? item?.endOffset : 0;

          isSeqDelim = item.isSeqDelim ? item.isSeqDelim : false;
          offset = item.endOffset ? item.endOffset : 0;
          // do not store the delimitation item
          if (!isSeqDelim) {
            data.push(item.data);
          }

          items.push(item);
        }
        endOffset = offset;
        vl = offset - startOffset;
      }
    }

    // return
    const element: DicomElement = new DicomElement(tag, vr, vl, startOffset, endOffset);

    // only set if true (only for sequences and items)
    if (undefinedLength) {
      element.undefinedLength = undefinedLength;
    }
    if (data) {
      //element.setItems(data);
      element.setItems(items);
    }
    return element;
  }

  interpretElement(
    element: DicomElement,
    reader: DataReader,
    pixelRepresentation?: number,
    bitsAllocated?: number
  ): tElementValueType {
    const tag = element.tag;
    const vl = element.vl ? element.vl : 0;
    const vr = element.vr;
    const offset = element.startOffset ? element.startOffset : 0;

    // data
    let data = null;
    const isPixelData = isPixelDataTag(tag);
    const vrType = MyType.vrType[vr];
    if (isPixelData) {
      if (element.undefinedLength) {
        // implicit pixel data sequence
        data = [];

        if (element.items != undefined) {
          for (let j = 0; j < element.items.length; ++j) {
            const item = element.items[j];

            if (item.data instanceof Array) {
              for (const element of item.data) {
                data.push(this.interpretElement(element, reader, pixelRepresentation, bitsAllocated));
              }
            } else {
              const element = item.data as DicomElement;
              data.push(this.interpretElement(element, reader, pixelRepresentation, bitsAllocated));
            }
          }

          delete element.items;
        }

        // for (let j = 0; j < element.items.length; ++j) {
        //   data.push(this.interpretElement(element.items[j], reader, pixelRepresentation, bitsAllocated));
        // }
        // // remove non parsed items
        // delete element.items;
      } else {
        // check bits allocated and VR
        // https://dicom.nema.org/medical/dicom/2022a/output/chtml/part05/sect_A.2.html
        if (bitsAllocated != undefined && bitsAllocated > 8 && vr === "OB") {
          console.log("Reading DICOM pixel data with bitsAllocated>8 and OB VR.");
        }
        // read
        data = [];

        if (bitsAllocated === 1) {
          data.push(reader.readBinaryArray(offset, vl));
        } else if (bitsAllocated === 8) {
          if (pixelRepresentation === 0) {
            data.push(reader.readUint8Array(offset, vl));
          } else {
            data.push(reader.readInt8Array(offset, vl));
          }
        } else if (bitsAllocated === 16) {
          if (pixelRepresentation === 0) {
            data.push(reader.readUint16Array(offset, vl));
          } else {
            data.push(reader.readInt16Array(offset, vl));
          }
        } else {
          throw new Error("Unsupported bits allocated: " + bitsAllocated);
        }
      }
    } else if (typeof vrType !== "undefined") {
      if (vrType === "Uint8") {
        data = reader.readUint8Array(offset, vl);
      } else if (vrType === "Uint16") {
        data = reader.readUint16Array(offset, vl);
      } else if (vrType === "Uint32") {
        data = reader.readUint32Array(offset, vl);
      } else if (vrType === "Uint64") {
        data = reader.readUint64Array(offset, vl);
      } else if (vrType === "Int16") {
        data = reader.readInt16Array(offset, vl);
      } else if (vrType === "Int32") {
        data = reader.readInt32Array(offset, vl);
      } else if (vrType === "Int64") {
        data = reader.readInt64Array(offset, vl);
      } else if (vrType === "Float32") {
        data = reader.readFloat32Array(offset, vl);
      } else if (vrType === "Float64") {
        data = reader.readFloat64Array(offset, vl);
      } else if (vrType === "string") {
        const stream = reader.readUint8Array(offset, vl);
        if (MyType.charSetString.includes(vr)) {
          data = this.decodeSpecialString(stream);
        } else {
          data = this.decodeString(stream);
        }
        data = data.split("\\");
      } else {
        throw Error("Unknown VR type: " + vrType);
      }
    } else if (vr === "ox") {
      // OB or OW
      if (bitsAllocated === 8) {
        data = reader.readUint8Array(offset, vl);
      } else {
        data = reader.readUint16Array(offset, vl);
      }
    } else if (vr === "xs") {
      // US or SS
      if (pixelRepresentation === 0) {
        data = reader.readUint16Array(offset, vl);
      } else {
        data = reader.readInt16Array(offset, vl);
      }
    } else if (vr === "AT") {
      // attribute
      const raw: Uint16Array | null = reader.readUint16Array(offset, vl);
      data = [];

      if (raw != undefined && raw != null) {
        for (let i = 0, leni = raw.length; i < leni; i += 2) {
          const stri = raw[i].toString(16);
          const stri1 = raw[i + 1].toString(16);
          let str = "(";
          str += "0000".substring(0, 4 - stri.length) + stri.toUpperCase();
          str += ",";
          str += "0000".substring(0, 4 - stri1.length) + stri1.toUpperCase();
          str += ")";
          data.push(str);
        }
      }
    } else if (vr === "SQ") {
      // sequence
      data = [];

      if (element.items != undefined && element.items != null) {
        for (let k = 0; k < element.items.length; ++k) {
          const item = element.items[k];
          const itemData: tDicomElement = [];
          const keys = Object.keys(item);
          for (let l = 0; l < keys.length; ++l) {
            const subElement: DicomElement = item[keys[l]];
            subElement.value = this.interpretElement(subElement, reader, pixelRepresentation, bitsAllocated);
            itemData[keys[l]] = subElement;
          }
          data.push(itemData);
        }

        delete element.items;
      }

      // remove non parsed elements
    } else if (vr === "NONE") {
      // no VR -> no data
      data = [];
    } else {
      console.log("Unknown VR: " + vr);
    }

    if (data == null || data == undefined) return null;

    return data;
  }

  //////////////////////////////////////////////////////////
  ////// Utils /////////////////////////////////////////////
  //// Need to think that they should be seperated in utils.
  //////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////

  // For Data elements
  getDataElementPrefixByteSize(vr: string, isImplicit: boolean) {
    return isImplicit ? 8 : this.is32bitVLVR(vr) ? 12 : 8;
  }

  is32bitVLVR(vr: string) {
    return MyType.vr32bitVL.includes(vr);
  }

  cleanStringfunction(inputStr: string) {
    let res = inputStr;
    if (inputStr) {
      // trim spaces
      res = inputStr.trim();
      // get rid of ending zero-width space (u200B)
      //if (res[res.length - 1] === String.fromCharCode("u200B")) {
      if (res[res.length - 1] === String.fromCharCode(0x200b)) {
        res = res.substring(0, res.length - 1);
      }
    }
    return res;
  }

  getUtfLabel(charSetTerm: string) {
    let label = "utf-8";
    if (charSetTerm === "ISO_IR 100") {
      label = "iso-8859-1";
    } else if (charSetTerm === "ISO_IR 101") {
      label = "iso-8859-2";
    } else if (charSetTerm === "ISO_IR 109") {
      label = "iso-8859-3";
    } else if (charSetTerm === "ISO_IR 110") {
      label = "iso-8859-4";
    } else if (charSetTerm === "ISO_IR 144") {
      label = "iso-8859-5";
    } else if (charSetTerm === "ISO_IR 127") {
      label = "iso-8859-6";
    } else if (charSetTerm === "ISO_IR 126") {
      label = "iso-8859-7";
    } else if (charSetTerm === "ISO_IR 138") {
      label = "iso-8859-8";
    } else if (charSetTerm === "ISO_IR 148") {
      label = "iso-8859-9";
    } else if (charSetTerm === "ISO_IR 13") {
      label = "shift-jis";
    } else if (charSetTerm === "ISO_IR 166") {
      label = "iso-8859-11";
    } else if (charSetTerm === "ISO 2022 IR 87") {
      label = "iso-2022-jp";
    } else if (charSetTerm === "ISO 2022 IR 149") {
      // not supported by TextDecoder when it says it should...
      label = "iso-2022-kr";
    } else if (charSetTerm === "ISO 2022 IR 58") {
      // not supported by TextDecoder...
      label = "iso-2022-cn";
    } else if (charSetTerm === "ISO_IR 192") {
      label = "utf-8";
    } else if (charSetTerm === "GB18030") {
      label = "gb18030";
    } else if (charSetTerm === "GB2312") {
      label = "gb2312";
    } else if (charSetTerm === "GBK") {
      label = "chinese";
    }
    return label;
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

  getReverseOrientation(ori: string): string | null {
    if (!ori) {
      return null;
    }
    // reverse labels
    const rlabels = {
      L: "R",
      R: "L",
      A: "P",
      P: "A",
      H: "F",
      F: "H",
    };

    let rori = "";
    for (let n = 0; n < ori.length; n++) {
      const o = ori.substring(n, n + 1);
      const r = rlabels[o];
      if (r) {
        rori += r;
      }
    }

    console.log("getReverseOrientation", rori);

    // return
    return rori;
  }

  getOrientationName(orientation: Array<number>) {
    const axialOrientation = [1, 0, 0, 0, 1, 0];
    const coronalOrientation = [1, 0, 0, 0, 0, -1];
    const sagittalOrientation = [0, 1, 0, 0, 0, -1];
    let name;
    if (MyUtil.arrayEquals<number>(orientation, axialOrientation)) {
      name = "axial";
    } else if (MyUtil.arrayEquals<number>(orientation, coronalOrientation)) {
      name = "coronal";
    } else if (MyUtil.arrayEquals<number>(orientation, sagittalOrientation)) {
      name = "sagittal";
    }
    return name;
  }

  //////////////////////////////////////////////////////////////////
  //#region [TransferSyntax]
  isImplicitTransferSyntax(syntax: string) {
    return syntax === "1.2.840.10008.1.2";
  }

  isReadSupportedTransferSyntax(syntax: string) {
    // Unsupported:
    // "1.2.840.10008.1.2.1.99": Deflated Explicit VR - Little Endian
    // "1.2.840.10008.1.2.4.100": MPEG2 Image Compression
    // dwv.dicom.isJpegRetiredTransferSyntax(syntax): non supported JPEG
    // dwv.dicom.isJpeglsTransferSyntax(syntax): JPEG-LS

    return (
      syntax === "1.2.840.10008.1.2" || // Implicit VR - Little Endian
      syntax === "1.2.840.10008.1.2.1" || // Explicit VR - Little Endian
      syntax === "1.2.840.10008.1.2.2" || // Explicit VR - Big Endian
      this.isJpegBaselineTransferSyntax(syntax) || // JPEG baseline
      this.isJpegLosslessTransferSyntax(syntax) || // JPEG Lossless
      this.isJpeg2000TransferSyntax(syntax) || // JPEG 2000
      this.isRleTransferSyntax(syntax)
    ); // RLE
  }

  // ref: https://groups.google.com/g/comp.protocols.dicom/c/bBwZBmOLdDU
  // Group (0008) is big endian
  // Group (0800) is little endian
  guessTransferSyntaxType(firstDataElement: DicomElement) {
    const oEightGroupBigEndian = "0x0800";
    const oEightGroupLittleEndian = "0x0008";
    // check that group is 0x0008
    const group = firstDataElement.tag.getGroup();
    if (group !== oEightGroupBigEndian && group !== oEightGroupLittleEndian) {
      throw new Error("Not a valid DICOM file (no magic DICM word found" + " and first element not in 0x0008 group)");
    }
    // reasonable assumption: 2 uppercase characters => explicit vr
    const vr = firstDataElement.vr;
    const vr0 = vr.charCodeAt(0);
    const vr1 = vr.charCodeAt(1);
    // ASCII: [65]: A, [90]: Z
    const implicit = vr0 >= 65 && vr0 <= 90 && vr1 >= 65 && vr1 <= 90 ? false : true;
    // guess transfer syntax

    let transferSyntaxType = MyType.eTransferSyntaxType.transfer_syntax_invalid;

    if (group === oEightGroupLittleEndian) {
      if (implicit) {
        // ImplicitVRLittleEndian
        transferSyntaxType = MyType.eTransferSyntaxType.transfer_syntax_implicit;
      } else {
        // ExplicitVRLittleEndian
        transferSyntaxType = MyType.eTransferSyntaxType.transfer_syntax_explicit;
      }
    } else {
      if (implicit) {
        // ImplicitVRBigEndian: impossible
        throw new Error("Not a valid DICOM file (no magic DICM word found" + "and implicit VR big endian detected)");
      } else {
        // ExplicitVRBigEndian
        transferSyntaxType = MyType.eTransferSyntaxType.transfer_syntax_explicit_big_endian;
      }
    }

    const transferSyntax = this.getTransferSyntaxFromType(transferSyntaxType);
    const syntax = transferSyntax.uid;

    // set transfer syntax data element
    const dataElement: DicomElement = new DicomElement(new DicomTag("0x0002", "0x0010"), "UI");
    dataElement.value = [syntax + " "]; // even length
    dataElement.vl = dataElement.value[0].length;
    dataElement.startOffset = firstDataElement.startOffset;

    if (dataElement.startOffset !== undefined) {
      dataElement.endOffset = dataElement?.startOffset + dataElement.vl;
    }

    return dataElement;
  }

  getTransferSyntaxType(syntax: string): MyType.eTransferSyntaxType {
    for (const transferSyntax of MyType.transferSyntaxes) {
      if (syntax == transferSyntax.uid) return transferSyntax.type;
    }

    return MyType.eTransferSyntaxType.transfer_syntax_invalid;
  }

  getTransferSyntaxName(syntax: string): string {
    for (const transferSyntax of MyType.transferSyntaxes) {
      if (syntax == transferSyntax.uid) return transferSyntax.name;
    }

    return "Unknown";
  }

  getTransferSyntaxFromType(type: MyType.eTransferSyntaxType): MyType.iTrnasferSyntax {
    for (const transferSyntax of MyType.transferSyntaxes) {
      if (type == transferSyntax.type) return transferSyntax;
    }

    return MyType.transferSyntaxes[0]; //invalid
  }

  //#region [TransferSyntax - JPEG]
  isBigEndianTransferSyntax(syntax: string) {
    const type = this.getTransferSyntaxType(syntax);
    return type === MyType.eTransferSyntaxType.transfer_syntax_explicit_big_endian; // "1.2.840.10008.1.2.2";
  }

  isJpegBaselineTransferSyntax(syntax: string) {
    const type = this.getTransferSyntaxType(syntax);
    return (
      type === MyType.eTransferSyntaxType.transfer_syntax_jpeg_base_proc_1 ||
      type == MyType.eTransferSyntaxType.transfer_syntax_jpeg_base_proc_2_4
    );
  }

  isJpegLosslessTransferSyntax(syntax: string) {
    const type = this.getTransferSyntaxType(syntax);
    return (
      type === MyType.eTransferSyntaxType.transfer_syntax_jpeg_lossless_non_hir_14 ||
      type == MyType.eTransferSyntaxType.transfer_syntax_jpeg_lossless_non_hir_first_order_14
    );
  }

  // For JPEG-LS
  isJpeglsTransferSyntax(syntax: string) {
    const type = this.getTransferSyntaxType(syntax);
    return (
      type === MyType.eTransferSyntaxType.transfer_syntax_jpeg_ls_lossless ||
      type == MyType.eTransferSyntaxType.transfer_syntax_jpeg_ls_lossy
    );
  }

  isJpeg2000TransferSyntax(syntax: string) {
    const type = this.getTransferSyntaxType(syntax);
    return (
      type === MyType.eTransferSyntaxType.transfer_syntax_jpeg_2000_lossless ||
      type == MyType.eTransferSyntaxType.transfer_syntax_jpeg_2000 ||
      type == MyType.eTransferSyntaxType.transfer_syntax_jpeg_2000_part2_lossless ||
      type == MyType.eTransferSyntaxType.transfer_syntax_jpeg_2000_part2 ||
      type == MyType.eTransferSyntaxType.transfer_syntax_jpip_refer ||
      type == MyType.eTransferSyntaxType.transfer_syntax_jpip_refer_deflate
    );
  }

  isRleTransferSyntax(syntax: string) {
    const type = this.getTransferSyntaxType(syntax);
    return type === MyType.eTransferSyntaxType.transfer_syntax_rle_lossless;
  }

  isJpegRetiredTransferSyntax(syntax: string) {
    for (const transferSyntax of MyType.transferSyntaxes) {
      if (syntax == transferSyntax.uid) {
        if (transferSyntax.isRetired == undefined || !transferSyntax.isRetired) return false;

        return true;
      }
    }

    return false;
  }

  getSyntaxDecompressionName(syntax: string) {
    let algo = null;
    if (this.isJpeg2000TransferSyntax(syntax)) {
      algo = "jpeg2000";
    } else if (this.isJpegBaselineTransferSyntax(syntax)) {
      algo = "jpeg-baseline";
    } else if (this.isJpegLosslessTransferSyntax(syntax)) {
      algo = "jpeg-lossless";
    } else if (this.isRleTransferSyntax(syntax)) {
      algo = "rle";
    }
    return algo;
  }

  //#endregion

  //#endregion
  //////////////////////////////////////////////////////////////////

  // MyUtils.uint8ArrayToString
  // uint8ArrayToString(arr: Uint8Array) {
  //   return String.fromCharCode(...arr);
  // }
}
