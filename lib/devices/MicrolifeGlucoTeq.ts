import { Device } from '../hid';

export namespace MicrolifeGlucoTeq {
  const REPORT_ID = 0x00;

  const formatWriteData = (data: number[]) => {
    // TODO
    return new Uint8Array([data.length, ...data]);
  };

  const readDataChunk = (appendData: (data: Uint8Array) => void, chunk: Uint8Array) => {
    // TODO
    console.log(chunk);
  };

  const cmd = {
    getData: async (dev: Device) => {
      // TODO
      const reqData = formatWriteData([0x05]);
      return new Promise(async (resolve, reject) =>
        await dev.sendReport(
          REPORT_ID,
          reqData,
          readDataChunk,
          res.getData,
          resolve,
          reject,
        )
      );
    },
  };

  const res = {
    getData: async (dev: Device, data: number[], silent: boolean) => {
      // TODO
      dev.strOut("Dummy Data");
    },
  };

  export const {
    getData
  } = cmd;
}
