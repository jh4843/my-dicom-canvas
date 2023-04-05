import type FileLoader from "@/components/IO/FileLoader";
import type ImageLoader from "@/components/IO/ImageLoader";
import type DicomLoader from "@/components/IO/DicomLoader";

export enum eLoaderObjectType {
  loader_object_type_invalid = 0,
  loader_object_type_base,
  loader_object_type_image,
  loader_object_type_dicom,
}

export interface iLoaderOptions {
  numberOfFiles?: number;
  defaultCharacterSet?: string;
}

export enum eLoaderStatus {
  loader_status_none = 0,
  loader_status_loadstart = 10,
  loader_status_loading,
  loader_status_loadend,

  loader_status_aborted = 20,
}

export enum eFileType {
  file_type_invalid = 0,
  file_type_raw = 10,
  file_type_dicom = 20,
  file_type_raster_image = 30,
}

export type Loader = null | FileLoader | ImageLoader | DicomLoader;
export type SubLoader = null | ImageLoader | DicomLoader;
