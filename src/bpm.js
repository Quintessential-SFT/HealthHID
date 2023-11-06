const bpm = {
  REPORT_ID: 0x00,
  WRITE_CHUNK_SIZE: 7,
  ID_LENGTH: 11,

  formatWriteData: (data) => {
    if (data.length > 7) {
      throw new Error("Maximum write byte length (7) exceeded!");
    }
    return new Uint8Array([data.length, ...data]);
  },

  readDataChunk: (appendData, chunk) => {
    const data = chunk.slice(1, (chunk[0] & 15) + 1);
    console.log(`Read (BPM Chunk): ${arrDecToHex(data)}`);
    appendData(data);
  },

  out: (data) => {
    console.log(data);
  },
 
  setOutputHandler: (handler) => {
    bpm.out = (data) => {
      handler(data);
    };
  },

  parseReadResponse: (data) => {
    if (data.length <= 3 || data[0] != 6) {
      hid.clearOngoingRequest();
      throw new Error("Unexpected response");
    }
    const checksum = data.slice(1, data.length - 2).reduce((acc, v) => acc + v, 0) % 256;
    const checksumHex = checksum.toString(16).padStart(2, '0').toUpperCase();
    const expectedChecksum = data.slice(-2).map(byte => String.fromCharCode(byte)).join('');
    if (checksumHex !== expectedChecksum) {
      throw new Error(`Checksum mismatch: computed ${checksumHex}, expected ${expectedChecksum}.`);
    }
    return data.slice(1, -2);
  },

  cmd: {
    getUserId: async () => {
      const reqData = bpm.formatWriteData([0x12, 0x16, 0x18, 0x24]);
      hid.sendReport(
        bpm.REPORT_ID,
        reqData,
        undefined,
        bpm.readDataChunk,
        bpm.res.getUserId,
      );
    },
  
    setUserId: async (userId, clearMemory = false) => {
      if (userId.length > bpm.ID_LENGTH) {
        throw new Error(`Max ID length (${bpm.ID_LENGTH}) exceeded!`);
      }
      if (!/^[0-9a-zA-Z]+$/.test(userId)) {
        throw new Error(`IDs can't contain non-alphanumeric chars!`);
      }
      const reqData = bpm.formatWriteData([0x12, 0x16, 0x18, 0x23]);
      hid.sendReport(
        bpm.REPORT_ID,
        reqData,
        { userId, clearMemory },
        bpm.readDataChunk,
        bpm.res.setUserId,
      );
    },

    getDeviceInfo: async () => {
  
    },

    getData: async () => {
  
    },
  
    clearData: async () => {
  
    },

    getDeviceTime: async () => {
  
    },
  
    setDeviceTime: async (date) => {
  
    },
  
    getDeviceSerial: async () => {
  
    },
  
    getDeviceStatus: async () => {
  
    },
  },

  res: {
    getUserId: async (data) => {
      data = bpm.parseReadResponse(data);
      console.log(`Read: ${arrDecToHex(data)}`);
      const decode = (data) => {
        data = data.slice(0, -8); // rm fixed str
        data = data.slice(0, 2 * bpm.ID_LENGTH);
        let id = '';
        for (let i = 0; i < data.length; i += 2) {
          let char = '';
          if (data[i] === 0x34) {
            char = String.fromCodePoint(data[i + 1] + 10);
          } else if (data[i] === 0x33) {
            char = String.fromCodePoint(data[i + 1]);
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
      const userId = decode(data);
      bpm.out(userId);
    },

    setUserId: async (data, writeData) => {
      if (data.length !== 1 || data[0] !== 6) {
        hid.clearOngoingRequest();
        throw new Error(`Invalid setUserId() response: ${data}`);
      }

      const { userId, clearMemory } = writeData;
      const CLEAR = [0x30, 0x30, 0x30, 0x30, 0xFF, 0xFF, 0xFF, 0xFF];
      const NO_CLEAR = [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF];

      const encodeId = (idStr) => {
        let idBytes = new Array(bpm.ID_LENGTH * 2).fill(0);
        const charStart = 'A'.charCodeAt(0);
        for (let i = 0; i < idStr.length * 2; i += 2) {
          const char = idStr[i / 2];
          if (/^[0-9]+$/.test(char)) {
            const digit = parseInt(char, 10);
            idBytes[i] = parseInt('0x33', 16);
            idBytes[i + 1] = parseInt(`0x${30 + digit}`, 16);
          } else {
            const charOffset = char.codePointAt(0) - charStart;
            idBytes[i] = parseInt('0x34', 16);
            idBytes[i + 1] = parseInt(`0x${30 + charOffset + 1}`, 16);
          }
        }
        return idBytes;
      };

      const encodedId = encodeId(userId);
      let arg = [...(clearMemory ? CLEAR : NO_CLEAR), ...encodedId];
      console.log('final arg: ', arg);

      // const numArg = arg.map(hex => parseInt(hex, 16));
      // const sum = numArg.reduce((acc, v) => acc + v, 0);
      // const checksum = sum % 256;
      // console.log('sum: ', checksum);
      arg = [...arg, 0x00, 0x00, 0x00, 0x00];
      // arg = [48, 48, 48, 49, 48, 48, 48, 49, 52, 50, 51, 50, 51, 53, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 49, 53]

      // let arg = new Array(32).fill(0);
      // arg[1] = 1;
      // arg[3] = 1;
      // const idStr = `${userId}`;
      // for (let i = 0; i < idStr.length; i++) {
      //   arg[i + 4] = idStr[i].charCodeAt(0);
      // }

      let hexArg = arrDecToHex(arg);
      console.log(arg)
      console.log(hexArg);
      console.log(typeof hexArg)

      // TODO: calculate checksum
      // const checksum = '';
      // hexArg = hexArg.concat(checksum);

      // TEST
      // hexArg = ['0x30', '0x30', '0x30', '0x31', '0x30', '0x30', '0x30', '0x31', '0x34', '0x32', '0x33', '0x32', '0x33', '0x35', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x30', '0x31', '0x35'];

      // hexArg = ['0xff', '0xff', '0xff', '0xff', '0xff', '0xff', '0xff', '0xff', '0x0x34', '0x0x31', '0x0x33', '0x0x32', '0x0x33', '0x0x35', '0x00', '0x00', '0x00', '0x00']
      while (!!hexArg.length) {
        const chunk = hexArg.slice(0, bpm.WRITE_CHUNK_SIZE);
        console.log('Write (BPM Chunk): ', chunk);
        await hid.device.sendReport(bpm.REPORT_ID, new Uint8Array(chunk)); // TEST
        hexArg = hexArg.slice(chunk.length);

        await new Promise(r => setTimeout(r, 50));
      }

      // bpm.out(data);
    },

    getDeviceInfo: async (data) => {
      bpm.out(data);
    },

    getData: async (data) => {
      bpm.out(data);
    },

    clearData: async (data) => {
      bpm.out(data);
    },

    getDeviceTime: async (data) => {
      bpm.out(data);
    },

    setDeviceTime: async (data) => {
      bpm.out(data);
    },

    getDeviceSerial: async (data) => {
      bpm.out(data);
    },

    getDeviceStatus: async (data) => {
      bpm.out(data);
    },
  },
};
