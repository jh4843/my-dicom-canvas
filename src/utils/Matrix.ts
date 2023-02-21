import { Matrix33 } from "@/math/Matrix";

// Utils
export const getMatrixInverse = (mat: Matrix33): Matrix33 => {
  const m00 = mat.get(0, 0);
  const m01 = mat.get(0, 1);
  const m02 = mat.get(0, 2);
  const m10 = mat.get(1, 0);
  const m11 = mat.get(1, 1);
  const m12 = mat.get(1, 2);
  const m20 = mat.get(2, 0);
  const m21 = mat.get(2, 1);
  const m22 = mat.get(2, 2);

  const a1212 = m11 * m22 - m12 * m21;
  const a2012 = m12 * m20 - m10 * m22;
  const a0112 = m10 * m21 - m11 * m20;

  let det = m00 * a1212 + m01 * a2012 + m02 * a0112;
  if (det === 0) {
    console.log("Cannot invert 3*3 matrix with zero determinant.");
    return new Matrix33([]);
  }
  det = 1 / det;

  return new Matrix33([
    det * a1212,
    det * (m02 * m21 - m01 * m22),
    det * (m01 * m12 - m02 * m11),
    det * a2012,
    det * (m00 * m22 - m02 * m20),
    det * (m02 * m10 - m00 * m12),
    det * a0112,
    det * (m01 * m20 - m00 * m21),
    det * (m00 * m11 - m01 * m10),
  ]);
};
export const getCoronalMat = (): Matrix33 => {
  return new Matrix33([1, 0, 0, 0, 0, 1, 0, -1, 0]);
};
