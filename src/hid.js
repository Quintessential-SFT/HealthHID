const MAX_RETRIES = 15;
const RETRY_INTERVAL_MS = 100;

supportedDevices = new Map([
  ['Microlife BP A6 PC', { vendorId: 0x4b4, productId: 0x5500 }],
]);
supportedDevices.filter = Array.from(supportedDevices.values());

const getDeviceHumanName = (dev) => Array.from(supportedDevices.entries())
  .find(d => d[1].vendorId === dev.vendorId && d[1].productId === dev.productId)[0];

const hid = {
  device: null,
  outputReportId: null,
  ongoingRequest: null, // timeout, resHandler, retriesLeft
  deviceResponseValidator: (data) => {},

  requestDevice: async () => {
    await hid.closeDevice();
    const devices = await navigator.hid.requestDevice({ filters: supportedDevices.filter });
    if (devices.length < 1) return;
    hid.device = devices[0]; // grab first interface
    await hid.device.open();
    hid.device.oninputreport = async (e) => {
      if (hid.ongoingRequest) {
        const data = new Uint8Array(e.data.buffer);
        try {
          // TODO: re-enable validation
          // hid.deviceResponseValidator(data);
        } catch {
          return;
        }
        const resHandler = hid.ongoingRequest.resHandler;
        hid.clearOngoingRequest();
        console.log(`Read: ${arrDecToHex(data)}`);
        // await resHandler(data);
        console.log(`Read Fake: ${arrDecToHex(fakeData)}`);
        await resHandler(fakeData);
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

  sendReport: async (reportId, data, resHandler) => {
    if (!hid.device) {
      window.alert('No device selected...');
      return;
    }
    if (hid.ongoingRequest) {
      hid.clearOngoingRequest();
    }
    hid.ongoingRequest = {
      resHandler,
      retriesLeft: MAX_RETRIES,
    };
    hid.ongoingRequest.timeout = setTimeout(() => hid._sendReport(reportId, data), RETRY_INTERVAL_MS);
    console.log(`Write: ${arrDecToHex(data)}`);
  },

  _sendReport: async (reportId, data) => {
    if (!hid.ongoingRequest) return;
    await hid.device.sendReport(reportId, data)
      .catch(err => console.error(err));
    if (--hid.ongoingRequest.retriesLeft > 0) {
      setTimeout(() => hid._sendReport(reportId, data), RETRY_INTERVAL_MS);
    }
  },

  clearOngoingRequest: () => {
    clearTimeout(hid.ongoingRequest.timeout);
    hid.ongoingRequest = null;
  },
};

const decToHex = (n) => `0x${n.toString(16).padStart(2, '0')}`;
const hexToDec = (n) => parseInt(n, 16);
const arrDecToHex = (decArray) => {
  const hexData = [];
  decArray.forEach(d => hexData.push(decToHex(d)));
  return hexData;
};
