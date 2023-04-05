import type { tDicomElement } from "./DicomElement";

export interface iItemData {
  // for Pixel Data
  data: tDicomElement;
  endOffset: number;
  offsetTableVl?: number;
  //
  isSeqDelim?: boolean;
}

export default class DicomItem implements iItemData {
  // for Pixel Data
  public data: tDicomElement;
  public endOffset: number;
  public offsetTableVl?: number;
  //
  public isSeqDelim?: boolean;

  constructor(data: tDicomElement, endOffset: number, offsetTableVl?: number, isSeqDelim?: boolean) {
    this.data = data;
    this.endOffset = endOffset;
    this.offsetTableVl = offsetTableVl;
    //
    this.isSeqDelim = isSeqDelim;
  }
}
