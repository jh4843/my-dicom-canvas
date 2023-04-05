//import type * as MyType from "@/types";
import type DicomTag from "./DicomTag";
import * as MyTag from "./DicomTag";
import * as MyUtil from "@/utils";
import DicomElement, { type tDicomElement } from "./DicomElement";
import ImageSpacing from "../Image/ImageSpacing";

export default class DicomDS {
  private _dicomElements: tDicomElement[];
  private _tag: DicomTag | null;

  constructor(dicomElements: tDicomElement[]) {
    this._dicomElements = dicomElements;
    this._tag = null;
  }

  getDEFromKey(groupElementKey: string): tDicomElement {
    return this._dicomElements[groupElementKey];
  }

  getFromKey(groupElementKey: string, asArray?: boolean) {
    // default
    if (typeof asArray === "undefined") {
      asArray = false;
    }
    let value = null;

    const key: string = groupElementKey;

    const dElement = this._dicomElements[key];
    if (typeof dElement !== "undefined") {
      // raw value if only one
      if (dElement.value.length === 1 && asArray === false) {
        value = dElement.value[0];
      } else {
        value = dElement.value;
      }
    }
    return value;
  }

  getFromName(name: string) {
    let value = null;
    this._tag = MyTag.getTagFromDictionary(name);
    // check that we are not at the end of the dictionary
    if (this._tag !== null) {
      value = this.getFromKey(this._tag.getKey());
    }
    return value;
  }

  getTagName(tag: DicomTag) {
    let name = tag.getNameFromDictionary();
    if (name === null) {
      name = tag.getKeyOnly();
    }
    return name;
  }

  getElementAsObject(dicomElement: DicomElement) {
    // element value
    let value = null;

    const isPixel = MyTag.isPixelDataTag(dicomElement.tag);

    const vr = dicomElement.vr;
    if (vr === "SQ" && typeof dicomElement.value !== "undefined" && !isPixel) {
      value = [];
      const items: Array<any> = [];
      let itemValues = null;

      if (typeof dicomElement.value == "number" || typeof dicomElement.value == "string") {
        items.push(dicomElement.value);
      } else if (dicomElement.value !== null) {
        for (const v of dicomElement.value) {
          items.push(v);
        }
      }

      for (let i = 0; i < items.length; ++i) {
        itemValues = {};
        const keys = Object.keys(items[i]);
        for (let k = 0; k < keys.length; ++k) {
          const itemElement = items[i][keys[k]];
          const key = this.getTagName(itemElement.tag);
          // do not inclure Item elements
          if (key !== "Item") {
            itemValues[key] = this.getElementAsObject(itemElement);
          }
        }
        value.push(itemValues);
      }
    } else {
      value = this.getElementValueAsString(dicomElement);
    }

    // return
    return {
      value: value,
      group: dicomElement.tag.getGroup(),
      element: dicomElement.tag.getElement(),
      vr: vr,
      vl: dicomElement.vl,
    };
  }

  dumpToObject() {
    const keys = Object.keys(this._dicomElements);
    const obj = {};
    let dicomElement = null;
    for (let i = 0, leni = keys.length; i < leni; ++i) {
      dicomElement = this._dicomElements[keys[i]];
      obj[this.getTagName(this._dicomElements[keys[i]].tag)] = this.getElementAsObject(dicomElement);
    }
    return obj;
  }

