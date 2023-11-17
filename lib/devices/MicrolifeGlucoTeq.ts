import { Device } from '../hid';
import { arrDecToHex } from "../utils";

/**
 * <p>Microlife GlucoTeq</p>
 * <p>Device Notes:</p>
 * <ul style="list-style: none;">
 *  <li> Might not start in HID mode (affects: vendorId=0x04d9, productId=0xb564)
 *  <li> After 5 minutes of inactivity, display goes blank and device stops responding (requires replug!)
 * </ul>
 * @namespace
 */
export namespace MicrolifeGlucoTeq {
  const REPORT_ID = 0x00;

  /**
   *  <p>Microlife GlucoTeq (vendorId=0x04d9, productId=0xb564) starts in UART mode.</p>
   *  <p>This checks whether device is currently in HID mode.</p>
   *  <p>Note how this check won't fail for non-responding devices! Inactive devices seem to become unresponsive after 5', requiring a replug!</p>
   *  <p>The device is actually usable while responsive (display shows "USb") and in HID mode.</p>
   */
  export const isReady = async (dev: Device) => {
    const hidEnabledFeatureReport = [1, 0, 225, 0, 0, 0, 0, 8];
    const devFeatureReport = await dev.receiveFeatureReport(REPORT_ID);
    return (JSON.stringify(Array.from(devFeatureReport)) === JSON.stringify(hidEnabledFeatureReport));
  };

  const formatWriteData = (data: number[]) => {
    return new Uint8Array([data.length, ...data]);
  };

  const readDataChunk = (appendData: (data: Uint8Array) => void, chunk: Uint8Array) => {
    const length = chunk[0];
    const data = chunk.slice(1, length + 1);
    console.log(`Read (GlucoTeq Chunk): ${arrDecToHex(data)}`);
    appendData(data);
  };

  const cmd = {
    getData: async (dev: Device) => {
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
      const expectedHeader = ['0x01', '0x47', '0x6c', '0x75', '0x63', '0x6f', '0x73', '0x65', '0x0d', '0x0a', '0x02']; // SOH Glucose CR LF STX
      const header = data.slice(0, expectedHeader.length);
      if (JSON.stringify(arrDecToHex(header)) !== JSON.stringify(expectedHeader)) {
        throw new Error('Response header malformed');
      }
      const expectedEnd = ['0x03', '0x04'];
      const end = data.slice(-2);
      if (JSON.stringify(arrDecToHex(end)) !== JSON.stringify(expectedEnd)) {
        throw new Error('Incomplete response data');
      }
      data = data.slice(header.length, -end.length);
      const strData = data.map(b => String.fromCharCode(b)).join('').split('\n');
      strData.splice(-1, 1);

      const decodeReadings = (strData: string[]) => {
        const readings: { index: number, date: string, glucose: number, type: 'Normal' | 'BeforeMeal' | 'AfterMeal' }[] = [];
        for (let i = 0; i < strData.length; i++) {
          const d = strData[i].trim().split(',');
          const [indexStr, year, month, day, hour, min, glucoseStr, _, typeStr] = d;
          const index = parseInt(indexStr, 10);
          const glucose = parseInt(glucoseStr, 10);
          let dt: Date;
          try {
            // TODO: timezone support
            dt = new Date(`${year}-${month}-${day}T${hour}:${min}`);
            if (isNaN(dt.getTime())) {
              continue; // ignore readings with invalid dates
            }
          } catch {
            continue;
          }
          const type = typeStr === '0' ? 'Normal' : typeStr === '1' ? 'BeforeMeal' : 'AfterMeal';
          readings.push({
            index,
            date: dt.toISOString(),
            glucose,
            type,
          });
        }
        return readings;
      };

      const readings = decodeReadings(strData);

      console.log('Glucose Data: ', readings);
      const formattedReadings = readings.map(r => `${r.date}: ${r.glucose} mg/dL (${r.type})`).join('\n');
      dev.strOut(formattedReadings, silent);
      return readings;
    },
  };

  export const {
    getData,
  } = cmd;
}
