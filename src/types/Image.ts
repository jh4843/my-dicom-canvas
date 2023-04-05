import type ImageSize from "@/components/Image/ImageSize";
import type ImageWindowLevel from "@/components/Image/ImageWindowLevel";

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

export interface iInputImageData {
  meta: iImageMetaData;
  buffer: ArrayBuffer;
}

export interface iImageDisplayValue {
  r: number;
  g: number;
  b: number;
  alpha?: number;
}

export interface iPalette {
  red: Uint8Array;
  green: Uint8Array;
  blue: Uint8Array;
}

export interface iWindowPresets {
  wl: ImageWindowLevel[];
  name: string;
  perslice: boolean;
}

export interface iImageMetaData {
  bitsStored?: number;
  bitsAllocated?: number;
  isSigned?: boolean;
  samplesPerPixel?: number;
  planarConfiguration?: number;
  sliceSize?: ImageSize;
  numberOfFiles?: number;
  windowPresets?: iWindowPresets[];
  paletteLut?: iPalette;
  recommendedDisplayFrameRate?: number;
  //
  modality?: string;
  sopClassUID?: string;
  studyInstanceUID?: string;
  seriesInstanceUID?: string;
  pixelRepresentation?: string;
  pixelUnit?: number;
  frameOfReferenceUID?: string;
}

export interface iDomImageValue {
  value: string;
}

export interface iDomImageMetaInfo {
  [key: string]: iDomImageValue;
}

export interface iImageMetaInfo {
  origin?: string;
  fileName?: string;
  fileType?: string;
  fileLastModifiedDate?: string;

  imageWidth?: number;
  imageHeight?: number;
}

export interface iCommonImageInfo {
  type: eImageSourceType;
  name: string;

  width: number;
  height: number;
}

export class CommonImage {
  _data: ImageData | undefined;
  _info: iCommonImageInfo;

  constructor(info: iCommonImageInfo) {
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

  setImageInfo(info: iCommonImageInfo) {
    this._info = info;
  }
}
