import type * as myType from "@/types";

export default class ImageDemension {
  private _imageDimension: myType.eImageDimension;

  constructor(dimension: myType.eImageDimension) {
    this._imageDimension = dimension;
  }

  public get imageDimension(): myType.eImageDimension {
    return this._imageDimension;
  }
}
