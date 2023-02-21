import type ImageGeometry from "./ImageGeometry";
import MathIndex from "@/math/MathIndex";
import type { Point3D } from "@/math/Point";
import RescaleSlopeAndIntercept from "./RescaleSlopeAndIntercept";
import type * as myType from "@/types";
import * as myUtils from "@/utils";
import DicomParser from "@/components/Dicom/DicomParser";
import { type IEventInfo, eEventType } from "@/types";

export const getSliceIndex = (volumeGeometry: ImageGeometry, sliceGeometry: ImageGeometry): MathIndex => {
  // possible time
  const timeId = sliceGeometry.getInitialTime();

  console.log(`${MyImage.constructor.name}:: `, sliceGeometry.getOrigins());

  // index values
  const values: Array<number> = [];
  // x, y
  values.push(0);
  values.push(0);
  // z
  values.push(volumeGeometry.getSliceIndex(sliceGeometry.getOrigin(), timeId));
  // time
  if (typeof timeId !== "undefined") {
    values.push(timeId);
  }
  // return index
  return new MathIndex(values);
};

export default class MyImage {
  // buffer
  private _buffer: myType.tImageBufferType;

  public get buffer(): myType.tImageBufferType {
    return this._buffer;
  }

  private _dicomParser: DicomParser = new DicomParser();

  private _imageUids: Array<string>;

  private _geometry: ImageGeometry;

  // Rescale slope and intercept
  private _rsi: RescaleSlopeAndIntercept | null = new RescaleSlopeAndIntercept(1, 0);
  // Varying rescale slope and intercept.
  private _rsis: Array<RescaleSlopeAndIntercept> | null = null;
  // Flag to know if the RSIs are all identity (1,0).
  private _isIdentityRSI: boolean = true;
  // Flag to know if the RSIs are all equals.
  private _isConstantRSI: boolean = true;
  // Photometric interpretation (MONOCHROME, RGB...).
  private _photometricInterpretation: string = "MONOCHROME2";
  // Planar configuration for RGB data (0:RGBRGBRGBRGB... or 1:RRR...GGG...BBB...).
  private _planarConfiguration: number = 0;

  private _numberOfComponents: number = 0;

  private _meta: myType.IImageMetaData = {};

  private _index: MathIndex;

  private _listenerHandler = new myUtils.ListenerHandler();

  constructor(geometry: ImageGeometry, buffer: myType.tImageBufferType, imageUids: Array<string>) {
    this._geometry = geometry;
    this._buffer = buffer;
    const imgSize = geometry.getSize();

    if (buffer != null) {
      this._numberOfComponents = buffer.length / imgSize.getTotalSize();
    } else {
      console.log("buffer is null");
    }

    this._imageUids = imageUids;
  }

  getGeometry() {
    return this._geometry;
  }

  getImageUid(index?: number) {
    let uid = this._imageUids[0];
    if (this._imageUids.length !== 1 && typeof index !== "undefined") {
      uid = this._imageUids[this.getSecondaryOffset(index)];
    }
    return uid;
  }

  getSecondaryOffset(index: number) {
    return this._geometry.getSize().indexToOffset(index, 2);
  }

  getSecondaryOffsetMax() {
    return this._geometry.getSize().getTotalSize(2);
  }

  getRescaleSlopeAndInterceptAtOffset(offset: number) {
    if (this._rsis != null && this._rsis[offset]) {
      return this._rsis[offset];
    }

    return null;
  }

  getRescaleSlopeAndIntercept(index?: number) {
    let res = this._rsi;
    if (!this._isConstantRSI) {
      if (typeof index === "undefined") {
        throw new Error("Cannot get non constant RSI with empty slice index.");
      }
      const offset = this.getSecondaryOffset(index);
      if (this._rsis !== null && this._rsis)
        if (this?._rsis[offset] !== undefined) {
          res = this?._rsis[offset];
        } else {
          console.log("undefined non constant rsi at " + offset);
        }
    }
    return res;
  }

