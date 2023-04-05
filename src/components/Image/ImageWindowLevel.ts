const minWindowWidth = 1;

export default class ImageWindowLevel {
  private _center: number;
  private _width: number;

  private _signedOffset: number;
  private _ymin: number;
  private _ymax: number;

  private _xmin: number;
  private _xmax: number;
  private _slope: number;

  private _inter: number;

  constructor(center: number, width: number, signedOffset: number) {
    this._center = center;

    this._width = Math.max(minWindowWidth, width);

    this._signedOffset = signedOffset;
    this._ymin = 0;
    this._ymax = 255;

    // init
    const c = this._center + this._signedOffset;

    this._xmin = c - 0.5 - (this._width - 1) / 2;
    this._xmax = c - 0.5 + (this._width - 1) / 2;

    this._slope = (this._ymax - this._ymin) / (this._width - 1);
    this._inter = (-(c - 0.5) / (this._width - 1) + 0.5) * (this._ymax - this._ymin) + this._ymin;
  }

  init() {
    const c = this._center + this._signedOffset;
    // from the standard
    this._xmin = c - 0.5 - (this._width - 1) / 2;
    this._xmax = c - 0.5 + (this._width - 1) / 2;
    // develop the equation:
    // y = ( ( x - (c - 0.5) ) / (w-1) + 0.5 ) * (ymax - ymin) + ymin
    // y = ( x / (w-1) ) * (ymax - ymin) +
    //     ( -(c - 0.5) / (w-1) + 0.5 ) * (ymax - ymin) + ymin
    this._slope = (this._ymax - this._ymin) / (this._width - 1);
    this._inter = (-(c - 0.5) / (this._width - 1) + 0.5) * (this._ymax - this._ymin) + this._ymin;
  }

  getCenter() {
    return this._center;
  }

  getWidth() {
    return this._width;
  }

  setRange(min: number, max: number) {
    this._ymin = parseInt(min.toString(), 10);
    this._ymax = parseInt(max.toString(), 10);
    // re calc
    this.init();
  }

  setSignedOffset(offset: number) {
    this._signedOffset = offset;
    // re calc
    this.init();
  }

  apply(value: number) {
    if (value <= this._xmin) {
      return this._ymin;
    } else if (value > this._xmax) {
      return this._ymax;
    } else {
      return parseInt((value * this._slope + this._inter).toString(), 10);
    }
  }

  equal(rhs: ImageWindowLevel) {
    return rhs !== null && this.getCenter() === rhs.getCenter() && this.getWidth() === rhs.getWidth();
  }

  toString() {
    return this.getCenter() + ", " + this.getWidth();
  }
}
