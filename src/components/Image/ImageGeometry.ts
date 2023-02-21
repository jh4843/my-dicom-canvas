import type { Point3D } from "@/math/Point";
import { Vector3D } from "@/math/Vector";
import ImageSize from "@/components/Image/ImageSize";
import ImageSpacing from "@/components/Image/ImageSpacing";
import type { Matrix33 } from "@/math/Matrix";
import { setIdentityMat33 } from "@/math/Matrix";

export const getOrientedArray3D = (array3D: Array<number>, orientation: Matrix33) => {
  // values = orientation * orientedValues
  // -> inv(orientation) * values = orientedValues
  return orientation.getInverse().multiplyArray3D(array3D);
};

export default class ImageGeometry {
  private _origins: Array<Point3D>;
  private _newOrigins: boolean;
  private _size: ImageSize;
  private _spacing: ImageSpacing;
  private _orientation: Matrix33;
  private _initTime: number; // for 3D
  private _timeOrigins: Array<Point3D[]>;

  constructor(origin: Point3D, size: ImageSize, spacing: ImageSpacing, orientation?: Matrix33, time?: number) {
    this._origins = [origin];
    this._newOrigins = false;
    this._size = size;
    this._spacing = spacing;

    if (orientation == undefined) {
      this._orientation = setIdentityMat33();
    } else {
      this._orientation = orientation;
    }

    if (time == undefined) {
      this._initTime = -1;
      this._timeOrigins = [];
    } else {
      this._initTime = time;
      this._timeOrigins = [];
      this._timeOrigins[time] = [origin];
    }
  }

  get origins(): Array<Point3D> {
    return this._origins;
  }

  getCurrentTotalNumberOfSlice() {
    const keys = Object.keys(this._timeOrigins);
    if (keys.length === 0) {
      return 0;
    }
    let count = 0;
    for (let i = 0; i < keys.length; ++i) {
      count += this._timeOrigins[Number(keys[i])].length;
    }
    return count;
  }

  hasSlicesAtTime(time: number) {
    return typeof this._timeOrigins[time] !== "undefined";
  }

  getCurrentNumberOfSlicesBeforeTime(time: number) {
    const keys = Object.keys(this._timeOrigins);
    if (keys.length === 0) {
      return undefined;
    }
    let count = 0;
    for (let i = 0; i < keys.length; ++i) {
      const key = keys[i];
      if (parseInt(key, 10) === time) {
        break;
      }
      count += this._timeOrigins[Number(key)].length;
    }
    return count;
  }

  getCurrentTotalNumberOfSlices() {
    const keys = Object.keys(this._timeOrigins);
    if (keys.length === 0) {
      return this._origins.length;
    }
    let count = 0;
    for (let i = 0; i < keys.length; ++i) {
      count += this._timeOrigins[Number(keys[i])].length;
    }
    return count;
  }

  getOrigin(): Point3D {
    return this._origins[0];
  }

  getOrigins(): Array<Point3D> {
    return this._origins;
  }

  getOrientation(): Matrix33 {
    return this._orientation;
  }

  getInitialTime(): number {
    return this._initTime;
  }

  // NEED to FIX it
  getSize(viewOrientation?: Matrix33): ImageSize {
    let res = this._size;
    if (viewOrientation && typeof viewOrientation !== "undefined") {
      let values = getOrientedArray3D([this._size.width, this._size.height, this._size.depth], viewOrientation);
      values = values.map(Math.abs);
      //res = new ImageSize(values.concat(this._size.getValues().slice(3)));
      res = new ImageSize(this._size.width, this._size.height, this._size.depth);
    }
    return res;
  }

  getSliceIndex(point: Point3D, time: number) {
    // cannot use this.worldToIndex(point).getK() since
    // we cannot guaranty consecutive slices...

    console.log(`ImageGeometry::getSliceIndex `, point, time);

    let localOrigins = this.origins;
    if (typeof time !== "undefined") {
      localOrigins = this._timeOrigins[time];
    }

    // find the closest index
    let closestSliceIndex = 0;

    console.log(`ImageGeometry::getSliceIndex::localOrigins `, localOrigins);

    let minDist = point.getDistance(localOrigins[0]);
    let dist = 0;
    for (let i = 0; i < localOrigins.length; ++i) {
      dist = point.getDistance(localOrigins[i]);
      if (dist < minDist) {
        minDist = dist;
        closestSliceIndex = i;
      }
    }
    const closestOrigin = localOrigins[closestSliceIndex];
    // direction between the input point and the closest origin
    const pointDir = point.minus(closestOrigin);
    // use third orientation matrix column as base plane vector
    const normal = new Vector3D(this._orientation.get(0, 2), this._orientation.get(1, 2), this._orientation.get(2, 2));
    // a.dot(b) = ||a|| * ||b|| * cos(theta)
    // (https://en.wikipedia.org/wiki/Dot_product#Geometric_definition)
    // -> the sign of the dot product depends on the cosinus of
    //    the angle between the vectors
    //   -> >0 => vectors are codirectional
    //   -> <0 => vectors are opposite
    const vecDir = new Vector3D(pointDir.x, pointDir.y, pointDir.z);
    const dotProd = normal.dotProduct(vecDir);
    // oposite vectors get higher index
    const sliceIndex = dotProd > 0 ? closestSliceIndex + 1 : closestSliceIndex;
    return sliceIndex;
  }

  appendOrigin(origin: Point3D, index: number, time: number) {
    if (time !== undefined) {
      this._timeOrigins[time].splice(index, 0, origin);
    }
    if (typeof time === "undefined" || time === this.getInitialTime()) {
      this._newOrigins = true;
      // add in origin array
      this._origins.splice(index, 0, origin);
      // increment second dimension
      const values = this._size.getValues();
      values[2] += 1;
      this._size = new ImageSize(values[0], values[1], values[2]);
    }
  }

  appendFrame(time?: number, origin?: Point3D) {
    // add origin to list
    if (time !== undefined && origin !== undefined) this._timeOrigins[time] = [origin];
    // increment third dimension
    const sizeValues = this._size.getValues();
    const spacingValues = this._spacing.getValues();
    if (sizeValues.length === 4) {
      sizeValues[3] += 1;
    } else {
      sizeValues.push(2);
      spacingValues.push(1);
    }
    this._size = new ImageSize(sizeValues[0], sizeValues[1], sizeValues[2]);
    this._spacing = new ImageSpacing(spacingValues[0], spacingValues[1], spacingValues[2]);
  }
}
