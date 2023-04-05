import * as MyType from "@/types";
import * as MyUtil from "@/utils";
import type { Matrix33 } from "@/math/Matrix";
import type DicomDS from "../Dicom/DicomDS";

/**
 * Check two position patients for equality.
 *
 * @param {*} pos1 The first position patient.
 * @param {*} pos2 The second position patient.
 * @returns {boolean} True is equal.
 */
export const equalPosPat = (pos1: number, pos2: number) => {
  return JSON.stringify(pos1) === JSON.stringify(pos2);
};

/**
 * Get a position patient compare function accroding to an
 * input orientation.
 *
 * @param {dwv.math.Matrix33} orientation The orientation matrix.
 * @returns {Function} The position compare function.
 */
export const getComparePosPat = (orientation: Matrix33) => {
  const invOrientation = orientation.getInverse();
  return function (pos1: number[], pos2: number[]) {
    const p1 = invOrientation.multiplyArray3D(pos1);
    const p2 = invOrientation.multiplyArray3D(pos2);
    return p1[2] - p2[2];
  };
};

/**
 * Check that a DICOM tag definition is present in a parsed element.
 *
 * @param {object} rootElement The root dicom element.
 * @param {object} tagDefinition The tag definition as {name, tag, type, enum}.
 */
export const checkTag = (rootElement: DicomDS, tagDefinition: object) => {
  let tagValue = rootElement.getFromKey(tagDefinition.tag);
  // check null and undefined
  if (tagDefinition.type === 1 || tagDefinition.type === 2) {
    if (tagValue === null || typeof tagValue === "undefined") {
      throw new Error("Missing or empty " + tagDefinition.name);
    }
  } else {
    if (tagValue === null || typeof tagValue === "undefined") {
      // non mandatory value, exit
      return;
    }
  }
  let includes = false;
  if (Array.isArray(tagValue)) {
    // trim
    tagValue = tagValue.map(function (item) {
      return MyUtil.cleanString(item);
    });
    for (let i = 0; i < tagDefinition.enum.length; ++i) {
      if (!Array.isArray(tagDefinition.enum[i])) {
        throw new Error("Cannot compare array and non array tag value.");
      }
      if (MyUtil.arraySortEquals(tagDefinition.enum[i], tagValue)) {
        includes = true;
        break;
      }
    }
  } else {
    // trim
    if (typeof tagValue === "string") {
      tagValue = dwv.dicom.cleanString(tagValue);
    }

    includes = tagDefinition.enum.includes(tagValue);
  }
  if (!includes) {
    throw new Error("Unsupported " + tagDefinition.name + " value: " + tagValue);
  }
};

/**
 * List of DICOM Seg required tags.
 */
dwv.dicom.requiredDicomSegTags = [
  {
    name: "TransferSyntaxUID",
    tag: "x00020010",
    type: "1",
    enum: ["1.2.840.10008.1.2.1"],
  },
  {
    name: "MediaStorageSOPClassUID",
    tag: "x00020002",
    type: "1",
    enum: ["1.2.840.10008.5.1.4.1.1.66.4"],
  },
  {
    name: "SOPClassUID",
    tag: "x00020002",
    type: "1",
    enum: ["1.2.840.10008.5.1.4.1.1.66.4"],
  },
  {
    name: "Modality",
    tag: "x00080060",
    type: "1",
    enum: ["SEG"],
  },
  {
    name: "SegmentationType",
    tag: "x00620001",
    type: "1",
    enum: ["BINARY"],
  },
  {
    name: "DimensionOrganizationType",
    tag: "x00209311",
    type: "3",
    enum: ["3D"],
  },
  {
    name: "ImageType",
    tag: "x00080008",
    type: "1",
    enum: [["DERIVED", "PRIMARY"]],
  },
  {
    name: "SamplesPerPixel",
    tag: "x00280002",
    type: "1",
    enum: [1],
  },
  {
    name: "PhotometricInterpretation",
    tag: "x00280004",
    type: "1",
    enum: ["MONOCHROME2"],
  },
  {
    name: "PixelRepresentation",
    tag: "x00280103",
    type: "1",
    enum: [0],
  },
  {
    name: "BitsAllocated",
    tag: "x00280100",
    type: "1",
    enum: [1],
  },
  {
    name: "BitsStored",
    tag: "x00280101",
    type: "1",
    enum: [1],
  },
  {
    name: "HighBit",
    tag: "x00280102",
    type: "1",
    enum: [0],
  },
];

