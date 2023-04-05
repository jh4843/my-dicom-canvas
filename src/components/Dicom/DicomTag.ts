import * as MyType from "@/types";
import DicomElement from "./DicomElement";

export const getTagFromKey = (key: string) => {
  return new DicomTag("0x" + key.substring(1, 5), "0x" + key.substring(5, 9));
};

export const getTransferSyntaxUIDTag = () => {
  return new DicomTag("0x0002", "0x0010");
};

export const getFileMetaInformationGroupLengthTag = () => {
  return new DicomTag("0x0002", "0x0000");
};

export const getItemTag = () => {
  return new DicomTag("0xFFFE", "0xE000");
};

export const getItemDelimitationItemTag = () => {
  return new DicomTag("0xFFFE", "0xE00D");
};

export const getSequenceDelimitationItemTag = () => {
  return new DicomTag("0xFFFE", "0xE0DD");
};

export const isSequenceDelimitationItemTag = (tag: DicomTag) => {
  return tag.equal(getSequenceDelimitationItemTag());
};

export const getPixelDataTag = () => {
  return new DicomTag("0x7FE0", "0x0010");
};

export const isPixelDataTag = (tag: DicomTag) => {
  return tag.equal(getPixelDataTag());
};

export const isFileMetaInformationGroupLengthTag = (tag: DicomTag) => {
  return tag.equal(getFileMetaInformationGroupLengthTag());
};

export const isItemDelimitationItemTag = (tag: DicomTag) => {
  return tag.equal(getItemDelimitationItemTag());
};

export const getTagFromDictionary = (tagName: string): DicomTag | null => {
  if (tagName === undefined || tagName === null) {
    return null;
  }
  let group = null;
  let element = null;
  const dict: MyType.iTagDictionary = MyType.tagDictionary;
  const groupKeys = Object.keys(dict);
  let elementKeys = null;
  let foundTag = false;

  let info: MyType.tTagElementInfo = undefined;

  // search through dictionary
  for (let iGroup = 0, lenGroupKey = groupKeys.length; iGroup < lenGroupKey; ++iGroup) {
    group = groupKeys[iGroup];
    elementKeys = Object.keys(dict[group]);

    if (group == undefined) continue;

    if (dict[group] == undefined) continue;

    for (let iElement = 0, lenK1 = elementKeys.length; iElement < lenK1; ++iElement) {
      element = elementKeys[iElement];

      if (element == undefined) continue;

      if (dict[group][element] === undefined) continue;

      info = dict[group][element];

      if (info == undefined || info.length < 3) continue;

      if (info[2] === tagName) {
        foundTag = true;
        break;
      }
    }
    if (foundTag) {
      break;
    }
  }
  let tag = null;
  if (foundTag) {
    if (group != undefined && element != undefined) {
      tag = new DicomTag(group, element);
    }
  }
  return tag;
};

export default class DicomTag {
  private _group: string; // Group (format: 0x####)
  private _element: string; // Element (format: 0x####)

  constructor(group: string, element: string) {
    if (!group || typeof group === "undefined") {
      throw new Error("Cannot create tag with no group.");
    }
    if (group.length !== 6 || !group.startsWith("0x")) {
      throw new Error("Cannot create tag with badly formed group.");
    }
    if (!element || typeof element === "undefined") {
      throw new Error("Cannot create tag with no element.");
    }
    if (element.length !== 6 || !element.startsWith("0x")) {
      throw new Error("Cannot create tag with badly formed element.");
    }

    this._group = group;
    this._element = element;
  }

  getGroup(): string {
    return this._group;
  }

  getElement(): string {
    return this._element;
  }

  equal(rhs: DicomTag) {
    return this.getGroup() === rhs.getGroup() && this.getElement() === rhs.getElement();
  }

  tagCompareFunction(a: DicomTag, b: DicomTag) {
    // first by group
    let res = parseInt(a.getGroup()) - parseInt(b.getGroup());
    if (res === 0) {
      // by element if same group
      res = parseInt(a.getElement()) - parseInt(b.getElement());
    }
    return res;
  }

  // Get the group-element key used to store DICOM elements.
  // old: getKey
  getKey() {
    // group and element are in the '0x####' form
    return "x" + this.getGroup().substring(2) + this.getElement().substring(2);
  }

  // Get a simplified group-element key.
  // old: getKey
  getKeyOnly() {
    // group and element are in the '0x####' form
    return this.getGroup().substring(2) + this.getElement().substring(2);
  }

  getGroupName() {
    return MyType.tagGroups[this.getGroup().substring(1)];
  }

  isWithVR(): boolean {
    const element = this.getElement();
    const res = !(
      this.getGroup() === "0xFFFE" &&
      (element === "0xE000" || element === "0xE00D" || element === "0xE0DD")
    );
    return res;
  }

  isPrivate() {
    // group is in the '0x####' form
    const groupNumber = parseInt(this.getGroup().substring(2), 16);
    return groupNumber % 2 === 1;
  }

  getInfoFromDictionary() {
    let info: MyType.tTagElementInfo = undefined;
    if (
      MyType.tagDictionary[this.getGroup()] === undefined &&
      MyType.tagDictionary[this.getGroup()][this.getElement()] === undefined
    ) {
      info = MyType.tagDictionary[this.getGroup()][this.getElement()];
    }
    return info;
  }

  getVrFromDictionary() {
    let vr = null;
    const info = this.getInfoFromDictionary();
    if (info !== undefined && info.length > 0) {
      vr = info[0];
    }
    return vr;
  }

  getNameFromDictionary() {
    let name = null;
    const info = this.getInfoFromDictionary();
    if (info !== undefined && info.length > 2) {
      name = info[2];
    }
    return name;
  }

  getDicomElements() {
    const info = this.getInfoFromDictionary();

    if (info == undefined || info[0] == undefined) return null;

    const res: DicomElement = new DicomElement(this, info[0], Number(info[1]));

    return res;
  }
}
