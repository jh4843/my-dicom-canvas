export const cleanString = (inputStr: string): string => {
  let res = inputStr;
  if (inputStr) {
    // trim spaces
    res = inputStr.trim();
    // get rid of ending zero-width space (u200B)
    //if (res[res.length - 1] === String.fromCharCode("u200B")) {
    if (res[res.length - 1] === String.fromCharCode(0x200b)) {
      res = res.substring(0, res.length - 1);
    }
  }
  return res;
};