/**
 * Get the default DICOM seg tags as an object.
 *
 * @returns {object} The default tags.
 */
dwv.dicom.getDefaultDicomSegJson = function () {
  const tags = {};
  for (let i = 0; i < dwv.dicom.requiredDicomSegTags.length; ++i) {
    const reqTag = dwv.dicom.requiredDicomSegTags[i];
    tags[reqTag.name] = reqTag.enum[0];
  }
  return tags;
};

/**
 * Check the dimension organization from a dicom element.
 *
 * @param {object} rootElement The root dicom element.
 * @returns {object} The dimension organizations and indices.
 */
dwv.dicom.getDimensionOrganization = function (rootElement) {
  // Dimension Organization Sequence (required)
  const orgSq = rootElement.getFromKey("x00209221", true);
  if (!orgSq || orgSq.length !== 1) {
    throw new Error("Unsupported dimension organization sequence length");
  }
  // Dimension Organization UID
  const orgUID = dwv.dicom.cleanString(orgSq[0].x00209164.value[0]);

  // Dimension Index Sequence (conditionally required)
  const indices = [];
  const indexSq = rootElement.getFromKey("x00209222", true);
  if (indexSq) {
    // expecting 2D index
    if (indexSq.length !== 2) {
      throw new Error("Unsupported dimension index sequence length");
    }
    let indexPointer;
    for (let i = 0; i < indexSq.length; ++i) {
      // Dimension Organization UID (required)
      const indexOrg = dwv.dicom.cleanString(indexSq[i].x00209164.value[0]);
      if (indexOrg !== orgUID) {
        throw new Error("Dimension Index Sequence contains a unknown Dimension Organization");
      }
      // Dimension Index Pointer (required)
      indexPointer = dwv.dicom.cleanString(indexSq[i].x00209165.value[0]);

      const index = {
        DimensionOrganizationUID: indexOrg,
        DimensionIndexPointer: indexPointer,
      };
      // Dimension Description Label (optional)
      if (typeof indexSq[i].x00209421 !== "undefined") {
        index.DimensionDescriptionLabel = dwv.dicom.cleanString(indexSq[i].x00209421.value[0]);
      }
      // store
      indices.push(index);
    }
    // expecting Image Position at last position
    if (indexPointer !== "(0020,0032)") {
      throw new Error("Unsupported non image position as last index");
    }
  }

  return {
    organizations: {
      value: [
        {
          DimensionOrganizationUID: orgUID,
        },
      ],
    },
    indices: {
      value: indices,
    },
  };
};

/**
 * Get a code object from a dicom element.
 *
 * @param {object} element The dicom element.
 * @returns {object} A code object.
 */
dwv.dicom.getCode = function (element) {
  // meaning -> CodeMeaning (type1)
  const code = {
    meaning: dwv.dicom.cleanString(element.x00080104.value[0]),
  };
  // value -> CodeValue (type1C)
  // longValue -> LongCodeValue (type1C)
  // urnValue -> URNCodeValue (type1C)
  if (element.x00080100) {
    code.value = element.x00080100.value[0];
  } else if (element.x00080119) {
    code.longValue = element.x00080119.value[0];
  } else if (element.x00080120) {
    code.urnValue = element.x00080120.value[0];
  } else {
    throw Error("Invalid code with no value, no long value and no urn value.");
  }
  // schemeDesignator -> CodingSchemeDesignator (type1C)
  if (typeof code.value !== "undefined" || typeof code.longValue !== "undefined") {
    if (element.x00080102) {
      code.schemeDesignator = element.x00080102.value[0];
    } else {
      throw Error("No coding sheme designator when code value or long value is present");
    }
  }
  return code;
};

/**
 * Get a segment object from a dicom element.
 *
 * @param {object} element The dicom element.
 * @returns {object} A segment object.
 */
