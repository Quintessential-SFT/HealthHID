const bpm = {
  REPORT_ID: 0x00,
  ID_LENGTH: 11,

  formatWriteData: (data) => {
    if (data.length > 7) {
      throw new Error("Maximum write byte length (7) exceeded!");
    }
    return new Uint8Array([data.length, ...data]);
  },

  out: (data) => {
    console.log(data);
  },
 
  setOutputHandler: (handler) => {
    bpm.out = (data) => {
      handler(data);
    };
  },

  deviceResponseValidator: (data) => {
    if (data.length <= 3 || data[0] != 6) {
      throw new Error("Unexpected response");
    }
    // TODO: Validate checksum
    // cksum = sum(response[1:len(response)-2]) % 256
    //         if '%2.2X' % cksum == response[-2:].decode():
    //             return response[1:-2] # strip first byte and checksum
    //         self.prnt('checksum mismatch: computed %s, expected %s.' %
    //                   ('%2.2X' % cksum, response[-2:].decode()),
    //                   file=sys.stderr)
  },

  cmd: {
    getUserId: async () => {
      const reqData = bpm.formatWriteData([0x12, 0x16, 0x18, 0x24]);
      hid.sendReport(bpm.REPORT_ID, reqData, bpm.res.getUserId);
    },
  
    setUserId: async (userId) => {
      if (userId.length > bpm.ID_LENGTH) {
        throw new Error(`Max ID length (${bpm.ID_LENGTH}) exceeded!`);
      }
      const reqData = bpm.formatWriteData([0x12, 0x16, 0x18, 0x23]);
      hid.sendReport(bpm.REPORT_ID, reqData, bpm.res.setUserId);
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
      const bytes = data.slice(0, 2 * bpm.ID_LENGTH);
      let id = '';
      try {
        for (const i = 0; i < bytes.length; i += 2) {
          const charCode = decode_hexnum(bytes.slice(i, i + 2));
          const char = String.fromCodePoint(charCode);
          if (char < ' ' || charCode > '~' || !/^[0-9a-zA-Z]+$/.test(char)) {
            break;
          }
          id += String.fromCodePoint(char);
        }
      } catch {}
      bpm.out(id);
      // bpm.out(data);
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
