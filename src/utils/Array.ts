export const arrayEquals = <T>(arr0: T[], arr1: T[]) => {
  if (arr0 === null || arr1 === null || typeof arr0 === "undefined" || typeof arr1 === "undefined") {
    return false;
  }
  if (arr0.length !== arr1.length) {
    return false;
  }
  return arr0.every(function (element, index) {
    return element === arr1[index];
  });
};

export const uint8ArrayToString = (arr: Uint8Array): string => {
  return String.fromCharCode(...arr);
};

export const isArray = (val: any): boolean => {
  return Array.isArray(val);
};
