export enum eTransferSyntaxType {
  transfer_syntax_invalid = 0,
  //
  // Byte order.
  transfer_syntax_implicit, // Default
  transfer_syntax_explicit,
  transfer_syntax_deflated_explicit_little_endian,
  transfer_syntax_explicit_big_endian,
  //
  // For JPEG
  transfer_syntax_jpeg_base_proc_1,
  transfer_syntax_jpeg_base_proc_2_4,
  transfer_syntax_jpeg_extended, // retired
  transfer_syntax_jpeg_spec_sel_non_hir_6_8, // retired
  transfer_syntax_jpeg_spec_sel_non_hir_7_9, // retired
  transfer_syntax_jpeg_full_prog_non_hir_10_12, // retired
  transfer_syntax_jpeg_full_prog_non_hir_11_13, // retired
  transfer_syntax_jpeg_lossless_non_hir_14,
  transfer_syntax_jpeg_lossless_non_hir_15, // retired
  transfer_syntax_jpeg_extended_hir_16_18, // retired
  transfer_syntax_jpeg_extended_hir_17_19, // retired
  transfer_syntax_jpeg_spec_sel_hir_20_22, // retired
  transfer_syntax_jpeg_spec_sel_hir_21_23, // retired
  transfer_syntax_jpeg_full_prog_hir_24_26, // retired
  transfer_syntax_jpeg_full_prog_hir_25_27, // retired
  transfer_syntax_jpeg_lossless_non_hir_28, // retired
  transfer_syntax_jpeg_lossless_non_hir_29, // retired
  transfer_syntax_jpeg_lossless_non_hir_first_order_14,
  transfer_syntax_jpeg_ls_lossless,
  transfer_syntax_jpeg_ls_lossy,
  transfer_syntax_jpeg_2000_lossless,
  transfer_syntax_jpeg_2000,
  transfer_syntax_jpeg_2000_part2_lossless,
  transfer_syntax_jpeg_2000_part2,
  //
  // Other compression
  transfer_syntax_jpip_refer,
  transfer_syntax_jpip_refer_deflate,
  transfer_syntax_rle_lossless,
  transfer_syntax_rfc_2557_mime,
  //
  transfer_syntax_mpeg2_main_profile,
  transfer_syntax_mpeg4_avc_high_profile,
  transfer_syntax_mpeg4_avc_bd_compatible,
}

export interface iTrnasferSyntax {
  type: eTransferSyntaxType;
  name: string;
  uid: string;
  isRetired?: boolean;
}

