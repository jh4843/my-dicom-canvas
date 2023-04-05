// import * as MyType from "@/types";
// import { arrayEquals } from "./Array";

// export const hasDicomPrefix = (buffer: ArrayBuffer): boolean => {
//   // offset: 128 byte => Header size
//   const prefixArray = new Uint8Array(buffer, 128, 4);
//   const stringReducer = function (previous, current) {
//     console.log("hasDicomPrefix: ", previous, current);
//     return (previous += String.fromCharCode(current));
//   };
//   return prefixArray.reduce(stringReducer, "") === "DICM";
// };

// export const getDataElementPrefixByteSize = (vr: string, isImplicit: boolean): number => {
//   return isImplicit ? 8 : is32bitVLVR(vr) ? 12 : 8;
// };

// export const is32bitVLVR = (vr: string): boolean => {
//   return MyType.vr32bitVL.includes(vr);
// };

// export const cleanStringfunction = (inputStr: string) => {
//   let res = inputStr;
//   if (inputStr) {
//     // trim spaces
//     res = inputStr.trim();
//     // get rid of ending zero-width space (u200B)
//     if (res[res.length - 1] === String.fromCharCode("u200B")) {
//       res = res.substring(0, res.length - 1);
//     }
//   }
//   return res;
// };

// export const getUtfLabel = (charSetTerm: string) => {
//   let label = "utf-8";
//   if (charSetTerm === "ISO_IR 100") {
//     label = "iso-8859-1";
//   } else if (charSetTerm === "ISO_IR 101") {
//     label = "iso-8859-2";
//   } else if (charSetTerm === "ISO_IR 109") {
//     label = "iso-8859-3";
//   } else if (charSetTerm === "ISO_IR 110") {
//     label = "iso-8859-4";
//   } else if (charSetTerm === "ISO_IR 144") {
//     label = "iso-8859-5";
//   } else if (charSetTerm === "ISO_IR 127") {
//     label = "iso-8859-6";
//   } else if (charSetTerm === "ISO_IR 126") {
//     label = "iso-8859-7";
//   } else if (charSetTerm === "ISO_IR 138") {
//     label = "iso-8859-8";
//   } else if (charSetTerm === "ISO_IR 148") {
//     label = "iso-8859-9";
//   } else if (charSetTerm === "ISO_IR 13") {
//     label = "shift-jis";
//   } else if (charSetTerm === "ISO_IR 166") {
//     label = "iso-8859-11";
//   } else if (charSetTerm === "ISO 2022 IR 87") {
//     label = "iso-2022-jp";
//   } else if (charSetTerm === "ISO 2022 IR 149") {
//     // not supported by TextDecoder when it says it should...
//     label = "iso-2022-kr";
//   } else if (charSetTerm === "ISO 2022 IR 58") {
//     // not supported by TextDecoder...
//     label = "iso-2022-cn";
//   } else if (charSetTerm === "ISO_IR 192") {
//     label = "utf-8";
//   } else if (charSetTerm === "GB18030") {
//     label = "gb18030";
//   } else if (charSetTerm === "GB2312") {
//     label = "gb2312";
//   } else if (charSetTerm === "GBK") {
//     label = "chinese";
//   }
//   return label;
// };

// export const getTypedArray = (bitsAllocated: number, pixelRepresentation: number, size: number) => {
//   let res = null;
//   try {
//     if (bitsAllocated === 8) {
//       if (pixelRepresentation === 0) {
//         res = new Uint8Array(size);
//       } else {
//         res = new Int8Array(size);
//       }
//     } else if (bitsAllocated === 16) {
//       if (pixelRepresentation === 0) {
//         res = new Uint16Array(size);
//       } else {
//         res = new Int16Array(size);
//       }
//     } else if (bitsAllocated === 32) {
//       if (pixelRepresentation === 0) {
//         res = new Uint32Array(size);
//       } else {
//         res = new Int32Array(size);
//       }
//     }
//   } catch (error) {
//     if (error instanceof RangeError) {
//       const powerOf2 = Math.floor(Math.log(size) / Math.log(2));
//       console.log("Cannot allocate array of size: " + size + " (>2^" + powerOf2 + ").");
//     }
//   }
//   return res;
// };

// export const getReverseOrientation = (ori: string): string | null => {
//   if (!ori) {
//     return null;
//   }
//   // reverse labels
//   const rlabels = {
//     L: "R",
//     R: "L",
//     A: "P",
//     P: "A",
//     H: "F",
//     F: "H",
//   };

//   let rori = "";
//   for (let n = 0; n < ori.length; n++) {
//     const o = ori.substring(n, n + 1);
//     const r = rlabels[o];
//     if (r) {
//       rori += r;
//     }
//   }

//   console.log("getReverseOrientation", rori);

//   // return
//   return rori;
// };

// export const getOrientationName = (orientation: Array<number>) => {
//   const axialOrientation = [1, 0, 0, 0, 1, 0];
//   const coronalOrientation = [1, 0, 0, 0, 0, -1];
//   const sagittalOrientation = [0, 1, 0, 0, 0, -1];
//   let name;
//   if (arrayEquals<number>(orientation, axialOrientation)) {
//     name = "axial";
//   } else if (arrayEquals<number>(orientation, coronalOrientation)) {
//     name = "coronal";
//   } else if (arrayEquals<number>(orientation, sagittalOrientation)) {
//     name = "sagittal";
//   }
//   return name;
// };

