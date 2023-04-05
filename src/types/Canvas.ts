export interface iCommonCanvasInfo {
  x: number;
  y: number;
  //
  width: number;
  height: number;
  //
  ratio: number;
}

export class CommonCanvas implements iCommonCanvasInfo {
  x: number;
  y: number;
  //
  width: number;
  height: number;
  //
  ratio: number;

  constructor(x: number = 0, y: number = 0, width: number = 300, height: number = 300, ratio: number = 1.0) {
    this.x = x;
    this.y = y;

    this.width = width;
    this.height = height;

    this.ratio = ratio;
  }

  set(canvas: CommonCanvas) {
    this.x = canvas.x;
    this.y = canvas.y;

    this.width = canvas.width;
    this.height = canvas.height;

    this.ratio = canvas.ratio;
  }
}
