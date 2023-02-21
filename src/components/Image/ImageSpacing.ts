import * as myType from "@/types";
import ImageDemension from "./ImageDemension";

export default class ImageSpacing extends ImageDemension {
  private _x: number;
  private _y: number;
  private _z?: number; // for 3D

  constructor(x: number, y: number, z?: number) {
    super(z == undefined ? myType.eImageDimension.image_dimension_2d : myType.eImageDimension.image_dimension_3d);

    this._x = x;
    this._y = y;
    this._z = z; // for 3D
  }

  get x(): number {
    return this._x;
  }

  get y(): number {
    return this._y;
  }

  get z(): number {
    if (this._z == undefined) return 1.0;

    return this._z;
  }

  private _valueCheck(val: number): boolean {
    if (val == null || val == undefined) return false;
    if (isNaN(val) && val == 0) return false;

    return true;
  }

  checkValidValue(): boolean {
    if (!this._valueCheck(this.x)) return false;

    if (!this._valueCheck(this.y)) return false;

    return true;
  }

  getValues(): Array<number> {
    return [this.x, this.y, this.z];
  }

  equal(size: ImageSpacing): boolean {
    if (this.x != size.x) return false;

    if (this.y != size.y) return false;

    if (this.imageDimension == myType.eImageDimension.image_dimension_3d) {
      if (this.z != size.z) return false;
    }

    return true;
  }
}
