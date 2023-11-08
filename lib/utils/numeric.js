export const decToHex = (n) => `0x${n.toString(16).padStart(2, '0')}`;

export const hexToDec = (n) => parseInt(n, 16);

export const arrDecToHex = (decArray) => {
  const hexData = [];
  decArray.forEach(d => hexData.push(decToHex(d)));
  return hexData;
};
