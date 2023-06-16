import { MsgUnjail } from './MsgUnjail';
import { MsgUpdateSlashingParams } from './MsgUpdateSlashingParams';

export * from './MsgUnjail';
export * from './MsgUpdateSlashingParams';

export type SlashingMsg = MsgUnjail | MsgUpdateSlashingParams;
export namespace SlashingMsg {
  export type Amino = MsgUnjail.Amino | MsgUpdateSlashingParams.Amino;
  export type Data = MsgUnjail.Data | MsgUpdateSlashingParams.Data;
  export type Proto = MsgUnjail.Proto | MsgUpdateSlashingParams.Proto;
}