dwv.dicom.getSegment = function (element) {
  // number -> SegmentNumber (type1)
  // label -> SegmentLabel (type1)
  // algorithmType -> SegmentAlgorithmType (type1)
  const segment = {
    number: element.x00620004.value[0],
    label: dwv.dicom.cleanString(element.x00620005.value[0]),
    algorithmType: dwv.dicom.cleanString(element.x00620008.value[0]),
  };
  // algorithmName -> SegmentAlgorithmName (type1C)
  if (element.x00620009) {
    segment.algorithmName = dwv.dicom.cleanString(element.x00620009.value[0]);
  }
  // // required if type is not MANUAL
  // if (segment.algorithmType !== 'MANUAL' &&
  //   (typeof segment.algorithmName === 'undefined' ||
  //   segment.algorithmName.length === 0)) {
  //   throw new Error('Empty algorithm name for non MANUAL algorithm type.');
  // }
  // displayValue ->
  // - RecommendedDisplayGrayscaleValue
  // - RecommendedDisplayCIELabValue converted to RGB
  if (typeof element.x0062000C !== "undefined") {
    segment.displayValue = element.x006200C.value;
  } else if (typeof element.x0062000D !== "undefined") {
    const cielabElement = element.x0062000D.value;
    const rgb = dwv.utils.cielabToSrgb(
      dwv.utils.uintLabToLab({
        l: cielabElement[0],
        a: cielabElement[1],
        b: cielabElement[2],
      })
    );
    segment.displayValue = rgb;
  }
  // Segmented Property Category Code Sequence (type1, only one)
  if (typeof element.x00620003 !== "undefined") {
    segment.propertyCategoryCode = dwv.dicom.getCode(element.x00620003.value[0]);
  } else {
    throw Error("Missing Segmented Property Category Code Sequence.");
  }
  // Segmented Property Type Code Sequence (type1)
  if (typeof element.x0062000F !== "undefined") {
    segment.propertyTypeCode = dwv.dicom.getCode(element.x0062000F.value[0]);
  } else {
    throw Error("Missing Segmented Property Type Code Sequence.");
  }
  // tracking Id and UID (type1C)
  if (typeof element.x00620020 !== "undefined") {
    segment.trackingId = element.x00620020.value[0];
    segment.trackingUid = element.x00620021.value[0];
  }

  return segment;
};

/**
 * Check if two segment objects are equal.
 *
 * @param {object} seg1 The first segment.
 * @param {object} seg2 The second segment.
 * @returns {boolean} True if both segment are equal.
 */
dwv.dicom.isEqualSegment = function (seg1, seg2) {
  // basics
  if (typeof seg1 === "undefined" || typeof seg2 === "undefined" || seg1 === null || seg2 === null) {
    return false;
  }
  let isEqual = seg1.number === seg2.number && seg1.label === seg2.label && seg1.algorithmType === seg2.algorithmType;
  // rgb
  if (typeof seg1.displayValue.r !== "undefined") {
    if (typeof seg2.displayValue.r === "undefined") {
      isEqual = false;
    } else {
      isEqual = isEqual && dwv.utils.isEqualRgb(seg1.displayValue, seg2.displayValue);
    }
  } else {
    isEqual = isEqual && seg1.displayValue === seg2.displayValue;
  }
  // algorithmName
  if (typeof seg1.algorithmName !== "undefined") {
    if (typeof seg2.algorithmName === "undefined") {
      isEqual = false;
    } else {
      isEqual = isEqual && seg1.algorithmName === seg2.algorithmName;
    }
  }

  return isEqual;
};

/**
 * Check if two segment objects are similar: either the
 * number or the displayValue are equal.
 *
 * @param {object} seg1 The first segment.
 * @param {object} seg2 The second segment.
 * @returns {boolean} True if both segment are similar.
 */
dwv.dicom.isSimilarSegment = function (seg1, seg2) {
  // basics
  if (typeof seg1 === "undefined" || typeof seg2 === "undefined" || seg1 === null || seg2 === null) {
    return false;
  }
  let isSimilar = seg1.number === seg2.number;
  // rgb
  if (typeof seg1.displayValue.r !== "undefined") {
    if (typeof seg2.displayValue.r === "undefined") {
      isSimilar = false;
    } else {
      isSimilar = isSimilar || dwv.utils.isEqualRgb(seg1.displayValue, seg2.displayValue);
    }
  } else {
    isSimilar = isSimilar || seg1.displayValue === seg2.displayValue;
  }

  return isSimilar;
};

/**
 * Get a spacing object from a dicom measure element.
 *
 * @param {object} measure The dicom element.
 * @returns {dwv.image.Spacing} A spacing object.
 */