// //////////////////////////////////////////////////////////////////
// //#region [TransferSyntax]
// export const isImplicitTransferSyntax = (syntax: string) => {
//   return syntax === "1.2.840.10008.1.2";
// };

// export const isReadSupportedTransferSyntax = (syntax: string) => {
//   // Unsupported:
//   // "1.2.840.10008.1.2.1.99": Deflated Explicit VR - Little Endian
//   // "1.2.840.10008.1.2.4.100": MPEG2 Image Compression
//   // dwv.dicom.isJpegRetiredTransferSyntax(syntax): non supported JPEG
//   // dwv.dicom.isJpeglsTransferSyntax(syntax): JPEG-LS

//   return (
//     syntax === "1.2.840.10008.1.2" || // Implicit VR - Little Endian
//     syntax === "1.2.840.10008.1.2.1" || // Explicit VR - Little Endian
//     syntax === "1.2.840.10008.1.2.2" || // Explicit VR - Big Endian
//     isJpegBaselineTransferSyntax(syntax) || // JPEG baseline
//     isJpegLosslessTransferSyntax(syntax) || // JPEG Lossless
//     isJpeg2000TransferSyntax(syntax) || // JPEG 2000
//     isRleTransferSyntax(syntax)
//   ); // RLE
// };

// export const getTransferSyntaxFromType = (type: MyType.eTransferSyntaxType): MyType.iTrnasferSyntax => {
//   for (const transferSyntax of MyType.transferSyntaxes) {
//     if (type == transferSyntax.type) return transferSyntax;
//   }

//   return MyType.transferSyntaxes[0]; //invalid
// };

// export const getTransferSyntaxType = (syntax: string): MyType.eTransferSyntaxType => {
//   for (const transferSyntax of MyType.transferSyntaxes) {
//     if (syntax == transferSyntax.uid) return transferSyntax.type;
//   }

//   return MyType.eTransferSyntaxType.transfer_syntax_invalid;
// };

// export const getTransferSyntaxName = (syntax: string): string => {
//   for (const transferSyntax of MyType.transferSyntaxes) {
//     if (syntax == transferSyntax.uid) return transferSyntax.name;
//   }

//   return "Unknown";
// };

// //#region [TransferSyntax - JPEG]
// export const isBigEndianTransferSyntax = (syntax: string): boolean => {
//   const type = getTransferSyntaxType(syntax);
//   return type === MyType.eTransferSyntaxType.transfer_syntax_explicit_big_endian; // "1.2.840.10008.1.2.2";
// };

// export const isJpegBaselineTransferSyntax = (syntax: string) => {
//   const type = getTransferSyntaxType(syntax);
//   return (
//     type === MyType.eTransferSyntaxType.transfer_syntax_jpeg_base_proc_1 ||
//     type == MyType.eTransferSyntaxType.transfer_syntax_jpeg_base_proc_2_4
//   );
// };

// export const isJpegLosslessTransferSyntax = (syntax: string) => {
//   const type = getTransferSyntaxType(syntax);
//   return (
//     type === MyType.eTransferSyntaxType.transfer_syntax_jpeg_lossless_non_hir_14 ||
//     type == MyType.eTransferSyntaxType.transfer_syntax_jpeg_lossless_non_hir_first_order_14
//   );
// };

// // For JPEG-LS
// export const isJpeglsTransferSyntax = (syntax: string) => {
//   const type = getTransferSyntaxType(syntax);
//   return (
//     type === MyType.eTransferSyntaxType.transfer_syntax_jpeg_ls_lossless ||
//     type == MyType.eTransferSyntaxType.transfer_syntax_jpeg_ls_lossy
//   );
// };

// export const isJpeg2000TransferSyntax = (syntax: string) => {
//   const type = getTransferSyntaxType(syntax);
//   return (
//     type === MyType.eTransferSyntaxType.transfer_syntax_jpeg_2000_lossless ||
//     type == MyType.eTransferSyntaxType.transfer_syntax_jpeg_2000 ||
//     type == MyType.eTransferSyntaxType.transfer_syntax_jpeg_2000_part2_lossless ||
//     type == MyType.eTransferSyntaxType.transfer_syntax_jpeg_2000_part2 ||
//     type == MyType.eTransferSyntaxType.transfer_syntax_jpip_refer ||
//     type == MyType.eTransferSyntaxType.transfer_syntax_jpip_refer_deflate
//   );
// };

// export const isRleTransferSyntax = (syntax: string) => {
//   const type = getTransferSyntaxType(syntax);
//   return type === MyType.eTransferSyntaxType.transfer_syntax_rle_lossless;
// };

// export const isJpegRetiredTransferSyntax = (syntax: string) => {
//   for (const transferSyntax of MyType.transferSyntaxes) {
//     if (syntax == transferSyntax.uid) {
//       if (transferSyntax.isRetired == undefined || !transferSyntax.isRetired) return false;

//       return true;
//     }
//   }

//   return false;
// };
// //#endregion

// //#endregion
// //////////////////////////////////////////////////////////////////