  ///////////////////////////////////////////////
  // Proto type
  ///////////////////////////////////////////////
  getElementValueAsString(dicomElement: DicomElement, pretty?: boolean) {
    let str = "";
    const strLenLimit = 65;

    // dafault to pretty output
    if (pretty === undefined) {
      pretty = true;
    }
    // check dicom element input
    if (typeof dicomElement === "undefined" || dicomElement === null) {
      return str;
    }

    // Polyfill for Number.isInteger.
    const isInteger =
      Number.isInteger ||
      function (value) {
        return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
      };

    // TODO Support sequences.

    if (dicomElement == undefined || dicomElement.value == undefined) return str;

    if (
      dicomElement.vr !== "SQ" &&
      dicomElement.value != undefined &&
      dicomElement.getValueLength() == 1 &&
      dicomElement.value[0] == ""
    ) {
      str += "(no value available)";
    } else if (MyTag.isPixelDataTag(dicomElement.tag) && dicomElement.isUndefinedLength()) {
      str = "(PixelSequence)";
    } else if (dicomElement.vr === "DA" && pretty && dicomElement.value != undefined) {
      const daValue = dicomElement.value[0];
      // Two possible date formats:
      // - standard 'YYYYMMDD'
      // - non-standard 'YYYY.MM.DD' (previous ACR-NEMA)
      let monthBeginIndex = 4;
      let dayBeginIndex = 6;

      if (typeof daValue == "string") {
        if (daValue.length !== 8) {
          monthBeginIndex = 5;
          dayBeginIndex = 8;
        }
        const da = new Date(
          parseInt(daValue.substring(0, 4), 10),
          parseInt(daValue.substring(monthBeginIndex, monthBeginIndex + 2), 10) - 1, // 0-11 range
          parseInt(daValue.substring(dayBeginIndex, dayBeginIndex + 2), 10)
        );
        str = da.toLocaleDateString();
      }
    } else if (dicomElement.vr === "TM" && pretty) {
      const tmValue = dicomElement.value[0];

      if (typeof tmValue != "string") {
        console.log("getElementValueAsString - Error: type ", typeof tmValue);
        return str;
      }

      const tmHour = tmValue.substring(0, 2);
      const tmMinute = tmValue.length >= 4 ? tmValue.substring(2, 4) : "00";
      const tmSeconds = tmValue.length >= 6 ? tmValue.substring(4, 6) : "00";
      str = tmHour + ":" + tmMinute + ":" + tmSeconds;
    } else {
      let isOtherVR = false;
      if (dicomElement.vr.length !== 0) {
        isOtherVR = dicomElement.vr[0].toUpperCase() === "O";
      }
      const isFloatNumberVR = dicomElement.vr === "FL" || dicomElement.vr === "FD" || dicomElement.vr === "DS";
      let valueStr = "";
      for (let k = 0, lenk = dicomElement.value.length; k < lenk; ++k) {
        valueStr = "";
        if (k !== 0) {
          valueStr += "\\";
        }
        if (isFloatNumberVR) {
          let val = dicomElement.value[k];
          if (typeof val === "string") {
            val = MyUtil.cleanString(val);
          }
          const num = Number(val);
          if (!isInteger(num) && pretty) {
            valueStr += num.toPrecision(4);
          } else {
            valueStr += num.toString();
          }
        } else if (isOtherVR) {
          let tmp = dicomElement.value[k].toString(16);
          if (dicomElement.vr === "OB") {
            tmp = "00".substring(0, 2 - tmp.length) + tmp;
          } else {
            tmp = "0000".substring(0, 4 - tmp.length) + tmp;
          }
          valueStr += tmp;
        } else if (typeof dicomElement.value[k] == "string") {
          valueStr += MyUtil.cleanString(dicomElement.value[k] as string);
        } else {
          valueStr += dicomElement.value[k];
        }
        // check length
        if (str.length + valueStr.length <= strLenLimit) {
          str += valueStr;
        } else {
          str += "...";
          break;
        }
      }
    }
    return str;
  }

  getElementValueAsStringFromKey(groupElementKey: string) {
    const temp = this.getDEFromKey(groupElementKey);

    if (temp instanceof DicomElement) {
      return this.getElementValueAsString(temp);
    } else {
      console.log("getElementValueAsStringFromKey: Error");
    }

    return;
  }

