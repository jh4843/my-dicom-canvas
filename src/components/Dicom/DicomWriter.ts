import * as MyType from "@/types";
import type DicomElement from "./DicomElement";
import { getVersion } from "./DicomParser";

export const getQXLinkUIDPrefix = () => {
  return "1.3.6.1.4.1.19179.9";
};

export class DefaultTextEncoder {
  private _encode;

  get encode() {
    return this._encode;
  }

  constructor() {
    this._encode = function (str: string) {
      const result = new Uint8Array(str.length);
      for (let i = 0, leni = str.length; i < leni; ++i) {
        result[i] = str.charCodeAt(i);
      }
      return result;
    };
  }
}

export enum eDicomWriteAction {
  dicom_write_action_invalid = 0,
  //
  dicom_write_action_copy,
  dicom_write_action_remove,
  dicom_write_action_clear,
  dicom_write_action_replace,
  //
}

export interface iAnonymizeRule {
  _action?: number;
  _value?: string | number;
}

export class AnonimizeRule {
  private _action: eDicomWriteAction;
  private _value?: string | number | null;

  constructor(act: eDicomWriteAction, val?: string | number | null) {
    this._action = act;
    this._value = val;
  }

  public act(item) {
    switch (this._action) {
      case eDicomWriteAction.dicom_write_action_copy:
        return item;
      case eDicomWriteAction.dicom_write_action_remove:
        return null;
      case eDicomWriteAction.dicom_write_action_clear:
        item.value = [];
        return item;
      case eDicomWriteAction.dicom_write_action_replace:
        item.value = [this._value];
        return item;
      case eDicomWriteAction.dicom_write_action_invalid:
      default:
        break;
    }
    return item;
  }
}

export default class DicomWriter {
  private _uidCount = 0;
  // flag to use VR-UN for private sequence (default: false)
  private _useUnVrForPrivatedSq;
  private _defaultTextEncoder: DefaultTextEncoder;
  private _textEncoder: DefaultTextEncoder | TextEncoder;

  private _rules;
  private _defaultRules;

  constructor() {
    this._uidCount = 0;
    this._useUnVrForPrivatedSq = false;
    this._defaultRules = {
      default: new AnonimizeRule(eDicomWriteAction.dicom_write_action_copy, null),
    };
    this._rules = this._defaultRules;
    this._defaultTextEncoder = new DefaultTextEncoder();
    this._textEncoder = this._defaultTextEncoder;
  }

  // actions = {
  //   copy: function (item) {
  //     return item;
  //   },
  //   remove: function () {
  //     return null;
  //   },
  //   clear: function (item) {
  //     item.value = [];
  //     return item;
  //   },
  //   replace: function (item, value) {
  //     item.value = [value];
  //     return item;
  //   },
  // };

  //Encoding
  encodeString(str: string) {
    return this._defaultTextEncoder.encode(str);
  }

  encodeSpecialString(str: string) {
    return this._textEncoder.encode(str);
  }

  // element
  getElementToWrite(element: DicomElement) {
    // get group and tag string name
    const groupName = element.tag.getGroupName();
    const tagName = element.tag.getNameFromDictionary();

    // apply rules:
    let rule;
    if (typeof this._rules[element.tag.getKey()] !== "undefined") {
      // 1. tag itself
      rule = this._rules[element.tag.getKey()];
    } else if (tagName !== null && typeof this._rules[tagName] !== "undefined") {
      // 2. tag name
      rule = this._rules[tagName];
    } else if (typeof this._rules[groupName] !== "undefined") {
      // 3. group name
      rule = this._rules[groupName];
    } else {
      // 4. default
      rule = this._rules["default"];
    }
    // apply action on element and return
    return this.anonymizeRule[rule.action](element, rule.value);
  }

  public anonymizeRule = {
    default: new AnonimizeRule(eDicomWriteAction.dicom_write_action_remove, null),
    PatientName: new AnonimizeRule(eDicomWriteAction.dicom_write_action_replace, "Anonymized"),
    Acquisition: new AnonimizeRule(eDicomWriteAction.dicom_write_action_copy, null),
    Procedure: new AnonimizeRule(eDicomWriteAction.dicom_write_action_copy, null),
  };