dwv.dicom.getSpacingFromMeasure = function (measure) {
  // Pixel Spacing
  if (typeof measure.x00280030 === "undefined") {
    return null;
  }
  const pixelSpacing = measure.x00280030;
  const spacingValues = [parseFloat(pixelSpacing.value[0]), parseFloat(pixelSpacing.value[1])];
  // Slice Thickness
  if (typeof measure.x00180050 !== "undefined") {
    spacingValues.push(parseFloat(measure.x00180050.value[0]));
  } else if (typeof measure.x00180088 !== "undefined") {
    // Spacing Between Slices
    spacingValues.push(parseFloat(measure.x00180088.value[0]));
  }
  return new dwv.image.Spacing(spacingValues);
};

/**
 * Get a frame information object from a dicom element.
 *
 * @param {object} groupItem The dicom element.
 * @returns {object} A frame information object.
 */
dwv.dicom.getSegmentFrameInfo = function (groupItem) {
  // Derivation Image Sequence
  const derivationImages = [];
  if (typeof groupItem.x00089124 !== "undefined") {
    const derivationImageSq = groupItem.x00089124.value;
    // Source Image Sequence
    for (let i = 0; i < derivationImageSq.length; ++i) {
      const sourceImages = [];
      if (typeof derivationImageSq[i].x00082112 !== "undefined") {
        const sourceImageSq = derivationImageSq[i].x00082112.value;
        for (let j = 0; j < sourceImageSq.length; ++j) {
          const sourceImage = {};
          // Referenced SOP Class UID
          if (typeof sourceImageSq[j].x00081150 !== "undefined") {
            sourceImage.referencedSOPClassUID = sourceImageSq[j].x00081150.value[0];
          }
          // Referenced SOP Instance UID
          if (typeof sourceImageSq[j].x00081155 !== "undefined") {
            sourceImage.referencedSOPInstanceUID = sourceImageSq[j].x00081155.value[0];
          }
          sourceImages.push(sourceImage);
        }
      }
      derivationImages.push(sourceImages);
    }
  }
  // Frame Content Sequence (required, only one)
  const frameContentSq = groupItem.x00209111.value;
  // Dimension Index Value
  const dimIndex = frameContentSq[0].x00209157.value;
  // Segment Identification Sequence (required, only one)
  const segmentIdSq = groupItem.x0062000A.value;
  // Referenced Segment Number
  const refSegmentNumber = segmentIdSq[0].x0062000B.value[0];
  // Plane Position Sequence (required, only one)
  const planePosSq = groupItem.x00209113.value;
  // Image Position (Patient) (conditionally required)
  const imagePosPat = planePosSq[0].x00200032.value;
  for (let p = 0; p < imagePosPat.length; ++p) {
    imagePosPat[p] = parseFloat(imagePosPat[p], 10);
  }
  const frameInfo = {
    dimIndex: dimIndex,
    imagePosPat: imagePosPat,
    derivationImages: derivationImages,
    refSegmentNumber: refSegmentNumber,
  };
  // Plane Orientation Sequence
  if (typeof groupItem.x00209116 !== "undefined") {
    const framePlaneOrientationSeq = groupItem.x00209116;
    if (framePlaneOrientationSeq.value.length !== 0) {
      // should only be one Image Orientation (Patient)
      const frameImageOrientation = framePlaneOrientationSeq.value[0].x00200037.value;
      if (typeof frameImageOrientation !== "undefined") {
        frameInfo.imageOrientationPatient = frameImageOrientation;
      }
    }
  }
  // Pixel Measures Sequence
  if (typeof groupItem.x00289110 !== "undefined") {
    const framePixelMeasuresSeq = groupItem.x00289110;
    if (framePixelMeasuresSeq.value.length !== 0) {
      // should only be one
      const frameSpacing = dwv.dicom.getSpacingFromMeasure(framePixelMeasuresSeq.value[0]);
      if (typeof frameSpacing !== "undefined") {
        frameInfo.spacing = frameSpacing;
      }
    } else {
      dwv.logger.warn("No shared functional group pixel measure sequence items.");
    }
  }

  return frameInfo;
};

/**
 * Mask {@link dwv.image.Image} factory.
 *
 * @class
 */
dwv.image.MaskFactory = function () {};

/**
 * Get an {@link dwv.image.Image} object from the read DICOM file.
 *
 * @param {object} dicomElements The DICOM tags.
 * @param {Array} pixelBuffer The pixel buffer.
 * @returns {dwv.image.Image} A new Image.
 */
