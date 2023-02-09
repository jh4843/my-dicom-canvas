export default class FileLoaderManager {
  // private _reservedItems = new Queue<string>();
  // private _failedItems = new Queue<string>();

  // meta data
  private _defaultCharacterSet: string;

  // Input Files
  private _inputFiles: Array<File>;
  private _fileReaders: Array<FileReader>;

  private _reservedLoadCount: number;
  private _endLoadCount: number;

  constructor() {
    this._inputFiles = [];
    this._fileReaders = [];
    this._defaultCharacterSet = "";

    this._reservedLoadCount = 0;
    this._endLoadCount = 0;
  }

  get defaultCharacterSet() {
    return this._defaultCharacterSet;
  }

  set defaultCharacterSet(charSet: string) {
    this._defaultCharacterSet = charSet;
  }

  insertInputFile(inputFiles: Array<File>) {
    for (const file of inputFiles) {
      this._inputFiles.push(file);
    }

    //this._inputFiles = inputFiles;

    this._reservedLoadCount = inputFiles.length;
    this._endLoadCount = 0;
  }

  // for Readers
  clearReaders() {
    this._fileReaders = [];
    //this._fileReaders.splice(0, this._fileReaders.length);
  }

  storeReader(reader: FileReader) {
    this._fileReaders.push(reader);
  }
}
