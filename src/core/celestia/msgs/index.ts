import { MsgPayForBlobs } from './MsgPayForBlobs'

export * from './MsgPayForBlobs'

export type CelestiaMsg = MsgPayForBlobs

export namespace CelestiaMsg {
  export type Data = MsgPayForBlobs.Data
  export type Proto = MsgPayForBlobs.Proto
}
