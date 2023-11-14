export type MapValueType<A> = A extends Map<any, infer V> ? V : never;

export type CmdResolve = (value: any) => void;
export type CmdReject = (reason?: any) => void;
