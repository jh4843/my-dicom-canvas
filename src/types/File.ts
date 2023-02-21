import type FileLoader from "@/components/IO/FileLoader";
import type ImageLoader from "@/components/IO/ImageLoader";
import type DicomLoader from "@/components/IO/DicomLoader";

export enum eLoaderObjectType {
  loader_object_type_file = 0,
  loader_object_type_image,
  loader_object_type_dicom,
}

export enum eFileType {
  file_type_invalid = 0,
  file_type_raw = 10,
  file_type_dicom = 20,
  file_type_raster_image = 30,
}

export type Loader = null | FileLoader | ImageLoader | DicomLoader;
export type SubLoader = null | ImageLoader | DicomLoader;
