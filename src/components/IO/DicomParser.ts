import { DicomParser as DP, createImage, Image as dwvImg } from "dwv";
import type * as MyType from "@/types";

//class to read DICOM file(.dcm) and parse it to display image as 8bit grayscale
//
export default class DicomParser {
  private _defaultCharacterSet = "ISO_IR 192";
  private _dicomElements = {};
  // private _dicomElementsLength = 0;
  // private _dicomElementsOffset = 0;
  // private _dicomElementsEndOffset = 0;

  private dicomImage: dwvImg | undefined = undefined;
  private _dicomImageBuffer: ArrayBufferLike | undefined;

  constructor() {
    this._defaultCharacterSet = "ISO_IR 192";
    this._dicomElements = {};
    //
    this.dicomImage = undefined;
    this._dicomImageBuffer = undefined;
    // this._dicomElementsLength = 0;
    // this._dicomElementsOffset = 0;
    // this._dicomElementsEndOffset = 0;
  }

  /**
   * Set the default character set.
   * @param {String} characterSet The default character set.
   */
  setDefaultCharacterSet(characterSet: string) {
    this._defaultCharacterSet = characterSet;
  }

  /**
   * Get the DICOM elements.
   * @return {Object} The DICOM elements.
   */
  getDicomElements() {
    return this._dicomElements;
  }

  /**
   * Parse a DICOM buffer.
   * @param {ArrayBuffer} buffer The input buffer.
   */
  parse(buffer: ArrayBufferLike) {
    // DICOM elements
    this._dicomElements = {};
    // this._dicomElementsLength = 0;
    // this._dicomElementsOffset = 0;
    // this._dicomElementsEndOffset = 0;
    // DICOM parser
    const dicomParser = new DP();
    //dicomParser.setDecoderCharacterSet(this._defaultCharacterSet);
    // parse the buffer
    try {
      dicomParser.parse(buffer);
      // check elements are good for image
      //dwv.image.checkElements(dicomParser.getDicomElements());
    } catch (error) {
      this.onerror({
        error: error,
        src: origin,
      });
      this.onloadend({
        src: origin,
      });
      return;
    }
    // store DICOM elements
    this._dicomElements = dicomParser.getDicomElements();

    this.dicomImage = createImage(this._dicomElements);

    console.log("Load Complete", this.getDicomElementsBuffer(), this.dicomImage?.getMeta());

    // this._dicomElementsLength = dicomParser.getDicomElementsLength();
    // this._dicomElementsOffset = dicomParser.getDicomElementsOffset();
    // this._dicomElementsEndOffset = dicomParser.getDicomElementsEndOffset();
  }

  /**
   * Get the DICOM elements buffer.
   * @return {ArrayBuffer} The DICOM elements buffer.
   */
  getDicomElementsBuffer() {
    return this.dicomImage?.getBuffer();
  }

  getDicomImageAs8Bits() {
    // check 16bit image
    //if (this._dicomImageBuffer) {
    //   const dicomImage = createImage(this._dicomElements);
    //   const dicomImageBuffer = dicomImage.getBuffer();
    //   // check if the image is 16bit
    //   if (dicomImage.getBitsAllocated() === 16) {
    //     // create a new image with 8bit data
    //     const dicomImage8 = new dwv.image.Image(
    //       dicomImage.getNumberOfColumns(),
    //       dicomImage.getNumberOfRows(),
    //       dicomImage.getPhotometricInterpretation(),
    //       8,
    //       dicomImage.getPlanarConfiguration()
    //     );
    //     // set the data
    //     const rescaleSlope = dicomImage.getRescaleSlope();
    //     const rescaleIntercept = dicomImage.getRescaleIntercept();
    //     const slope = rescaleSlope ? rescaleSlope : 1;
    //     const intercept = rescaleIntercept ? rescaleIntercept : 0;

    return this._dicomImageBuffer;
  }

  /**
   * Get the DICOM elements as a JSON string.
   * @return {String} The DICOM elements as a JSON string.
   */
  getDicomElementsAsJSON() {
    return JSON.stringify(this._dicomElements);
  }

  /**
   * Get the DICOM elements as a JSON object.
   * @return {Object} The DICOM elements as a JSON object.
   */
  getDicomElementsAsObject() {
    return this._dicomElements;
  }

  onloadend(_event: MyType.iEventInfo) {}

  onerror(_event: MyType.iEventInfo) {}
}
