import type * as MyType from "@/types";

export default class ImageDemension {
  private _imageDimension: MyType.eImageDimension;

  constructor(dimension: MyType.eImageDimension) {
    this._imageDimension = dimension;
  }

  public get imageDimension(): MyType.eImageDimension {
    return this._imageDimension;
  }
}
