export type MapValueType<A> = A extends Map<any, infer V> ? V : never;

export type CmdResolve = (value: unknown) => void;
export type CmdReject = (reason?: any) => void;
