export default class MathIndex {
  protected _values: Array<number>;

  constructor(values: Array<number>) {
    this._values = values;
  }

  get value() {
    return this._values;
  }

  get length() {
    return this._values.length;
  }

  get(i: number) {
    return this._values[i];
  }
}
