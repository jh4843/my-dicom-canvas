import * as myType from "@/types";
import ImageDemension from "./ImageDemension";

export default class ImageSize extends ImageDemension {
  private _width: number;
  private _height: number;
  private _depth?: number; // for 3D

  constructor(width: number, height: number, depth?: number) {
    super(depth == undefined ? myType.eImageDimension.image_dimension_2d : myType.eImageDimension.image_dimension_3d);

    this._width = width;
    this._height = height;
    this._depth = depth; // for 3D
  }

  get(index: number): number {
    let res: number = -1;
    switch (index) {
      default:
      case 0:
        res = this.width;
        break;
      case 1:
        res = this.height;
        break;
      case 2:
        res = this.depth;
        break;
    }

    return res;
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  get depth(): number {
    if (this._depth == undefined) return 1.0;

    return this._depth;
  }

  length(): number {
    if (this.depth == undefined) {
      return 2;
    } else {
      return 3;
    }
  }

  getValues(): Array<number> {
    return [this.width, this.height, this.depth];
  }

  getTotalSize(start?: number): number {
    return this.getDimSize(this.length(), start);
  }

  // volumn size
  getDimSize(dimension: number, start?: number): number {
    if (dimension > this.length()) {
      return -1;
    }
    if (typeof start === "undefined") {
      start = 0;
    } else {
      if (start < 0 || start > dimension) {
        throw new Error("Invalid start value for getDimSize");
      }
    }
    let size = 1;
    for (let i = start; i < dimension; ++i) {
      size *= this.get(i);
    }
    return size;
  }

  private _valueCheck(val: number): boolean {
    if (val == null || val == undefined) return false;
    if (isNaN(val) && val == 0) return false;

    return true;
  }

  checkValidValue(): boolean {
    if (this.imageDimension == myType.eImageDimension.image_dimension_invalid) return false;

    if (!this._valueCheck(this.width)) return false;

    if (!this._valueCheck(this.height)) return false;

    if (this.imageDimension == myType.eImageDimension.image_dimension_3d) {
      if (!this._valueCheck(this.depth)) return false;
    }

    return true;
  }

  indexToOffset(index: number, start?: number) {
    // TODO check for equality
    // if (index.length() < this.length()) {
    //   throw new Error("Incompatible index and size length");
    // }
    if (start === undefined) {
      start = 0;
    } else {
      if (start < 0 || start > this.length() - 1) {
        throw new Error("Invalid start value for indexToOffset");
      }
    }
    let offset = 0;
    for (let i = start; i < this.length(); ++i) {
      //offset += index.get(i) * this.getDimSize(i, start);
      offset += index * this.getDimSize(i, start);
    }
    return offset;
  }

  equal(size: ImageSize): boolean {
    if (this.width != size.width) return false;

    if (this.height != size.height) return false;

    if (this.imageDimension == myType.eImageDimension.image_dimension_3d) {
      if (this._depth != size._depth) return false;
    }

    return true;
  }
}
