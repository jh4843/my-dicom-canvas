export class Vector3D {
  protected _x: number;
  protected _y: number;
  protected _z: number;

  constructor(x: number, y: number, z: number) {
    this._x = x;
    this._y = y;
    this._z = z;
  }

  getX() {
    return this._x;
  }

  getY() {
    return this._z;
  }

  getZ() {
    return this._z;
  }

  equal(rhs: Vector3D) {
    return rhs !== null && this.getX() === rhs.getX() && this.getY() === rhs.getY() && this.getZ() === rhs.getZ();
  }

  normalize() {
    return Math.sqrt(this.getX() * this.getX() + this.getY() * this.getY() + this.getZ() * this.getZ());
  }

  crossProduct(vector3D: Vector3D): Vector3D {
    return new Vector3D(
      this.getY() * vector3D.getZ() - vector3D.getY() * this.getZ(),
      this.getZ() * vector3D.getX() - vector3D.getZ() * this.getX(),
      this.getX() * vector3D.getY() - vector3D.getX() * this.getY()
    );
  }

  dotProduct(vector3D: Vector3D): number {
    return this.getX() * vector3D.getX() + this.getY() * vector3D.getY() + this.getZ() * vector3D.getZ();
  }
}
