import type DicomDS from "../Dicom/DicomDS";
import type * as MyType from "@/types";
import * as MyUtil from "@/utils";
import * as MyMath from "@/math";
import type DicomElement from "../Dicom/DicomElement";
//
import DicomParser from "@/components/Dicom/DicomParser";
//
import MyImage from "./MyImage";
import ImageWindowLevel from "./ImageWindowLevel";
import ImageSize from "./ImageSize";
import ImageGeometry from "./ImageGeometry";
import RescaleSlopeAndIntercept from "./RescaleSlopeAndIntercept";

export default class ImageFactory {
  constructor() {}

  checkElements(dicomDS: DicomDS) {
    // columns
    const columns = dicomDS.getFromKey("x00280011");
    if (!columns) {
      throw new Error("Missing or empty DICOM image number of columns");
    }
    // rows
    const rows = dicomDS.getFromKey("x00280010");
    if (!rows) {
      throw new Error("Missing or empty DICOM image number of rows");
    }
  }

  create(dicomDS: DicomDS, pixelBuffer: MyType.tImageBufferType, numberOfFiles: number) {
    if (pixelBuffer == undefined) return;

    // columns
    const columns = dicomDS.getFromKey("x00280011");
    if (!columns) {
      throw new Error("Missing or empty DICOM image number of columns");
    }
    // rows
    const rows = dicomDS.getFromKey("x00280010");
    if (!rows) {
      throw new Error("Missing or empty DICOM image number of rows");
    }

    const imageSize = new ImageSize(columns, rows, 1);

    // frames
    const frames = dicomDS.getFromKey("x00280008");
    if (frames) {
      imageSize.depth = frames;
    }

    // image size
    const size = new ImageSize(columns, rows);

    // image spacing
    const spacing = dicomDS.getPixelSpacing();

    const dicomParser = new DicomParser();

    // TransferSyntaxUID
    const transferSyntaxUID = dicomDS.getFromKey("x00020010");
    const syntax = MyUtil.cleanString(transferSyntaxUID);
    const jpeg2000 = dicomParser.isJpeg2000TransferSyntax(syntax);
    const jpegBase = dicomParser.isJpegBaselineTransferSyntax(syntax);
    const jpegLoss = dicomParser.isJpegLosslessTransferSyntax(syntax);

    // ImagePositionPatient
    const imagePositionPatient = dicomDS.getFromKey("x00200032");
    // slice position
    let slicePosition = new Array(0, 0, 0);
    if (imagePositionPatient) {
      slicePosition = [
        parseFloat(imagePositionPatient[0]),
        parseFloat(imagePositionPatient[1]),
        parseFloat(imagePositionPatient[2]),
      ];
    }

    // slice orientation (cosines are matrices' columns)
    // http://dicom.nema.org/medical/dicom/current/output/chtml/part03/sect_C.7.6.2.html#sect_C.7.6.2.1.1
    const imageOrientationPatient = dicomDS.getFromKey("x00200037");
    let orientationMatrix;
    if (imageOrientationPatient) {
      const rowCosines = new MyMath.Vector3D(
        parseFloat(imageOrientationPatient[0]),
        parseFloat(imageOrientationPatient[1]),
        parseFloat(imageOrientationPatient[2])
      );
      const colCosines = new MyMath.Vector3D(
        parseFloat(imageOrientationPatient[3]),
        parseFloat(imageOrientationPatient[4]),
        parseFloat(imageOrientationPatient[5])
      );
      const normal = rowCosines.crossProduct(colCosines);
      /* eslint-disable array-element-newline */
      orientationMatrix = new MyMath.Matrix33([
        rowCosines.getX(),
        colCosines.getX(),
        normal.getX(),
        rowCosines.getY(),
        colCosines.getY(),
        normal.getY(),
        rowCosines.getZ(),
        colCosines.getZ(),
        normal.getZ(),
      ]);
      /* eslint-enable array-element-newline */
    }

    // geometry
    const origin = new MyMath.Point3D(slicePosition[0], slicePosition[1], slicePosition[2]);
    //var time = dicomDS.getTime();
    // const geometry = new ImageGeometry(
    //   origin, size, spacing, orientationMatrix, time);

    const geometry = new ImageGeometry(origin, size, spacing, orientationMatrix);

    // sop instance UID
    const sopInstanceUid = MyUtil.cleanString(dicomDS.getFromKey("x00080018"));

    // Sample per pixels
    let samplesPerPixel = dicomDS.getFromKey("x00280002");
    if (!samplesPerPixel) {
      samplesPerPixel = 1;
    }

    // check buffer size
    const bufferSize = size.getTotalSize() * samplesPerPixel;
    if (bufferSize !== pixelBuffer.length) {
      console.log("Badly sized pixel buffer: " + pixelBuffer.length + " != " + bufferSize);
      if (bufferSize < pixelBuffer.length) {
        pixelBuffer = pixelBuffer.slice(0, size.getTotalSize());
      } else {
        throw new Error("Underestimated buffer size, can't fix it...");
      }
    }

    // image
    const image = new MyImage(geometry, pixelBuffer, [sopInstanceUid]);
    // PhotometricInterpretation
    const photometricInterpretation = dicomDS.getFromKey("x00280004");
    if (photometricInterpretation) {
      let photo = MyUtil.cleanString(photometricInterpretation).toUpperCase();
      // jpeg decoders output RGB data
      if ((jpeg2000 || jpegBase || jpegLoss) && photo !== "MONOCHROME1" && photo !== "MONOCHROME2") {
        photo = "RGB";
      }
      // check samples per pixels
      if (photo === "RGB" && samplesPerPixel === 1) {
        photo = "PALETTE COLOR";
      }
      image.setPhotometricInterpretation(photo);
    }
    // PlanarConfiguration
    const planarConfiguration = dicomDS.getFromKey("x00280006");
    if (planarConfiguration) {
      image.setPlanarConfiguration(planarConfiguration);
    }

    // rescale slope and intercept
    let slope = 1;
    // RescaleSlope
    const rescaleSlope = dicomDS.getFromKey("x00281053");
    if (rescaleSlope) {
      slope = parseFloat(rescaleSlope);
    }
    let intercept = 0;
    // RescaleIntercept
    const rescaleIntercept = dicomDS.getFromKey("x00281052");
    if (rescaleIntercept) {
      intercept = parseFloat(rescaleIntercept);
    }
    const rsi = new RescaleSlopeAndIntercept(slope, intercept);
    image.setRescaleSlopeAndIntercept(rsi, 0);

    // meta information
    const meta: MyType.iImageMetaData = {
      numberOfFiles: numberOfFiles,
      modality: dicomDS.getFromKey("x00080060"),
      sopClassUID: dicomDS.getFromKey("x00080016"),
      studyInstanceUID: dicomDS.getFromKey("x0020000D"),
      seriesInstanceUID: dicomDS.getFromKey("x0020000E"),
      bitsStored: dicomDS.getFromKey("x00280101"),
      pixelRepresentation: dicomDS.getFromKey("x00280103"),
    };
    // PixelRepresentation -> is signed
    meta.isSigned = Number(meta.pixelRepresentation) === 1 ? true : false;
    // local pixel unit
    const pixelUnit = dicomDS.getPixelUnit();
    if (pixelUnit) {
      meta.pixelUnit = pixelUnit;
    }
    // FrameOfReferenceUID (optional)
    const frameOfReferenceUID = dicomDS.getFromKey("x00200052");
    if (frameOfReferenceUID) {
      meta.frameOfReferenceUID = frameOfReferenceUID;
    }
    // window level presets
    const windowPresets: MyType.iWindowPresets[] = [];
    const windowCenter = dicomDS.getFromKey("x00281050", true);
    const windowWidth = dicomDS.getFromKey("x00281051", true);
    const windowCWExplanation = dicomDS.getFromKey("x00281055", true);
    if (windowCenter && windowWidth) {
      let name = "";
      for (let j = 0; j < windowCenter.length; ++j) {
        //var center = parseFloat(windowCenter[j], 10);
        //var width = parseFloat(windowWidth[j], 10);
        const center = parseFloat(windowCenter[j]);
        const width = parseFloat(windowWidth[j]);
        if (center && width && width !== 0) {
          name = "";
          if (windowCWExplanation) {
            name = MyUtil.cleanString(windowCWExplanation[j]);
          }
          if (name === "") {
            name = "Default" + j;
          }
          windowPresets[name] = {
            wl: [new ImageWindowLevel(center, width, 0)],
            name: name,
          };
        }
        if (width === 0) {
          console.log("Zero window width found in DICOM.");
        }
      }
    }
    meta.windowPresets = windowPresets;

    // PALETTE COLOR luts
    if (image.getPhotometricInterpretation() === "PALETTE COLOR") {
      let redLut = dicomDS.getFromKey("x00281201");
      let greenLut = dicomDS.getFromKey("x00281202");
      let blueLut = dicomDS.getFromKey("x00281203");
      // check red palette descriptor (should all be equal)
      const descriptor = dicomDS.getFromKey("x00281101");
      if (typeof descriptor !== "undefined" && descriptor.length === 3) {
        if (descriptor[2] === 16) {
          let doScale = false;
          // (C.7.6.3.1.5 Palette Color Lookup Table Descriptor)
          // Some implementations have encoded 8 bit entries with 16 bits
          // allocated, padding the high bits;
          let descSize = descriptor[0];
          // (C.7.6.3.1.5 Palette Color Lookup Table Descriptor)
          // The first Palette Color Lookup Table Descriptor value is the
          // number of entries in the lookup table. When the number of table
          // entries is equal to 216 then this value shall be 0.
          if (descSize === 0) {
            descSize = 65536;
          }
          // red palette VL
          const redLutDE = dicomDS.getDEFromKey("x00281201") as DicomElement;
          const vlSize = redLutDE.vl;
          // check double size
          if (vlSize !== 2 * descSize) {
            doScale = true;
            console.log("16bits lut but size is not double. desc: " + descSize + " vl: " + vlSize);
          }
          // (C.7.6.3.1.6 Palette Color Lookup Table Data)
          // Palette color values must always be scaled across the full
          // range of available intensities
          const bitsAllocated = parseInt(dicomDS.getFromKey("x00280100"), 10);
          if (bitsAllocated === 8) {
            doScale = true;
            console.log("Scaling 16bits color lut since bits allocated is 8.");
          }

          if (doScale) {
            const scaleTo8 = function (value: number) {
              return value >> 8;
            };

            redLut = redLut.map(scaleTo8);
            greenLut = greenLut.map(scaleTo8);
            blueLut = blueLut.map(scaleTo8);
          }
        } else if (descriptor[2] === 8) {
          // lut with vr=OW was read as Uint16, convert it to Uint8
          console.log("Scaling 16bits color lut since the lut descriptor is 8.");
          let clone = redLut.slice(0);
          redLut = new Uint8Array(clone.buffer);
          clone = greenLut.slice(0);
          greenLut = new Uint8Array(clone.buffer);
          clone = blueLut.slice(0);
          blueLut = new Uint8Array(clone.buffer);
        }
      }
      // set the palette
      meta.paletteLut = {
        red: redLut,
        green: greenLut,
        blue: blueLut,
      };
    }

    // RecommendedDisplayFrameRate
    const recommendedDisplayFrameRate = dicomDS.getFromKey("x00082144");
    if (recommendedDisplayFrameRate) {
      meta.recommendedDisplayFrameRate = parseInt(recommendedDisplayFrameRate, 10);
    }

    // store the meta data
    image.setMeta(meta);

    return image;
  }
}
