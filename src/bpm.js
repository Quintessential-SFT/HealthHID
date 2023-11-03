const bpm = {
  REPORT_ID: 0x00,
  ID_LENGTH: 11,

  formatWriteData: (data) => {
    if (data.length > 7) {
      throw new Error("Maximum write byte length (7) exceeded!");
    }
    return new Uint8Array([data.length, ...data]);
  },

  readDataChunk: (appendData, chunk, onInput) => {
    onInput();
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

  parseResponse: (data) => {
    if (data.length <= 3 || data[0] != 6) {
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
        bpm.readDataChunk,
        bpm.res.getUserId,
      );
    },
  
    setUserId: async (userId) => {
      if (userId.length > bpm.ID_LENGTH) {
        throw new Error(`Max ID length (${bpm.ID_LENGTH}) exceeded!`);
      }
      const reqData = bpm.formatWriteData([0x12, 0x16, 0x18, 0x23]);
      hid.sendReport(
        bpm.REPORT_ID,
        reqData,
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

    setUserId: async (data) => {
      bpm.out(data);
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
