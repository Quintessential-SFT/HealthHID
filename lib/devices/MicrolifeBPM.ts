import { Device, ResponseHandler } from '../hid';
import { arrDecToHex } from "../utils";

export namespace MicrolifeBPM {
  const REPORT_ID = 0x00;
  const WRITE_CHUNK_SIZE = 7;
  const ID_LENGTH = 11;

  const formatWriteData = (data: number[]) => {
    if (data.length > WRITE_CHUNK_SIZE) {
      throw new Error(`Maximum write byte length (${WRITE_CHUNK_SIZE}) exceeded!`);
    }
    return new Uint8Array([data.length, ...data]);
  };

  const readDataChunk = (appendData: (data: Uint8Array) => void, chunk: Uint8Array) => {
    const data = chunk.slice(1, (chunk[0] & 15) + 1);
    console.log(`Read (BPM Chunk): ${arrDecToHex(data)}`);
    appendData(data);
  };

  const parseReadResponse = (dev: Device, data: number[]) => {
    if (data.length <= 3 || data[0] != 6) {
      dev.clearOngoingRequest();
      throw new Error("Unexpected response");
    }
    const checksum = data.slice(1, data.length - 2).reduce((acc, v) => acc + v, 0) % 256;
    const checksumHex = checksum.toString(16).padStart(2, '0').toUpperCase();
    const expectedChecksum = data.slice(-2).map(byte => String.fromCharCode(byte)).join('');
    if (checksumHex !== expectedChecksum) {
      throw new Error(`Checksum mismatch: computed ${checksumHex}, expected ${expectedChecksum}.`);
    }
    return data.slice(1, -2);
  };

  const cmd = {
    getUserId: async (dev: Device, silent?: boolean) => {
      const reqData = formatWriteData([0x12, 0x16, 0x18, 0x24]);
      return new Promise(async (resolve, reject) =>
        await dev.sendReport(
          REPORT_ID,
          reqData,
          readDataChunk,
          res.getUserId,
          resolve,
          reject,
          silent,
        )
      );
    },
  
    setUserId: async (dev: Device, userId: string, clearMemory = false, silent?: boolean) => {
      if (userId.length > ID_LENGTH) {
        throw new Error(`Max ID length (${ID_LENGTH}) exceeded!`);
      }
      if (!/^[0-9a-zA-Z]+$/.test(userId)) {
        throw new Error(`IDs can't contain non-alphanumeric chars!`);
      }
      const reqData = formatWriteData([0x12, 0x16, 0x18, 0x23]);
      return new Promise(async (resolve, reject) =>
        await dev.sendReport(
          REPORT_ID,
          reqData,
          readDataChunk,
          (...args) => res.setUserId(...args, { userId, clearMemory }),
          resolve,
          reject,
          silent,
        )
      );
    },

    getDeviceInfo: async (dev: Device, silent?: boolean) => {},

    getData: async (dev: Device, silent?: boolean) => {
      const reqData = formatWriteData([0x12, 0x16, 0x18, 0x22]);
      return new Promise(async (resolve, reject) =>
        await dev.sendReport(
          REPORT_ID,
          reqData,
          readDataChunk,
          res.getData as unknown as ResponseHandler,
          resolve,
          reject,
          silent,
        )
      );
    },
  
    clearData: async (dev: Device, silent?: boolean) => {},

    getDeviceTime: async (dev: Device, silent?: boolean) => {},
  
    setDeviceTime: async (dev: Device, date: Date, silent?: boolean) => {},
  
    getDeviceSerial: async (dev: Device, silent?: boolean) => {},
  
    getDeviceStatus: async (dev: Device, silent?: boolean) => {},

    getUserSlotInfo: async (dev: Device, silent?: boolean) => {
      const reqData = formatWriteData([0x12, 0x16, 0x18, 0x28]);
      return new Promise(async (resolve, reject) =>
        await dev.sendReport(
          REPORT_ID,
          reqData,
          readDataChunk,
          res.getUserSlotInfo,
          resolve,
          reject,
          silent,
        )
      );
    },
  };

