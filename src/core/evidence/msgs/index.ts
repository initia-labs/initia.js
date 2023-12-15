import { MsgSubmitEvidence } from './MsgSubmitEvidence';

export * from './MsgSubmitEvidence';

export type EvidenceMsg = MsgSubmitEvidence;

export namespace EvidenceMsg {
  export type Amino = MsgSubmitEvidence.Amino;
  export type Data = MsgSubmitEvidence.Data;
  export type Proto = MsgSubmitEvidence.Proto;
}
