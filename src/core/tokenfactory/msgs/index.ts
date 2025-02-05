import { MsgCreateDenom } from './MsgCreateDenom'
import { MsgMint } from './MsgMint'
import { MsgBurn } from './MsgBurn'
import { MsgChangeAdmin } from './MsgChangeAdmin'
import { MsgSetDenomMetadataWasm } from './MsgSetDenomMetadataWasm'
import { MsgSetBeforeSendHook } from './MsgSetBeforeSendHook'
import { MsgUpdateTokenfactoryParams } from './MsgUpdateTokenfactoryParams'

export * from './MsgCreateDenom'
export * from './MsgMint'
export * from './MsgBurn'
export * from './MsgChangeAdmin'
export * from './MsgSetDenomMetadataWasm'
export * from './MsgSetBeforeSendHook'
export * from './MsgUpdateTokenfactoryParams'

export type TokenfactoryMsg =
  | MsgCreateDenom
  | MsgMint
  | MsgBurn
  | MsgChangeAdmin
  | MsgSetDenomMetadataWasm
  | MsgSetBeforeSendHook
  | MsgUpdateTokenfactoryParams

export namespace TokenfactoryMsg {
  export type Amino =
    | MsgCreateDenom.Amino
    | MsgMint.Amino
    | MsgBurn.Amino
    | MsgChangeAdmin.Amino
    | MsgSetDenomMetadataWasm.Amino
    | MsgSetBeforeSendHook.Amino
    | MsgUpdateTokenfactoryParams.Amino

  export type Data =
    | MsgCreateDenom.Data
    | MsgMint.Data
    | MsgBurn.Data
    | MsgChangeAdmin.Data
    | MsgSetDenomMetadataWasm.Data
    | MsgSetBeforeSendHook.Data
    | MsgUpdateTokenfactoryParams.Data

  export type Proto =
    | MsgCreateDenom.Proto
    | MsgMint.Proto
    | MsgBurn.Proto
    | MsgChangeAdmin.Proto
    | MsgSetDenomMetadataWasm.Proto
    | MsgSetBeforeSendHook.Proto
    | MsgUpdateTokenfactoryParams.Proto
}