  setRescaleSlopeAndIntercept(inRsi: RescaleSlopeAndIntercept, offset: number) {
    // update identity flag
    this._isIdentityRSI = this._isIdentityRSI && inRsi.isID();
    // update constant flag
    if (!this._isConstantRSI) {
      if (this._index === undefined) {
        throw new Error("Cannot store non constant RSI with empty slice index.");
      }
      this._rsis?.splice(offset, 0, inRsi);
    } else {
      if (!this._rsi?.equal(inRsi)) {
        if (this._index === undefined) {
          // no slice index, replace existing
          this._rsi = inRsi;
        } else {
          // first non constant rsi
          this._isConstantRSI = false;
          // switch to non constant mode
          this._rsis = [];
          // initialise RSIs
          for (let i = 0, leni = this.getSecondaryOffsetMax(); i < leni; ++i) {
            this._rsis.push(new RescaleSlopeAndIntercept(1, 0));
          }
          // store
          this._rsi = null;
          this._rsis.splice(offset, 0, inRsi);
        }
      }
    }
  }

  getPhotometricInterpretation() {
    return this._photometricInterpretation;
  }
  /**
   * Set the photometricInterpretation of the image.
   *
   * @param {string} interp The photometricInterpretation of the image.
   */
  setPhotometricInterpretation(interp: string) {
    this._photometricInterpretation = interp;
  }

  getPlanarConfiguration() {
    return this._planarConfiguration;
  }
  /**
   * Set the planarConfiguration of the image.
   *
   * @param {number} config The planarConfiguration of the image.
   */
  setPlanarConfiguration(config: number) {
    this._planarConfiguration = config;
  }
  /**
   * Get the numberOfComponents of the image.
   *
   * @returns {number} The numberOfComponents of the image.
   */
  getNumberOfComponents() {
    return this._numberOfComponents;
  }

  /**
   * Get the meta information of the image.
   *
   * @returns {object} The meta information of the image.
   */
  getMeta(): myType.IImageMetaData {
    return this._meta;
  }
  /**
   * Set the meta information of the image.
   *
   * @param {object} rhs The meta information of the image.
   */
  setMeta(rhs: myType.IImageMetaData) {
    this._meta = rhs;
  }

  getValueAtOffset(offset: number): number {
    if (this._buffer == null) return -1;
    return this._buffer[offset];
  }

  getOffsets(value: number | myType.IImageDisplayValue) {
    // value to array
    const val: Array<number> = [];
    if (typeof value == "number" && this._numberOfComponents === 1) {
      val.push(value);
    } else if (this._numberOfComponents === 3 && typeof value !== "object") {
      val.push(value.r);
      val.push(value.g);
      val.push(value.b);
    }
    // main loop
    const offsets = [];
    let equal;

    if (this.buffer == null) {
      console.log("getOffsets) buffer is null");
      return [];
    }

    for (let i = 0; i < this.buffer.length; i = i + this._numberOfComponents) {
      equal = true;
      for (let j = 0; j < this._numberOfComponents; ++j) {
        if (this.buffer[i + j] !== val[j]) {
          equal = false;
          break;
        }
      }
      if (equal) {
        offsets.push(i);
      }
    }
    return offsets;
  }

  clone() {
    if (this.buffer == null) {
      console.log("clone) buffer is null");
      return [];
    }

    // clone the image buffer
    const clonedBuffer = this.buffer.slice(0);
    // create the image copy
    const copy = new Image(this._geometry, clonedBuffer, this._imageUids);
    // copy the RSI(s)
    if (this._isConstantRSI) {
      const rsi = this.getRescaleSlopeAndIntercept(0);

      if (rsi == undefined) return;

      copy.setRescaleSlopeAndIntercept(rsi, 0);
    } else {
      for (let i = 0; i < this.getSecondaryOffsetMax(); ++i) {
        const rsiOffset = this.getRescaleSlopeAndInterceptAtOffset(i);
        if (rsiOffset == null) continue;
        copy.setRescaleSlopeAndIntercept(rsiOffset, i);
      }
    }
    // copy extras
    copy.setPhotometricInterpretation(this.getPhotometricInterpretation());
    copy.setPlanarConfiguration(this.getPlanarConfiguration());
    copy.setMeta(this.getMeta());
    // return
    return copy;
  }