  getElementAsString(dicomElement: DicomElement, prefix: string) {
    // default prefix
    prefix = prefix || "";

    // get tag anme from dictionary
    const tag = dicomElement.tag;
    const tagName = tag.getNameFromDictionary();

    if (dicomElement.value == undefined) return;

    let deSize = dicomElement.value.length;
    let isOtherVR = false;
    if (dicomElement.vr.length !== 0) {
      isOtherVR = dicomElement.vr[0].toUpperCase() === "O";
    }

    // no size for delimitations
    if (MyTag.isItemDelimitationItemTag(dicomElement.tag) || MyTag.isSequenceDelimitationItemTag(dicomElement.tag)) {
      deSize = 0;
    } else if (isOtherVR) {
      deSize = 1;
    }

    const isPixSequence = MyTag.isPixelDataTag(dicomElement.tag) && dicomElement.isUndefinedLength();

    let line = null;

    // (group,element)
    line = "(";
    line += dicomElement.tag.getGroup().substring(2).toLowerCase();
    line += ",";
    line += dicomElement.tag.getElement().substring(2).toLowerCase();
    line += ") ";
    // value representation
    line += dicomElement.vr;
    // value
    if (dicomElement.vr !== "SQ" && dicomElement.value.length === 1 && dicomElement.value[0] === "") {
      line += " (no value available)";
      deSize = 0;
    } else {
      // simple number display
      if (dicomElement.vr === "NA") {
        line += " ";
        line += dicomElement.value[0];
      } else if (isPixSequence) {
        // pixel sequence
        line += " (PixelSequence #=" + deSize + ")";
      } else if (dicomElement.vr === "SQ") {
        line += " (Sequence with";
        if (dicomElement.isUndefinedLength()) {
          line += " undefined";
        } else {
          line += " explicit";
        }
        line += " length #=";
        line += dicomElement.value.length;
        line += ")";
      } else if (
        isOtherVR ||
        dicomElement.vr === "PI" ||
        dicomElement.vr === "UL" ||
        dicomElement.vr === "US" ||
        dicomElement.vr === "SL" ||
        dicomElement.vr === "SS" ||
        dicomElement.vr === "FL" ||
        dicomElement.vr === "FD" ||
        dicomElement.vr === "AT"
      ) {
        // 'O'ther array, limited display length
        line += " ";
        line += this.getElementValueAsString(dicomElement, false);
      } else {
        // default
        line += " [";
        line += this.getElementValueAsString(dicomElement, false);
        line += "]";
      }
    }

    // align #
    const nSpaces = 55 - line.length;
    if (nSpaces > 0) {
      for (let s = 0; s < nSpaces; ++s) {
        line += " ";
      }
    }
    line += " # ";
    if (dicomElement.vl == undefined || dicomElement.vl < 100) {
      line += " ";
    }
    if (dicomElement.vl == undefined || dicomElement.vl < 10) {
      line += " ";
    }
    line += dicomElement.vl;
    line += ", ";
    line += deSize; //dictElement[1];
    line += " ";
    if (tagName !== null) {
      line += tagName;
    } else {
      line += "Unknown Tag & Data";
    }

    let message = null;

    // continue for sequence
    if (dicomElement.vr === "SQ") {
      for (let l = 0, lenl = dicomElement.value.length; l < lenl; ++l) {
        const item = dicomElement.value[l];
        const itemKeys = Object.keys(item);
        if (itemKeys.length === 0) {
          continue;
        }

        if (!(item instanceof DicomElement) || item["xFFFEE000"] == undefined) {
          continue;
        }

        // get the item element
        const itemElement: DicomElement[] = item["xFFFEE000"] as DicomElement[];
        message = "(Item with";
        if (itemElement[0].isUndefinedLength()) {
          message += " undefined";
        } else {
          message += " explicit";
        }
        message += " length #=" + (itemKeys.length - 1) + ")";
        itemElement[0].value = [message];
        itemElement[0].vr = "na";

        line += "\n";
        line += this.getElementAsString(itemElement[0], prefix + "  ");

        for (let m = 0, lenm = itemKeys.length; m < lenm; ++m) {
          if (itemKeys[m] !== "xFFFEE000") {
            line += "\n";
            line += this.getElementAsString(item[itemKeys[m]], prefix + "    ");
          }
        }

        message = "(ItemDelimitationItem";
        if (!itemElement[0].isUndefinedLength()) {
          message += " for re-encoding";
        }
        message += ")";
        const itemDelimElement: DicomElement = new DicomElement(
          MyTag.getItemDelimitationItemTag(),
          "na",
          0,
          undefined,
          undefined
        );
        itemDelimElement.setValue([message]);

        line += "\n";
        line += this.getElementAsString(itemDelimElement, prefix + "  ");
      }

      message = "(SequenceDelimitationItem";
      if (!dicomElement.isUndefinedLength()) {
        message += " for re-encod.";
      }
      message += ")";

      const seqDelimElement: DicomElement = new DicomElement(
        MyTag.getSequenceDelimitationItemTag(),
        "na",
        0,
        undefined,
        undefined
      );
      seqDelimElement.setValue([message]);

      // const sqDelimElement = {
      //   tag: MyTag.getSequenceDelimitationItemTag(),
      //   vr: "na",
      //   vl: "0",
      //   value: [message],
      // };
      line += "\n";
      line += this.getElementAsString(seqDelimElement, prefix);
    } else if (isPixSequence) {
      // TODO
      // // pixel sequence
      // let pixItem = null;
      // for (let n = 0, lenn = dicomElement.value.length; n < lenn; ++n) {
      //   pixItem = dicomElement.value[n];
      //   line += "\n";
      //   pixItem.vr = "PI";
      //   line += this.getElementAsString(pixItem, prefix + "  ");
      // }
      // const pixDelimElement = {
      //   tag: MyTag.getSequenceDelimitationItemTag(),
      //   vr: "na",
      //   vl: "0",
      //   value: ["(SequenceDelimitationItem)"],
      // };
      // line += "\n";
      // line += this.getElementAsString(pixDelimElement, prefix);
    }

    return prefix + line;
  }

  getPixelSpacing() {
    // default
    let rowSpacing = 1;
    let columnSpacing = 1;

    // 1. PixelSpacing
    // 2. ImagerPixelSpacing
    // 3. NominalScannedPixelSpacing
    // 4. PixelAspectRatio
    const keys = ["x00280030", "x00181164", "x00182010", "x00280034"];
    for (let k = 0; k < keys.length; ++k) {
      const spacing = this.getFromKey(keys[k], true);
      if (spacing && spacing.length === 2) {
        rowSpacing = parseFloat(spacing[0]);
        columnSpacing = parseFloat(spacing[1]);
        break;
      }
    }

    // check
    if (columnSpacing === 0) {
      console.log("getPixelSpacing::Zero column spacing.");
      columnSpacing = 1;
    }
    if (rowSpacing === 0) {
      console.log("getPixelSpacing::Zero row spacing.");
      rowSpacing = 1;
    }

    // return
    // (slice spacing will be calculated using the image position patient)
    return new ImageSpacing(columnSpacing, rowSpacing, 1);
  }

  getPixelUnit() {
    // RescaleType
    let unit = this.getFromKey("x00281054");
    if (!unit) {
      // Units (for PET)
      unit = this.getFromKey("x00541001");
    }
    // default rescale type for CT
    if (!unit) {
      const modality = this.getFromKey("x00080060");
      if (modality === "CT") {
        unit = "HU";
      }
    }
    return unit;
  }
}
