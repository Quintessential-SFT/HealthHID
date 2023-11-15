import type { Device } from "./Device";
import { CmdReject, CmdResolve } from "../utils";

export type ReadDataChunk = (appendData: (data: Uint8Array) => void, chunk: Uint8Array) => void;

export type ResponseHandler = (dev: Device, data: number[], silent: boolean) => Promise<any>;

export type OngoingRequest = {
  isReading: boolean;
  retriesLeft: number;
  readDataChunk: ReadDataChunk;
  readData: number[];
  resHandler: ResponseHandler;
  onRetryTimeout?: number;
  onEndTimeout?: number;
  retry: () => Promise<void>;
  resolve: CmdResolve,
  reject: CmdReject,
  silent: boolean,
};

export type SupportedDevice =
  | 'Microlife BPM'
  // | 'Microlife GlucoTeq'
;
