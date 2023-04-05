export const readUint16 = (data: Uint16Array, offset: number) => {
  return (data[offset] << 8) | data[offset + 1];
};

