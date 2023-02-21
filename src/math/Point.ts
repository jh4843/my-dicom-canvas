export class Point2D {
  protected _x: number;
  protected _y: number;

  constructor(x: number, y: number) {
    this._x = x;
    this._y = y;
  }

  get x(): number {
    return this._x;
  }

  get y(): number {
    return this._y;
  }

  add(pt: Point2D): Point2D {
    return new Point2D(this._x + pt.x, this._y + pt.y);
  }

  minus(pt: Point2D): Point2D {
    return new Point2D(this._x - pt.x, this._y - pt.y);
  }

  equal(pt: Point2D): boolean {
    if (this.x != pt.x) return false;

    if (this.y != pt.y) return false;

    return true;
  }

  getDistance(pt: Point2D): number {
    return Math.sqrt((this.x - pt.x) * (this.x - pt.x) + (this.y - pt.y) * (this.y - pt.y));
  }
}

export class Point3D extends Point2D {
  private _z: number;

  constructor(x: number, y: number, z: number) {
    super(x, y);
    this._z = z;
  }

  get z(): number {
    return this._z;
  }

  add(pt: Point3D): Point3D {
    return new Point3D(this.x + pt.x, this.y + pt.y, this.z + pt.z);
  }

  minus(pt: Point3D): Point3D {
    return new Point3D(this.x - pt.x, this.y - pt.y, this.z - pt.z);
  }

  equal(pt: Point3D): boolean {
    if (this.x != pt.x) return false;

    if (this.y != pt.y) return false;

    if (this.z != pt.z) return false;

    return true;
  }

  getDistance(pt: Point3D): number {
    return Math.sqrt(
      (this.x - pt.x) * (this.x - pt.x) + (this.y - pt.y) * (this.y - pt.y) + (this.z - pt.z) * (this.z - pt.z)
    );
  }
}
