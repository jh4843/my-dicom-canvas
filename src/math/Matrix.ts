import * as myUtil from "@/utils";

export const setZeroMat33 = (): Matrix33 => {
  return new Matrix33([0, 0, 0, 0, 0, 0, 0, 0, 0]);
};

export const setIdentityMat33 = (): Matrix33 => {
  return new Matrix33([1, 0, 0, 0, 1, 0, 0, 0, 1]);
};

export class Matrix33 {
  protected _mat: number[];

  constructor(mat?: number[]) {
    if (mat == undefined) {
      this._mat = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    } else {
      this._mat = mat;
    }
  }

  set(mat: Matrix33) {
    this._mat = mat.mat;
  }

  get(row: number, col: number): number {
    return this._mat[row * 3 + col];
  }

  get mat(): number[] {
    return this._mat;
  }

  setZeroMat(): void {
    this._mat = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  }

  setIdentityMat(): void {
    this._mat = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  }

  getInverse(): Matrix33 {
    return myUtil.getMatrixInverse(new Matrix33(this._mat));
  }

  getCoronalMat(): Matrix33 {
    return myUtil.getCoronalMat();
  }

  multiplyArray3D(array3D: Array<number>) {
    if (array3D.length !== 3) {
      throw new Error(`Cannot multiply 3x3 matrix with non 3D array: ${array3D.length}`);
    }
    const values = [];
    for (let i = 0; i < 3; ++i) {
      let tmp = 0;
      for (let j = 0; j < 3; ++j) {
        tmp += this.get(i, j) * array3D[j];
      }
      values.push(tmp);
    }
    return values;
  }

  equal(rhs: Matrix33, p: number) {
    // TODO: add type check
    // check values
    for (let i = 0; i < 3; ++i) {
      for (let j = 0; j < 3; ++j) {
        if (!this.isSimilar(this.get(i, j), rhs.get(i, j), p)) {
          return false;
        }
      }
    }
    return true;
  }

  isSimilar(a: number, b: number, tol: number) {
    if (tol == undefined) {
      tol = Number.EPSILON;
    }
    return Math.abs(a - b) < tol;
  }
}
