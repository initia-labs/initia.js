import { MsgFetchPrice } from './MsgFetchPrice';

export * from './MsgFetchPrice';

export type IbcFetchpriceMsg = MsgFetchPrice;

export namespace IbcFetchpriceMsg {
  export type Amino = MsgFetchPrice.Amino;
  export type Data = MsgFetchPrice.Data;
  export type Proto = MsgFetchPrice.Proto;
}
