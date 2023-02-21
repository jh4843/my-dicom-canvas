import type * as myType from "@/types";
import ImageSize from "./ImageSize";
import ImageSpacing from "./ImageSpacing";
import ImageGeometry from "./ImageGeometry";
import MyImage from "./MyImage";
import { Point3D } from "@/math/Point";

export default class DomReader {
  imageDataToBuffer(imageData: ImageData) {
    // remove alpha
    // TODO support passing the full image data
    const dataLen = imageData.data.length;
    const buffer = new Uint8Array((dataLen / 4) * 3);
    let j = 0;
    for (let i = 0; i < dataLen; i += 4) {
      buffer[j] = imageData.data[i];
      buffer[j + 1] = imageData.data[i + 1];
      buffer[j + 2] = imageData.data[i + 2];
      j += 3;
    }
    return buffer;
  }

  // Get an image from an input context imageData.
  getDefaultImage(
    width: number,
    height: number,
    sliceIndex: number,
    imageBuffer: myType.tImageBufferType,
    numberOfFrames: number,
    imageUid: string,
    // when use 3D demension
    //imageDemension: myType.eImageDimension = myType.eImageDimension.image_dimension_2d,
    depth?: number
  ) {
    // image size
    const imageSize = new ImageSize(width, height, depth);
    // default spacing
    // TODO: misleading...
    const imageSpacing = new ImageSpacing(1, 1, 1);
    // default origin
    const origin = new Point3D(0, 0, sliceIndex);
    // create image
    const geometry = new ImageGeometry(origin, imageSize, imageSpacing);
    console.log("getDefaultImage: ", geometry);
    const image = new MyImage(geometry, imageBuffer, [imageUid]);
    image.setPhotometricInterpretation("RGB");
    // meta information
    const meta: myType.IImageMetaData = {};
    meta.bitsStored = 8;
    if (typeof numberOfFrames !== "undefined") {
      meta.numberOfFiles = numberOfFrames;
    }
    image.setMeta(meta);
    // return
    return image;
  }

  getViewFromDOMImage(domImage: HTMLImageElement, origin: string) {
    // image size
    const width = domImage.width;
    const height = domImage.height;

    // draw the image in the canvas in order to get its data
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    if (ctx == undefined || ctx == null) return;

    ctx.drawImage(domImage, 0, 0);
    // get the image data
    const imageData = ctx.getImageData(0, 0, width, height);

    // image properties
    const info: myType.IImageMetaInfo = {};
    if (typeof domImage.origin === "string") {
      info["origin"] = { value: domImage.origin };
    } else {
      info["fileName"] = { value: domImage.origin.name };
      info["fileType"] = { value: domImage.origin.type };
      info["fileLastModifiedDate"] = { value: domImage.origin.lastModifiedDate };
    }
    info["imageWidth"] = { value: width };
    info["imageHeight"] = { value: height };

    const sliceIndex = domImage.index ? domImage.index : 0;
    // info["imageUid"] = { value: sliceIndex };

    // create view
    const imageBuffer = this.imageDataToBuffer(imageData);
    const image = this.getDefaultImage(width, height, sliceIndex, imageBuffer, 1, sliceIndex);

    console.log(`DomReader ${width}, ${height}, ${imageData.data.length}`);

    console.log(`DomReader::getViewFromDOMImage`, image);

    const res: myType.IEventInfo = {
      data: {
        image: image,
        info: info,
      },
      src: origin,
    };

    // return
    return res;
  }
}
