import { eFileType } from "@/types/File";

export const getFileExtension = (file: File) => {
  const filePath = file.name;
  let ext = null;
  if (typeof filePath !== "undefined" && filePath !== null && filePath[0] !== ".") {
    const pathSplit = filePath.toLowerCase().split(".");
    if (pathSplit.length !== 1) {
      ext = pathSplit.pop();
      // extension should contain at least one letter and no slash

      const regExp = /[a-z]/;
      if (ext == undefined) {
        ext == null;
      } else if (!regExp.test(ext) || ext.includes("/")) {
        ext = null;
      }
    }
  }
  return ext;
};

export const getFileType = (file: File): eFileType => {
  let res = eFileType.file_type_invalid;

  const ext = getFileExtension(file);

  switch (ext) {
    case "dcm":
      res = eFileType.file_type_dicom;
      break;
    case "bmp":
    case "tif":
    case "tiff":
    case "jpg":
    case "jpeg":
    case "png":
      res = eFileType.file_type_raster_image;
      break;
    default:
      res = eFileType.file_type_invalid;
      break;
  }

  return res;
};