dwv.image.MaskFactory.prototype.create = function (dicomElements, pixelBuffer) {
  // check required and supported tags
  for (let d = 0; d < dwv.dicom.requiredDicomSegTags.length; ++d) {
    dwv.dicom.checkTag(dicomElements, dwv.dicom.requiredDicomSegTags[d]);
  }

  // columns
  const columns = dicomElements.getFromKey("x00280011");
  if (!columns) {
    throw new Error("Missing or empty DICOM image number of columns");
  }
  // rows
  const rows = dicomElements.getFromKey("x00280010");
  if (!rows) {
    throw new Error("Missing or empty DICOM image number of rows");
  }
  const sliceSize = columns * rows;

  // frames
  let frames = dicomElements.getFromKey("x00280008");
  if (!frames) {
    frames = 1;
  } else {
    frames = parseInt(frames, 10);
  }

  if (frames !== pixelBuffer.length / sliceSize) {
    throw new Error("Buffer and numberOfFrames meta are not equal." + frames + " " + pixelBuffer.length / sliceSize);
  }

  // Dimension Organization and Index
  const dimension = dwv.dicom.getDimensionOrganization(dicomElements);

  // Segment Sequence
  const segSequence = dicomElements.getFromKey("x00620002", true);
  if (!segSequence || typeof segSequence === "undefined") {
    throw new Error("Missing or empty segmentation sequence");
  }
  const segments = [];
  let storeAsRGB = false;
  for (let i = 0; i < segSequence.length; ++i) {
    const segment = dwv.dicom.getSegment(segSequence[i]);
    if (
      typeof segment.displayValue.r !== "undefined" &&
      typeof segment.displayValue.g !== "undefined" &&
      typeof segment.displayValue.b !== "undefined"
    ) {
      // create rgb image
      storeAsRGB = true;
    }
    // store
    segments.push(segment);
  }

  // image size
  const size = dicomElements.getImageSize();

  // Shared Functional Groups Sequence
  let spacing;
  let imageOrientationPatient;
  const sharedFunctionalGroupsSeq = dicomElements.getFromKey("x52009229", true);
  if (sharedFunctionalGroupsSeq && sharedFunctionalGroupsSeq.length !== 0) {
    // should be only one
    const funcGroup0 = sharedFunctionalGroupsSeq[0];
    // Plane Orientation Sequence
    if (typeof funcGroup0.x00209116 !== "undefined") {
      const planeOrientationSeq = funcGroup0.x00209116;
      if (planeOrientationSeq.value.length !== 0) {
        // should be only one
        imageOrientationPatient = planeOrientationSeq.value[0].x00200037.value;
      } else {
        dwv.logger.warn("No shared functional group plane orientation sequence items.");
      }
    }
    // Pixel Measures Sequence
    if (typeof funcGroup0.x00289110 !== "undefined") {
      const pixelMeasuresSeq = funcGroup0.x00289110;
      if (pixelMeasuresSeq.value.length !== 0) {
        // should be only one
        spacing = dwv.dicom.getSpacingFromMeasure(pixelMeasuresSeq.value[0]);
      } else {
        dwv.logger.warn("No shared functional group pixel measure sequence items.");
      }
    }
  }

  const includesPosPat = function (arr, val) {
    return arr.some(function (arrVal) {
      return dwv.dicom.equalPosPat(val, arrVal);
    });
  };

  const findIndexPosPat = function (arr, val) {
    return arr.findIndex(function (arrVal) {
      return dwv.dicom.equalPosPat(val, arrVal);
    });
  };

  // Per-frame Functional Groups Sequence
  const perFrameFuncGroupSequence = dicomElements.getFromKey("x52009230", true);
  if (!perFrameFuncGroupSequence || typeof perFrameFuncGroupSequence === "undefined") {
    throw new Error("Missing or empty per frame functional sequence");
  }
  if (frames !== perFrameFuncGroupSequence.length) {
    throw new Error("perFrameFuncGroupSequence meta and numberOfFrames are not equal.");
  }
  // create frame info object from per frame func
  const frameInfos = [];
  for (let j = 0; j < perFrameFuncGroupSequence.length; ++j) {
    frameInfos.push(dwv.dicom.getSegmentFrameInfo(perFrameFuncGroupSequence[j]));
  }

  // check frame infos
  const framePosPats = [];
  for (let ii = 0; ii < frameInfos.length; ++ii) {
    if (!includesPosPat(framePosPats, frameInfos[ii].imagePosPat)) {
      framePosPats.push(frameInfos[ii].imagePosPat);
    }
    // store orientation if needed, avoid multi
    if (typeof frameInfos[ii].imageOrientationPatient !== "undefined") {
      if (typeof imageOrientationPatient === "undefined") {
        imageOrientationPatient = frameInfos[ii].imageOrientationPatient;
      } else {
        if (!dwv.utils.arraySortEquals(imageOrientationPatient, frameInfos[ii].imageOrientationPatient)) {
          throw new Error("Unsupported multi orientation dicom seg.");
        }
      }
    }
    // store spacing if needed, avoid multi
    if (typeof frameInfos[ii].spacing !== "undefined") {
      if (typeof spacing === "undefined") {
        spacing = frameInfos[ii].spacing;
      } else {
        if (!spacing.equals(frameInfos[ii].spacing)) {
          throw new Error("Unsupported multi resolution dicom seg.");
        }
      }
    }
  }

  // check spacing and orientation
  if (typeof spacing === "undefined") {
    throw new Error("No spacing found for DICOM SEG");
  }
  if (typeof imageOrientationPatient === "undefined") {
    throw new Error("No imageOrientationPatient found for DICOM SEG");
  }

  // orientation
  const rowCosines = new dwv.math.Vector3D(
    parseFloat(imageOrientationPatient[0]),
    parseFloat(imageOrientationPatient[1]),
    parseFloat(imageOrientationPatient[2])
  );
  const colCosines = new dwv.math.Vector3D(
    parseFloat(imageOrientationPatient[3]),
    parseFloat(imageOrientationPatient[4]),
    parseFloat(imageOrientationPatient[5])
  );
  const normal = rowCosines.crossProduct(colCosines);
  /* eslint-disable array-element-newline */
  const orientationMatrix = new dwv.math.Matrix33([
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

  // sort positions patient
  framePosPats.sort(dwv.dicom.getComparePosPat(orientationMatrix));

  const point3DFromArray = function (arr) {
    return new dwv.math.Point3D(arr[0], arr[1], arr[2]);
  };

  // frame origins
  const frameOrigins = [];
  for (let n = 0; n < framePosPats.length; ++n) {
    frameOrigins.push(point3DFromArray(framePosPats[n]));
  }

  // use calculated spacing
  let newSpacing = spacing;
  const geoSliceSpacing = dwv.image.getSliceGeometrySpacing(frameOrigins, orientationMatrix, false);
  const spacingValues = spacing.getValues();
  if (typeof geoSliceSpacing !== "undefined" && geoSliceSpacing !== spacingValues[2]) {
    spacingValues[2] = geoSliceSpacing;
    newSpacing = new dwv.image.Spacing(spacingValues);
  }

  // tmp geometry with correct spacing but only one slice
  const tmpGeometry = new dwv.image.Geometry(frameOrigins[0], size, newSpacing, orientationMatrix);

  // origin distance test
  const isNotSmall = function (value) {
    let res = value > dwv.math.REAL_WORLD_EPSILON;
    if (res) {
      // try larger epsilon
      res = value > dwv.math.REAL_WORLD_EPSILON * 10;
      if (!res) {
        // warn if epsilon < value < epsilon * 10
        dwv.logger.warn("Using larger real world epsilon in SEG pos pat adding");
      }
    }
    return res;
  };

  // add possibly missing posPats
  const posPats = [];
  posPats.push(framePosPats[0]);
  let sliceIndex = 0;
  for (let g = 1; g < framePosPats.length; ++g) {
    ++sliceIndex;
    let index = new dwv.math.Index([0, 0, sliceIndex]);
    let point = tmpGeometry.indexToWorld(index).get3D();
    const frameOrigin = frameOrigins[g];
    // check if more pos pats are needed
    let dist = frameOrigin.getDistance(point);
    const distPrevious = dist;
    // TODO: good threshold?
    while (isNotSmall(dist)) {
      dwv.logger.debug("Adding intermediate pos pats for DICOM seg at " + point.toString());
      posPats.push([point.getX(), point.getY(), point.getZ()]);
      ++sliceIndex;
      index = new dwv.math.Index([0, 0, sliceIndex]);
      point = tmpGeometry.indexToWorld(index).get3D();
      dist = frameOrigin.getDistance(point);
      if (dist > distPrevious) {
        throw new Error("Test distance is increasing when adding intermediate pos pats");
      }
    }
    // add frame pos pat
    posPats.push(framePosPats[g]);
  }

  // as many slices as posPats
  const numberOfSlices = posPats.length;

  // final geometry
  const geometry = new dwv.image.Geometry(frameOrigins[0], size, newSpacing, orientationMatrix);
  const uids = [0];
  for (let m = 1; m < numberOfSlices; ++m) {
    geometry.appendOrigin(point3DFromArray(posPats[m]), m);
    uids.push(m);
  }

  const getFindSegmentFunc = function (number) {
    return function (item) {
      return item.number === number;
    };
  };

  // create output buffer
  const mul = storeAsRGB ? 3 : 1;
  const buffer = new pixelBuffer.constructor(mul * sliceSize * numberOfSlices);
  buffer.fill(0);
  // merge frame buffers
  let sliceOffset = null;
  let frameOffset = null;
  for (let f = 0; f < frameInfos.length; ++f) {
    // get the slice index from the position in the posPat array
    sliceIndex = findIndexPosPat(posPats, frameInfos[f].imagePosPat);
    frameOffset = sliceSize * f;
    sliceOffset = sliceSize * sliceIndex;
    // get the frame display value
    const frameSegment = segments.find(getFindSegmentFunc(frameInfos[f].refSegmentNumber));
    const pixelValue = frameSegment.displayValue;
    for (let l = 0; l < sliceSize; ++l) {
      if (pixelBuffer[frameOffset + l] !== 0) {
        const offset = mul * (sliceOffset + l);
        if (storeAsRGB) {
          buffer[offset] = pixelValue.r;
          buffer[offset + 1] = pixelValue.g;
          buffer[offset + 2] = pixelValue.b;
        } else {
          buffer[offset] = pixelValue;
        }
      }
    }
  }

  // create image
  const image = new dwv.image.Image(geometry, buffer, uids);
  if (storeAsRGB) {
    image.setPhotometricInterpretation("RGB");
  }
  // meta information
  const meta = dwv.dicom.getDefaultDicomSegJson();
  // Study
  meta.StudyDate = dicomElements.getFromKey("x00080020");
  meta.StudyTime = dicomElements.getFromKey("x00080030");
  meta.StudyInstanceUID = dicomElements.getFromKey("x0020000D");
  meta.StudyID = dicomElements.getFromKey("x00200010");
  // Series
  meta.SeriesInstanceUID = dicomElements.getFromKey("x0020000E");
  meta.SeriesNumber = dicomElements.getFromKey("x00200011");
  // ReferringPhysicianName
  meta.ReferringPhysicianName = dicomElements.getFromKey("x00080090");
  // patient info
  meta.PatientName = dwv.dicom.cleanString(dicomElements.getFromKey("x00100010"));
  meta.PatientID = dwv.dicom.cleanString(dicomElements.getFromKey("x00100020"));
  meta.PatientBirthDate = dicomElements.getFromKey("x00100030");
  meta.PatientSex = dwv.dicom.cleanString(dicomElements.getFromKey("x00100040"));
  // Enhanced General Equipment Module
  meta.Manufacturer = dicomElements.getFromKey("x00080070");
  meta.ManufacturerModelName = dicomElements.getFromKey("x00081090");
  meta.DeviceSerialNumber = dicomElements.getFromKey("x00181000");
  meta.SoftwareVersions = dicomElements.getFromKey("x00181020");
  // dicom seg dimension
  meta.DimensionOrganizationSequence = dimension.organizations;
  meta.DimensionIndexSequence = dimension.indices;
  // custom
  meta.custom = {
    segments: segments,
    frameInfos: frameInfos,
    SOPInstanceUID: dicomElements.getFromKey("x00080018"),
  };

  // number of files: in this case equal to number slices,
  //   used to calculate buffer size
  meta.numberOfFiles = numberOfSlices;
  // FrameOfReferenceUID (optional)
  const frameOfReferenceUID = dicomElements.getFromKey("x00200052");
  if (frameOfReferenceUID) {
    meta.FrameOfReferenceUID = frameOfReferenceUID;
  }
  // LossyImageCompression (optional)
  const lossyImageCompression = dicomElements.getFromKey("x00282110");
  if (lossyImageCompression) {
    meta.LossyImageCompression = lossyImageCompression;
  }

  image.setMeta(meta);

  return image;
};
