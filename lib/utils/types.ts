export type MapValueType<A> = A extends Map<any, infer V> ? V : never;
