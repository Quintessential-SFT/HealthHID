import { arrDecToHex } from "./utils";

const MAX_RETRIES = 15;
const RETRY_INTERVAL_MS = 100;

const supportedDevices = new Map([
  ['Microlife BP A6 PC', { vendorId: 0x4b4, productId: 0x5500 }],
]);
supportedDevices.filter = Array.from(supportedDevices.values());

export const getDeviceHumanName = (dev) => Array.from(supportedDevices.entries())
  .find(d => d[1].vendorId === dev.vendorId && d[1].productId === dev.productId)[0];

export const hid = {
  device: null,
  outputReportId: null,
  ongoingRequest: null, // onRetryTimeout, onEndTimeout, readDataChunk, resHandler, retriesLeft, readData, isReading, retry, writeData

  requestDevice: async () => {
    await hid.closeDevice();
    const devices = await navigator.hid.requestDevice({ filters: supportedDevices.filter });
    if (devices.length < 1) return;
    hid.device = devices[0]; // grab first interface
    await hid.device.open();
    hid.device.oninputreport = async (e) => {
      if (!hid.ongoingRequest) return;
      clearTimeout(hid.ongoingRequest.onRetryTimeout);
      if (!hid.ongoingRequest.readData) {
        hid.ongoingRequest.readData =[];
      }
      const data = new Uint8Array(e.data.buffer);
      try {
        console.log('Read (Chunk): ', arrDecToHex(data));
        hid.ongoingRequest.isReading = true;
        clearTimeout(hid.ongoingRequest.onEndTimeout);
        hid.ongoingRequest.onEndTimeout = setTimeout(async () => {
          hid.ongoingRequest.isReading = false;
          const data = hid.ongoingRequest.readData;
          const writeData = hid.ongoingRequest.writeData;
          const resHandler = hid.ongoingRequest.resHandler; // TODO: retries
          hid.clearOngoingRequest();
          await resHandler(data, writeData);
        }, 100);
        hid.ongoingRequest.readDataChunk(
          (chunkData) => hid.ongoingRequest.readData = [...hid.ongoingRequest.readData, ...chunkData],
          data,
        );
      } catch {
        await hid.ongoingRequest.retry();
      }
    };
    console.log(`Opened device: ${getDeviceHumanName(hid.device)}`);
  },

  closeDevice: async () => {
    if (hid.device) {
      await hid.device.close();
      hid.device = null;
    }
  },

  sendReport: async (reportId, data, writeData, readDataChunk, resHandler) => {
    if (!hid.device) {
      window.alert('No device selected...');
      return;
    }
    if (hid.ongoingRequest) {
      hid.clearOngoingRequest();
    }
    hid.ongoingRequest = {
      writeData,
      readDataChunk,
      resHandler,
      retriesLeft: MAX_RETRIES,
    };
    console.log(`Write: ${arrDecToHex(data)}`);
    const _sendReport = async () => {
      if (!hid.ongoingRequest) return;
      if (hid.ongoingRequest.retriesLeft-- > 0) {
        await hid.device.sendReport(reportId, data)
          .then(() => (
            // Timeout is shifted on response
            hid.ongoingRequest.onRetryTimeout = setTimeout(() => {
               _sendReport();
            }, RETRY_INTERVAL_MS)
          ))
          .catch(err => console.error(err));
      } else {
        hid.clearOngoingRequest();
      }
    }
    hid.ongoingRequest.retry = _sendReport;
    await _sendReport();
  },

  clearOngoingRequest: () => {
    if (hid.ongoingRequest) {
      if (hid.ongoingRequest.onRetryTimeout) {
        clearTimeout(hid.ongoingRequest.onRetryTimeout);
      }
      if (hid.ongoingRequest.onEndTimeout) {
        clearTimeout(hid.ongoingRequest.onEndTimeout);
      }
    }
    hid.ongoingRequest = null;
  },
};
