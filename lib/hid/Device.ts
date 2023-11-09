import { WriteData, ReadDataChunk, ResponseHandler, OngoingRequest } from "./types";
import { arrDecToHex, MapValueType } from "../utils";

const MAX_RETRIES = 15;
const RETRY_INTERVAL_MS = 100;

const supportedDevices = new Map([
  ['Microlife BP A6 PC', { vendorId: 0x4b4, productId: 0x5500 }],
]);

const deviceFilter = Array.from(supportedDevices.values());

export const getDeviceHumanName = (dev: MapValueType<typeof supportedDevices>) => Array.from(supportedDevices.entries())
  .find(d => d[1].vendorId === dev.vendorId && d[1].productId === dev.productId)![0];

export class Device {
  private readonly device: HIDDevice;
  private ongoingRequest?: OngoingRequest;

  private constructor(device: HIDDevice) {
    this.device = device;
    this.device.oninputreport = async (e) => {
      if (!this.ongoingRequest) return;
      clearTimeout(this.ongoingRequest.onRetryTimeout);
      if (!this.ongoingRequest.readData) {
        this.ongoingRequest.readData =[];
      }
      const data = new Uint8Array(e.data.buffer);
      try {
        console.log('Read (Chunk): ', arrDecToHex(data));
        this.ongoingRequest.isReading = true;
        clearTimeout(this.ongoingRequest.onEndTimeout);
        this.ongoingRequest.onEndTimeout = window.setTimeout(async () => {
          if (!this.ongoingRequest) return;
          this.ongoingRequest!.isReading = false;
          const data = this.ongoingRequest.readData;
          const writeData = this.ongoingRequest.writeData;
          const resHandler = this.ongoingRequest.resHandler; // TODO: retries
          this.clearOngoingRequest();
          await resHandler(this, data, writeData);
        }, 100);
        this.ongoingRequest.readDataChunk(
          (chunkData) => this.ongoingRequest!.readData = [...this.ongoingRequest!.readData, ...chunkData],
          data,
        );
      } catch {
        await this.ongoingRequest.retry();
      }
    };
    console.log(`Opened device: ${getDeviceHumanName(device)}`);
  };

  static requestDevice = async () => {
    const devices = await navigator.hid.requestDevice({ filters: deviceFilter });
    if (devices.length < 1) return;
    const device = devices[0]; // grab first interface
    await device.close();
    await device.open();
    return new Device(device);
  };

  get raw() { return this.device; }

  closeDevice = async () => {
      await this.device.close();
  };

  sendReport = async (
    reportId: number,
    data: Uint8Array,
    writeData: WriteData | undefined,
    readDataChunk: ReadDataChunk,
    resHandler: ResponseHandler,
  ) => {
    if (!this.device) {
      window.alert('No device selected...');
      return;
    }
    if (this.ongoingRequest) {
      this.clearOngoingRequest();
    }
    this.ongoingRequest = {
      isReading: false,
      retriesLeft: MAX_RETRIES,
      readDataChunk,
      readData: [],
      writeData,
      resHandler,
      retry: async () => {},
    };
    console.log(`Write: ${arrDecToHex(data)}`);
    const _sendReport = async () => {
      if (!this.ongoingRequest) return;
      if (this.ongoingRequest.retriesLeft-- > 0) {
        await this.device.sendReport(reportId, data)
          .then(() => {
            if (!this.ongoingRequest) return;
            // Timeout is shifted on response
            this.ongoingRequest.onRetryTimeout = window.setTimeout(() => {
              _sendReport();
            }, RETRY_INTERVAL_MS)
          })
          .catch((err: Error) => console.error(err));
      } else {
        this.clearOngoingRequest();
      }
    }
    this.ongoingRequest.retry = _sendReport;
    await _sendReport();
  };

  clearOngoingRequest = () => {
    if (this.ongoingRequest) {
      if (this.ongoingRequest.onRetryTimeout) {
        clearTimeout(this.ongoingRequest.onRetryTimeout);
      }
      if (this.ongoingRequest.onEndTimeout) {
        clearTimeout(this.ongoingRequest.onEndTimeout);
      }
    }
    this.ongoingRequest = undefined;
  };
}