  // Utils
  getUID(tagName: string): string {
    const prefix = getQXLinkUIDPrefix() + ".";
    let uid = "";
    if (tagName === "ImplementationClassUID") {
      uid = prefix + getVersion();
    } else {
      // date (only numbers), do not keep milliseconds
      const date = new Date().toISOString().replace(/\D/g, "");
      const datePart = "." + date.substring(0, 14);
      // count
      this._uidCount += 1;
      const countPart = "." + this._uidCount;

      // uid = prefix . tag . date . count
      uid = prefix;

      // limit tag part to not exceed 64 length
      const nonTagLength = prefix.length + countPart.length + datePart.length;
      const leni = Math.min(tagName.length, 64 - nonTagLength);
      if (leni > 1) {
        let tagNumber = "";
        for (let i = 0; i < leni; ++i) {
          tagNumber += tagName.charCodeAt(i);
        }
        uid += tagNumber.substring(0, leni);
      }

      // finish
      uid += datePart + countPart;
    }
    return uid;
  }

  isEven(num: number): boolean {
    return num % 2 === 0;
  }

  isTypedArrayVr(vr: string) {
    const vrType = MyType.vrType[vr];
    return typeof vrType !== "undefined" && vrType !== "string";
  }

  isStringVr(vr: string) {
    const vrType = MyType.vrType[vr];
    return typeof vrType !== "undefined" && vrType === "string";
  }

  isVrToPad(vr: string) {
    return this.isStringVr(vr) || vr === "OB";
  }

  getVrPad(vr: string) {
    let pad = " ";
    if (this.isStringVr(vr)) {
      if (vr === "UI") {
        pad = "\0";
      } else {
        pad = " ";
      }
    }
    return pad;
  }

  uint8ArrayPush(arr: Uint8Array, value: number) {
    const newArr = new Uint8Array(arr.length + 1);
    const addArr = new Uint8Array(1);
    addArr[0] = value;

    newArr.set(arr);
    newArr.set(addArr, arr.length);
    return newArr;
  }

  padOBValue(value: Array<Array<string>> | Array<Uint8Array> | Uint8Array) {
    if (value !== null && value != undefined && value.length != undefined) {
      // calculate size and pad if needed
      if (value.length !== 0 && Array.isArray(value[0]) && value[0].length) {
        // handle array of array
        let size: number = 0;
        for (let i = 0; i < value.length; ++i) {
          size += Object.values(value[i]).length;
        }
        // Todo
        // if (!this.isEven(size)) {
        //   if (Array.isArray(value) && value[value.length - 1] instanceof Uint8Array) {
        //     value[value.length - 1] = this.uint8ArrayPush(value[value.length - 1], 0);
        //   }
        // }
      } else {
        if (!this.isEven(value.length)) {
          if (value instanceof Uint8Array) {
            value = this.uint8ArrayPush(value, 0);
          }
        }
      }
    } else {
      throw new Error("Cannot pad undefined or null OB value.");
    }
    // uint8ArrayPush may create a new array so we
    // need to return it
    return value;
  }

  ////
  writeDataElementItems(writer: DicomWriter, byteOffset:number, items:, isImplicit) {
    let item = null;
    for (let i = 0; i < items.length; ++i) {
      item = items[i];
      const itemKeys = Object.keys(item);
      if (itemKeys.length === 0) {
        continue;
      }
      // item element (create new to not modify original)
      let undefinedLength = false;
      if (typeof item["xFFFEE000"].undefinedLength !== "undefined") {
        undefinedLength = item["xFFFEE000"].undefinedLength;
      }
      const itemElement = {
        tag: dwv.dicom.getItemTag(),
        vr: "NONE",
        vl: undefinedLength ? 0xffffffff : item["xFFFEE000"].vl,
        value: [],
      };
      byteOffset = this.writeDataElement(writer, itemElement, byteOffset, isImplicit);
      // write rest
      for (let m = 0; m < itemKeys.length; ++m) {
        if (itemKeys[m] !== "xFFFEE000" && itemKeys[m] !== "xFFFEE00D") {
          byteOffset = this.writeDataElement(writer, item[itemKeys[m]], byteOffset, isImplicit);
        }
      }
      // item delimitation
      if (undefinedLength) {
        const itemDelimElement = {
          tag: dwv.dicom.getItemDelimitationItemTag(),
          vr: "NONE",
          vl: 0,
          value: [],
        };
        byteOffset = this.writeDataElement(writer, itemDelimElement, byteOffset, isImplicit);
      }
    }

    // return new offset
    return byteOffset;
  }
}
