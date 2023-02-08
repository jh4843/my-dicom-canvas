import Queue from "@/components/DataContainer/Queue";
import DicomParser from "./DicomParser";

export default class DicomManager {
  private _reservedItems = new Queue<string>();
  private _failedItems = new Queue<string>();
  private _dicomParser = new DicomParser();

  constructor() {
    this._reservedItems.empty();
    this._failedItems.empty();
  }

  reserve(fileName: string): boolean {
    this._reservedItems.enQueue(fileName);
    return true;
  }

  parse(): void {
    for (let i = 0; i < this._reservedItems.size(); i++) {
      const fileName = this._reservedItems.deQueue();
      if (fileName != undefined) {
        if (!this._dicomParser.parse(fileName)) {
          this._failedItems.enQueue(fileName);
        }
      }
    }
  }
}
