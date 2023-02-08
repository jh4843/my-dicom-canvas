export enum eImageSourceType {
  image_source_type_img_file,
  image_source_type_dcm_file,
  //
  image_source_type_url = 10,
}

export interface ICommonImageInfo {
  srcType: eImageSourceType;
  srcName: string;

  width: number;
  height: number;
}

export class CommonImage implements ICommonImageInfo {
  srcType: eImageSourceType;
  srcName: string;

  width: number;
  height: number;

  constructor(
    srcType: eImageSourceType = eImageSourceType.image_source_type_img_file,
    srcName: string = "",
    width: number = 0,
    height: number = 0
  ) {
    this.srcType = srcType;
    this.srcName = srcName;

    this.width = width;
    this.height = height;
  }

  set(canvas: CommonImage) {
    this.srcType = canvas.srcType;
    this.srcName = canvas.srcName;

    this.width = canvas.width;
    this.height = canvas.height;
  }
}
