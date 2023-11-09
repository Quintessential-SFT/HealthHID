import type { Device } from "./Device";
import { CmdReject, CmdResolve } from "../utils";

export type WriteData = { [key: string]: any };

export type ReadDataChunk = (appendData: (data: Uint8Array) => void, chunk: Uint8Array) => void;

export type ResponseHandler = (dev: Device, data: number[], writeData?: WriteData) => Promise<any>;

export type OngoingRequest = {
  isReading: boolean;
  retriesLeft: number;
  readDataChunk: ReadDataChunk;
  readData: number[];
  writeData?: WriteData;
  resHandler: ResponseHandler;
  onRetryTimeout?: number;
  onEndTimeout?: number;
  retry: () => Promise<void>;
  resolve: CmdResolve,
  reject: CmdReject,
};
