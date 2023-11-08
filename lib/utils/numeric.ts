export const decToHex = (n: number) => `0x${n.toString(16).padStart(2, '0')}`;

export const hexToDec = (n: string) => parseInt(n, 16);

export const arrDecToHex = (decArray: Uint8Array | number[]) => {
  const hexData: string[] = [];
  decArray.forEach(d => hexData.push(decToHex(d)));
  return hexData;
};
