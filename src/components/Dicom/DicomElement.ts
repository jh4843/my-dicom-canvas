import type DicomTag from "./DicomTag";
import * as MyType from "@/types";
import type DicomItem from "./DicomItem";

export type tElementValueType = string[] | number[] | DicomElement[] | MyType.tImageBufferType;

export interface iElement {
  tag: DicomTag;
  vr: MyType.tVrType;
  value?: tElementValueType;
  vl?: number;
  startOffset?: number;
  endOffset?: number;
}

export type tDicomElement = { [key: string]: DicomElement } | DicomElement | DicomElement[];

export default class DicomElement implements iElement {
  public tag: DicomTag;
  public vr: MyType.tVrType;
  public vl?: number;
  public startOffset?: number;
  public endOffset?: number;
  public undefinedLength: boolean;

  public value?: tElementValueType;
  public items?: DicomItem[];

  constructor(_tag: DicomTag, _vr: string, _vl?: number, _startOffset?: number, _endOffset?: number) {
    this.tag = _tag;
    this.vr = _vr;
    this.vl = _vl;
    this.startOffset = _startOffset;
    this.endOffset = _endOffset;
    this.undefinedLength = false;
  }

  //#region FOR_ELEMENT_VALUE
  setValue(_val: tElementValueType) {
    if (_val instanceof Array<DicomElement>) {
      if (_val.length == 1 && _val[0] instanceof DicomElement) {
        if (_val[0].tag.getGroup() == "xFFFEE000") {
          this[_val[0].tag.getGroup()] = _val[0].value as DicomElement[];
        }
      }
    } else {
      this.value = _val;
    }
  }

  getValueType(): MyType.eValueType {
    let res = MyType.eValueType.val_type_null;

    if (this.value == undefined || this.value == null) {
      res = MyType.eValueType.val_type_null;
    } else if (typeof this.value == "string") {
      res = MyType.eValueType.val_type_arr_string;
    } else if (typeof this.value == "number") {
      res = MyType.eValueType.val_type_number;
    } else if (this.isValueArrayType()) {
      if (this.value.length > 0) {
        if (typeof this.value[0] == "string") {
          res = MyType.eValueType.val_type_arr_string;
        } else if (typeof this.value[0] == "number") {
          res = MyType.eValueType.val_type_arr_number;
        }
      }
      res = MyType.eValueType.val_type_null;
    }

    return res;
  }

  getValueLength(): number {
    const res = 0;
    const type = this.getValueType();

    if (type == MyType.eValueType.val_type_null) {
      return 0;
    } else if (type == MyType.eValueType.val_type_string || type == MyType.eValueType.val_type_number) {
      return 1;
    } else {
      if (this.value) {
        return this.value?.length;
      }
    }

    return res;
  }

  isValueArrayType(): boolean {
    // const type = this.getValueType();
    // if (type == MyType.eValueType.val_type_arr_string || type == MyType.eValueType.val_type_arr_number) {
    //   return true;
    // }

    return Array.isArray(this.value);
  }
  //#endregion

  //#region FOR_ELEMENT_ITEM
  setItems(_items: DicomItem[]) {
    this.items = _items;
  }
  //#endregion

  //#region ETC
  isUndefinedLength(): boolean {
    if (this.undefinedLength) return true;

    if (this.vl === undefined || this.vl === 0xffffffff || this.vl === 0) {
      return true;
    }

    return false;
  }
  //#endregion
}