  const res = {
    getUserId: async (dev: Device, data: number[], silent: boolean) => {
      data = parseReadResponse(dev, data);
      console.log(`Read: ${arrDecToHex(data)}`);
      data = data.slice(0, -8); // rm fixed str
      data = data.slice(0, 2 * ID_LENGTH);

      const decodeId = (data: number[]) => {
        const upperCharStart = 'A'.charCodeAt(0);
        const lowerCharStart = 'a'.charCodeAt(0);
        let id = '';
        for (let i = 0; i < data.length; i += 2) {
          let char = '';
          if (data[i] === 0x33) {
            char = String.fromCodePoint(data[i + 1]);
          } else if (data[i] === 0x34) {
            const alphaOffset = parseInt(String.fromCharCode(data[i + 1]), 16) - 1;
            char = String.fromCharCode(upperCharStart + alphaOffset);
          } else if (data[i] === 0x36) {
            const alphaOffset = parseInt(String.fromCharCode(data[i + 1]), 16) - 1;
            char = String.fromCharCode(lowerCharStart + alphaOffset);
          } else {
            break;
          }
          if (char < ' ' || char > '~' || !/^[0-9a-zA-Z]+$/.test(char)) {
            continue;
          }
          id += char;
        }
        return id;
      };
      const userId = decodeId(data);
      dev.strOut(userId, silent);
      return userId;
    },

    setUserId: async (dev: Device, data: number[], silent: boolean, writeData: { userId: string, clearMemory: boolean }) => {
      if (data.length !== 1 || data[0] !== 6) {
        dev.clearOngoingRequest();
        throw new Error(`Invalid setUserId() response: ${data}`);
      }

      const { userId, clearMemory } = writeData;
      const CLEAR = [0x30, 0x30, 0x30, 0x30, 0xFF, 0xFF, 0xFF, 0xFF];
      const NO_CLEAR = [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF];

      const encodeId = (idStr: string) => {
        let idBytes: number[] = new Array(ID_LENGTH * 2).fill(0);
        const upperCharStart = 'A'.charCodeAt(0);
        const lowerCharStart = 'a'.charCodeAt(0);
        for (let i = 0; i < idStr.length * 2; i += 2) {
          const char = idStr[i / 2];
          if (/^[0-9]+$/.test(char)) {
            const digit = parseInt(char, 10);
            idBytes[i] = 0x33;
            idBytes[i + 1] = 0x30 + digit;
          } else if (/^[A-Z]+$/.test(char)) {
            const charOffset = char.codePointAt(0)! - upperCharStart;
            idBytes[i] = 0x34;
            idBytes[i + 1] = 0x30 + charOffset + 1;
          } else if (/^[a-z]+$/.test(char)) {
            const charOffset = char.codePointAt(0)! - lowerCharStart;
            idBytes[i] = 0x36;
            idBytes[i + 1] = 0x30 + charOffset + 1;
          }
        }
        return idBytes;
      };

      const encodedId = encodeId(userId);
      let arg = [...(clearMemory ? CLEAR : NO_CLEAR), ...encodedId];
      arg = [...arg, 0x00, 0x00, 0x00, 0x00];
      console.log(`Write: ${arrDecToHex(arg)}`);
      while (!!arg.length) {
        const chunk = arg.slice(0, WRITE_CHUNK_SIZE);
        console.log(`Write (Chunk): ${arrDecToHex(chunk)}`);
        await dev.raw.sendReport(REPORT_ID, formatWriteData(chunk));
        arg = arg.slice(chunk.length);
      }
    },

    getDeviceInfo: async (dev: Device, data: number[], silent: boolean) => {},

    getData: async (dev: Device, data: number[], silent: boolean) => {
      data = parseReadResponse(dev, data);
      const getCycles = (data: number[]) => {
        const digits = data.slice(0, 4);
        const cyclesStr = digits.map(digit => String.fromCharCode(digit)).join("");
        return parseInt(cyclesStr, 10);
      };
      const cycles = getCycles(data);

      const FIRST_RECORD = 32
      const RECORD_LENGTH = 32

      let readings: {
        date: string,
        systolicPressure: number,
        diastolicPressure: number,
        pulse: number,
      }[] = [];
      for (let offset = FIRST_RECORD; offset < FIRST_RECORD + cycles * RECORD_LENGTH; offset += RECORD_LENGTH) {
        const record = data.slice(offset, offset + RECORD_LENGTH);
        let dt;
        try {
          const [y3, y4, m1, m2, d1, d2, h1, h2, min1, min2] = record.slice(0, 10).map(b => String.fromCodePoint(b));
          // TODO: timezone support
          dt = new Date(`20${y3}${y4}-${m1}${m2}-${d1}${d2}T${h1}${h2}:${min1}${min2}`);
        } catch {
          continue;
        }

        const readingsData = record.slice(17, 17 + 7).map(b => String.fromCharCode(b));
        const pulse = parseInt('0x' + readingsData.slice(0, 2).join(''), 16);
        const [dia1, dia2, dia3] = [parseInt(readingsData[2], 16), parseInt(readingsData[3], 16), parseInt(readingsData[4], 16)];
        const diastolicPressure = dia1 * 64 + dia2 * 4 + dia3 / 4;
        const systolicPressure = parseInt('0x' + readingsData.slice(5, 7).join(''), 16);

        readings = readings.concat({
          date: dt.toISOString(),
          systolicPressure,
          diastolicPressure,
          pulse,
        });
      }

      console.log('Pressure Data: ', readings);
      const formattedReadings = readings.map(r => `${r.date}: sys=${r.systolicPressure}, dia=${r.diastolicPressure}, pulse=${r.pulse}`).join('\n');
      dev.strOut(formattedReadings, silent);
      return readings;
    },

    clearData: async (dev: Device, data: number[], silent: boolean) => {},

    getDeviceTime: async (dev: Device, data: number[], silent: boolean) => {},

    setDeviceTime: async (dev: Device, data: number[], silent: boolean) => {},

    getDeviceSerial: async (dev: Device, data: number[], silent: boolean) => {},

    getDeviceStatus: async (dev: Device, data: number[], silent: boolean) => {},

    getUserSlotInfo: async (dev: Device, data: number[], silent: boolean) => {
      data = parseReadResponse(dev, data);
      console.log(`Read: ${arrDecToHex(data)}`);
      const totalSlots = parseInt(String.fromCharCode(data[4]), 10);
      const currentSlot = parseInt(String.fromCharCode(data[5]), 10);
      dev.strOut(`Total User Slots: ${totalSlots}\nCurrent User Slot: ${currentSlot}`, silent);
      return { totalSlots, currentSlot };
    },
  };

  export const {
    getUserId,
    setUserId,
    // getDeviceInfo,
    getData,
    // clearData,
    // getDeviceTime,
    // setDeviceTime,
    // getDeviceSerial,
    // getDeviceStatus,
    getUserSlotInfo,
  } = cmd;
}
