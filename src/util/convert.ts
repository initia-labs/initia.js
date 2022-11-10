import { JSONSerializable } from './json';

export namespace Convert {
  export const id = (c: any): any => c;
  export const toString = (c: any): string => c.toString();
  export const toFixed = (c: number): string => c.toFixed();
  export const toNumber = Number.parseInt;
  export const toData = (c: JSONSerializable<any, any, any>): any => c.toData();
}