export const transferSyntaxes: iTrnasferSyntax[] = [
  {
    type: eTransferSyntaxType.transfer_syntax_invalid,
    name: "",
    uid: "",
    isRetired: false,
  },
  {
    type: eTransferSyntaxType.transfer_syntax_implicit,
    name: "Implicit VR Endian: Default Transfer Syntax for DICOM",
    uid: "1.2.840.10008.1.2",
    isRetired: false,
  },
  {
    type: eTransferSyntaxType.transfer_syntax_explicit,
    name: "Explicit VR Little Endian",
    uid: "1.2.840.10008.1.2.1",
    isRetired: false,
  },
  {
    type: eTransferSyntaxType.transfer_syntax_deflated_explicit_little_endian,
    name: "Deflated Explicit VR Little Endian",
    uid: "1.2.840.10008.1.2.1.99",
    isRetired: false,
  },
  {
    type: eTransferSyntaxType.transfer_syntax_explicit_big_endian,
    name: "Explicit VR Big Endian",
    uid: "1.2.840.10008.1.2.2",
    isRetired: false,
  },
  //
  {
    type: eTransferSyntaxType.transfer_syntax_jpeg_base_proc_1,
    name: "JPEG Baseline (Process 1)", // default Transfer Syntax for Lossy JPEG 8-bit Image Compression
    uid: "1.2.840.10008.1.2.4.50",
    isRetired: false,
  },
  {
    type: eTransferSyntaxType.transfer_syntax_jpeg_base_proc_2_4,
    name: "JPEG Baseline (Processes 2 & 4)", // default Transfer Syntax for Lossy JPEG 8-bit Image Compression
    uid: "1.2.840.10008.1.2.4.51",
    isRetired: false,
  },
  {
    type: eTransferSyntaxType.transfer_syntax_jpeg_extended,
    name: "JPEG Extended (Processes 3 & 5)",
    uid: "1.2.840.10008.1.2.4.52",
    isRetired: true,
  },
  {
    type: eTransferSyntaxType.transfer_syntax_jpeg_spec_sel_non_hir_6_8,
    name: "JPEG Spectral Selection, Nonhierarchical (Processes 6 & 8)",
    uid: "1.2.840.10008.1.2.4.53",
    isRetired: true,
  },
  {
    type: eTransferSyntaxType.transfer_syntax_jpeg_spec_sel_non_hir_7_9,
    name: "JPEG Spectral Selection, Nonhierarchical (Processes 7 & 9)",
    uid: "1.2.840.10008.1.2.4.54",
    isRetired: true,
  },
  {
    type: eTransferSyntaxType.transfer_syntax_jpeg_full_prog_non_hir_10_12,
    name: "JPEG Full Progression, Nonhierarchical (Processes 10 & 12)",
    uid: "1.2.840.10008.1.2.4.55",
    isRetired: true,
  },
  {
    type: eTransferSyntaxType.transfer_syntax_jpeg_full_prog_non_hir_11_13,
    name: "JPEG Full Progression, Nonhierarchical (Processes 11 & 13)",
    uid: "1.2.840.10008.1.2.4.56",
    isRetired: true,
  },
  {
    type: eTransferSyntaxType.transfer_syntax_jpeg_lossless_non_hir_14,
    name: "JPEG Lossless, Nonhierarchical (Processes 14)",
    uid: "1.2.840.10008.1.2.4.57",
    isRetired: false,
  },
  {
    type: eTransferSyntaxType.transfer_syntax_jpeg_lossless_non_hir_15,
    name: "JPEG Lossless, Nonhierarchical (Processes 15)",
    uid: "1.2.840.10008.1.2.4.58",
    isRetired: true,
  },
  {
    type: eTransferSyntaxType.transfer_syntax_jpeg_extended_hir_16_18,
    name: "JPEG Extended, Hierarchical (Processes 16 & 18)",
    uid: "1.2.840.10008.1.2.4.59",
    isRetired: true,
  },
  {
    type: eTransferSyntaxType.transfer_syntax_jpeg_extended_hir_17_19,
    name: "JPEG Extended, Hierarchical (Processes 17 & 19)",
    uid: "1.2.840.10008.1.2.4.60",
    isRetired: true,
  },
  {
    type: eTransferSyntaxType.transfer_syntax_jpeg_spec_sel_hir_20_22,
    name: "JPEG Spectral Selection, Hierarchical (Processes 20 & 22)",
    uid: "1.2.840.10008.1.2.4.61",
    isRetired: true,
  },
  {
    type: eTransferSyntaxType.transfer_syntax_jpeg_spec_sel_hir_21_23,
    name: "JPEG Spectral Selection, Hierarchical (Processes 21 & 23)",
    uid: "1.2.840.10008.1.2.4.62",
    isRetired: true,
  },
  {
    type: eTransferSyntaxType.transfer_syntax_jpeg_full_prog_hir_24_26,
    name: "JPEG Full Progression, Hierarchical (Processes 24 & 26)",
    uid: "1.2.840.10008.1.2.4.63",
    isRetired: true,
  },
  {
    type: eTransferSyntaxType.transfer_syntax_jpeg_full_prog_hir_25_27,
    name: "JPEG Full Progression, Hierarchical (Processes 25 & 27)",
    uid: "1.2.840.10008.1.2.4.64",
    isRetired: true,
  },
  {
    type: eTransferSyntaxType.transfer_syntax_jpeg_lossless_non_hir_28,
    name: "JPEG Lossless, Nonhierarchical (Process 28)",
    uid: "1.2.840.10008.1.2.4.65",
    isRetired: true,
  },
  {
    type: eTransferSyntaxType.transfer_syntax_jpeg_lossless_non_hir_29,
    name: "JPEG Lossless, Nonhierarchical (Process 29)",
    uid: "1.2.840.10008.1.2.4.66",
    isRetired: true,
  },
  {
    type: eTransferSyntaxType.transfer_syntax_jpeg_lossless_non_hir_first_order_14,
    name: "JPEG Lossless, Nonhierarchical, First- Order Prediction",
    uid: "1.2.840.10008.1.2.4.70",
    isRetired: false,
  },
  {
    type: eTransferSyntaxType.transfer_syntax_jpeg_ls_lossless,
    name: "JPEG-LS Lossless Image Compression",
    uid: "1.2.840.10008.1.2.4.80",
    isRetired: false,
  },
  {
    type: eTransferSyntaxType.transfer_syntax_jpeg_ls_lossy,
    name: "JPEG-LS Lossy (Near- Lossless) Image Compression",
    uid: "1.2.840.10008.1.2.4.81",
    isRetired: false,
  },
  {
    type: eTransferSyntaxType.transfer_syntax_jpeg_2000_lossless,
    name: "JPEG 2000 Image Compression (Lossless Only)",
    uid: "1.2.840.10008.1.2.4.90",
    isRetired: false,
  },
  {
    type: eTransferSyntaxType.transfer_syntax_jpeg_2000,
    name: "JPEG 2000 Image Compression",
    uid: "1.2.840.10008.1.2.4.91",
    isRetired: false,
  },
  {
    type: eTransferSyntaxType.transfer_syntax_jpeg_2000_part2_lossless,
    name: "JPEG 2000 Part 2 Multicomponent Image Compression (Lossless Only)",
    uid: "1.2.840.10008.1.2.4.92",
    isRetired: false,
  },
  {
    type: eTransferSyntaxType.transfer_syntax_jpeg_2000_part2,
    name: "JPEG 2000 Part 2 Multicomponent Image Compression",
    uid: "1.2.840.10008.1.2.4.93",
    isRetired: false,
  },
  //
  {
    type: eTransferSyntaxType.transfer_syntax_jpip_refer,
    name: "JPIP Referenced",
    uid: "1.2.840.10008.1.2.4.94",
    isRetired: false,
  },
  {
    type: eTransferSyntaxType.transfer_syntax_jpip_refer_deflate,
    name: "JPIP Referenced Deflate",
    uid: "1.2.840.10008.1.2.4.95",
    isRetired: false,
  },
  {
    type: eTransferSyntaxType.transfer_syntax_rle_lossless,
    name: "RLE Lossless",
    uid: "1.2.840.10008.1.2.5",
    isRetired: false,
  },
  {
    type: eTransferSyntaxType.transfer_syntax_rfc_2557_mime,
    name: "RFC 2557 MIME Encapsulation",
    uid: "1.2.840.10008.1.2.6.1",
    isRetired: false,
  },
  //
  {
    type: eTransferSyntaxType.transfer_syntax_mpeg2_main_profile,
    name: "MPEG2 Main Profile Main Level",
    uid: "1.2.840.10008.1.2.4.100",
    isRetired: false,
  },
  {
    type: eTransferSyntaxType.transfer_syntax_mpeg4_avc_high_profile,
    name: "MPEG-4 AVC/H.264 High Profile / Level 4.1",
    uid: "1.2.840.10008.1.2.4.102",
    isRetired: false,
  },
  {
    type: eTransferSyntaxType.transfer_syntax_mpeg4_avc_bd_compatible,
    name: "MPEG-4 AVC/H.264 BD-compatible High Profile / Level 4.1",
    uid: "1.2.840.10008.1.2.4.103",
    isRetired: false,
  },
];

export const getTransferSyntaxType = (_uid: string): eTransferSyntaxType => {
  for (const transferSyntax of transferSyntaxes) {
    if (_uid == transferSyntax.uid) return transferSyntax.type;
  }

  return eTransferSyntaxType.transfer_syntax_invalid;
};
