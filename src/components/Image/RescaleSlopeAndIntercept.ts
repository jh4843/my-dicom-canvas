// Rescale Slope and Intercept

export default class RescaleSlopeAndIntercept {
  private _slope: number;
  private _intercept: number;

  constructor(slope: number, intercept: number) {
    this._slope = slope;
    this._intercept = intercept;
  }

  get slope(): number {
    return this._slope;
  }

  get intercept(): number {
    return this._intercept;
  }

  apply(value: number) {
    return value * this.slope + this.intercept;
  }

  toString() {
    return this.slope + ", " + this.intercept;
  }

  equal(rsi: RescaleSlopeAndIntercept) {
    return rsi !== null && this.slope === rsi.slope && this.intercept === rsi.intercept;
  }

  isID() {
    return this.slope === 1 && this.intercept === 0;
  }
}
