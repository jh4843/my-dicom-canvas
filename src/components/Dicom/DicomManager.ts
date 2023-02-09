//import Queue from "@/components/DataContainer/Queue";
import DicomParser from "./DicomParser";

export interface DicomFile {
  files: File[];
}

export default class DicomManager {
  // private _reservedItems = new Queue<string>();
  // private _failedItems = new Queue<string>();

  private _files: File[];
  private _dicomParser = new DicomParser();

  constructor() {
    this._files = [];
  }

  pushFileToOpen(files: File[]): boolean {
    for (const file of files) {
      this._files.push(file);
    }
    return true;
  }

  onLoadDicom() {}

  parse(): void {
    const reader = new FileReader();

    reader.addEventListener("load", (event) => {
      console.log("Loaded event: ", event);
      console.log("Loaded result: ", reader.result);

      // const img = new Image();

      // if (reader.result != null) {
      //   if (typeof reader.result === "string") {
      //     img.src = reader.result;
      //   } else {
      //     console.log("type error: ", reader.result);
      //   }
      // }

      // img.onload = function () {
      //   // do something
      // };
    });

    for (const file of this._files) {
      reader.readAsDataURL(file);
      console.log("file name: ", file.name);
    }
  }

  // reserve(fileName: string): boolean {
  //   this._reservedItems.enQueue(fileName);
  //   return true;
  // }

  // parse(): void {
  //   for (let i = 0; i < this._reservedItems.size(); i++) {
  //     const fileName = this._reservedItems.deQueue();
  //     if (fileName != undefined) {
  //       if (!this._dicomParser.parse(fileName)) {
  //         this._failedItems.enQueue(fileName);
  //       }
  //     }
  //   }
  // }
}