  realloc(size: number) {
    // save buffer
    let tmpBuffer = this.buffer;

    if (this.buffer == null) {
      console.log("realloc) cur buffer is null");
    } else {
      this._buffer = this._dicomParser.getTypedArray(
        this.buffer.BYTES_PER_ELEMENT * 8,
        this._meta.isSigned ? 1 : 0,
        size
      );
      if (this._buffer === null) {
        throw new Error("Cannot reallocate data for image.");
      }
      // put old in new

      if (tmpBuffer == null) {
        console.log("realloc) tmpBuffer is null");
      } else {
        this._buffer.set(tmpBuffer);
      }

      // clean
      tmpBuffer = null;
    }

    // create new
  }

  appendSlice(rhs: Image) {
    // check input
    if (rhs === null) {
      throw new Error("Cannot append null slice");
    }
    const rhsSize = rhs.getGeometry().getSize();
    let size = this.getGeometry().getSize();
    if (rhsSize.get(2) !== 1) {
      throw new Error("Cannot append more than one slice");
    }
    if (size.get(0) !== rhsSize.get(0)) {
      throw new Error("Cannot append a slice with different number of columns");
    }
    if (size.get(1) !== rhsSize.get(1)) {
      throw new Error("Cannot append a slice with different number of rows");
    }
    if (!this.getGeometry().getOrientation().equal(rhs.getGeometry().getOrientation(), 0.0001)) {
      throw new Error("Cannot append a slice with different orientation");
    }
    if (this._photometricInterpretation !== rhs.getPhotometricInterpretation()) {
      throw new Error("Cannot append a slice with different photometric interpretation");
    }
    // all meta should be equal
    // [Todo]
    // for (const key in this._meta) {
    //   if (key === "windowPresets" || key === "numberOfFiles" || key === "custom") {
    //     continue;
    //   }
    //   if (this._meta[key] !== rhs.getMeta()[key]) {
    //     throw new Error("Cannot append a slice with different " + key);
    //   }
    // }

    // possible time
    const timeId = rhs.getGeometry().getInitialTime();

    // append frame if needed
    let isNewFrame = false;
    if (typeof timeId !== "undefined" && !this._geometry.hasSlicesAtTime(timeId)) {
      // update grometry
      this.appendFrame(timeId, rhs.getGeometry().getOrigin());
      // update size
      size = this.getGeometry().getSize();
      // update flag
      isNewFrame = true;
    }

    // get slice index
    this._index = getSliceIndex(this.getGeometry(), rhs.getGeometry());

    // calculate slice size
    const sliceSize: number = this._numberOfComponents * size.getDimSize(2);

    // create full buffer if not done yet
    if (this._meta.numberOfFiles == undefined) {
      throw new Error("Missing number of files for buffer manipulation.");
    }
    const fullBufferSize = sliceSize * this._meta.numberOfFiles;
    if (this.buffer != null && this.buffer.length !== fullBufferSize) {
      this.realloc(fullBufferSize);
    }

    // slice index
    const sliceIndex = this._index.get(2);

    // slice index including possible 4D
    let fullSliceIndex = sliceIndex;
    const curNumOfSlicesBeforeTime = this.getGeometry().getCurrentNumberOfSlicesBeforeTime(timeId);
    if (timeId !== undefined && curNumOfSlicesBeforeTime !== undefined) {
      fullSliceIndex += curNumOfSlicesBeforeTime;
    }
    // offset of the input slice
    const indexOffset = fullSliceIndex * sliceSize;
    const maxOffset = this.getGeometry().getCurrentTotalNumberOfSlices() * sliceSize;
    // move content if needed
    if (indexOffset < maxOffset) {
      this._buffer?.set(this._buffer?.subarray(indexOffset, maxOffset), indexOffset + sliceSize);
    }
    // add new slice content

    if (rhs.buffer !== null) {
      this._buffer?.set(rhs.buffer, indexOffset);
    }

    // update geometry
    if (!isNewFrame) {
      this.getGeometry().appendOrigin(rhs.getGeometry().getOrigin(), sliceIndex, timeId);
    }
    // update rsi
    // (rhs should just have one rsi)
    const newRsi = rhs.getRescaleSlopeAndIntercept();
    if (newRsi != null) {
      this.setRescaleSlopeAndIntercept(newRsi, fullSliceIndex);
    }

    // current number of images
    const numberOfImages = this._imageUids.length;

    // insert sop instance UIDs
    this._imageUids.splice(fullSliceIndex, 0, rhs.getImageUid());

    // [TODO]
    // update window presets
    // if (this._meta.windowPresets === undefined) {
    //   const windowPresets = this._meta.windowPresets;
    //   const rhsPresets = rhs.getMeta().windowPresets;
    //   if (rhsPresets !== undefined && rhsPresets.length > 0) {
    //     const keys = Object.keys(rhsPresets);
    //     let pkey = null;
    //     for (let i = 0; i < keys.length; ++i) {
    //       pkey = keys[i];
    //       const rhsPreset = rhsPresets[pkey];
    //       const windowPreset = windowPresets[pkey];
    //       if (typeof windowPreset !== "undefined") {
    //         // if not set or false, check perslice
    //         if (typeof windowPreset.perslice === "undefined" || windowPreset.perslice === false) {
    //           // if different preset.wl, mark it as perslice
    //           if (!windowPreset.wl[0].equals(rhsPreset.wl[0])) {
    //             windowPreset.perslice = true;
    //             // fill wl array with copy of wl[0]
    //             // (loop on number of images minus the existing one)
    //             for (let j = 0; j < numberOfImages - 1; ++j) {
    //               windowPreset.wl.push(windowPreset.wl[0]);
    //             }
    //           }
    //         }
    //         // store (first) rhs preset.wl if needed
    //         if (typeof windowPreset.perslice !== "undefined" && windowPreset.perslice === true) {
    //           windowPresets[pkey].wl.splice(fullSliceIndex, 0, rhsPreset.wl[0]);
    //         }
    //       } else {
    //         // if not defined (it should be), store all
    //         windowPresets[pkey] = rhsPresets[pkey];
    //       }
    //     }
    //   }
    // }
  }

