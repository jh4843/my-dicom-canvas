import type ImageSize from "@/components/Image/ImageSize";

export enum eImageDimension {
  image_dimension_invalid,
  image_dimension_2d,
  image_dimension_3d,
}

export enum eImageSourceType {
  image_source_type_img_file,
  image_source_type_dcm_file,
  //
  image_source_type_url = 10,
}

export enum eImageContentType {
  image_content_type_invalid,
  image_content_type_text,
  image_content_type_array_buffer,
  image_content_type_data_url,
}

export type tImageBufferType = Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array | null;

export interface IImageDisplayValue {
  r: number;
  g: number;
  b: number;
  alpha?: number;
}

export interface IImageMetaData {
  bitsStored?: number;
  bitsAllocated?: number;
  isSigned?: boolean;
  samplesPerPixel?: number;
  planarConfiguration?: number;
  sliceSize?: ImageSize;
  numberOfFiles?: number;
  windowPresets?: object;
}

export interface IDomImageValue {
  value: string;
}

export interface IImageMetaInfo {
  [key: string]: IDomImageValue;
}

export interface ICommonImageInfo {
  type: eImageSourceType;
  name: string;

  width: number;
  height: number;
}

export class CommonImage {
  _data: ImageData | undefined;
  _info: ICommonImageInfo;

  constructor(info: ICommonImageInfo) {
    this._info = info;
    this._data = undefined;
  }

  get data() {
    return this._data;
  }

  set data(dt) {
    this._data = dt;
  }

  get info() {
    return this._info;
  }

  set info(information) {
    this._info = information;
  }

  setImageInfo(info: ICommonImageInfo) {
    this._info = info;
  }
}