  /**
   * Append a frame buffer to the image.
   *
   * @param {object} frameBuffer The frame buffer to append.
   * @param {number} frameIndex The frame index.
   */
  appendFrameBuffer(frameBuffer: myType.tImageBufferType, frameIndex: number) {
    // create full buffer if not done yet
    const size = this.getGeometry().getSize();
    const frameSize = this._numberOfComponents * size.getDimSize(2);
    if (this._meta.numberOfFiles === undefined) {
      throw new Error("Missing number of files for frame buffer manipulation.");
    }
    const fullBufferSize = frameSize * this._meta.numberOfFiles;
    if (this._buffer?.length !== fullBufferSize) {
      this.realloc(fullBufferSize);
    }
    // append
    if (frameIndex >= this._meta.numberOfFiles) {
      throw new Error("Cannot append a frame at an index above the number of frames");
    }

    if (frameBuffer != null) {
      this.buffer?.set(frameBuffer, frameSize * frameIndex);
      this.appendFrame();
    }
  }

  appendFrame(time?: number, origin?: Point3D) {
    this._geometry.appendFrame(time, origin);
    this.fireEvent({ type: eEventType.event_type_append_frame });
  }

  fireEvent(event: IEventInfo) {
    this._listenerHandler.fireEvent(event);
  }
}
