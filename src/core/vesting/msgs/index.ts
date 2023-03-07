import { MsgCreateVestingAccount } from './MsgCreateVestingAccount';

export * from './MsgCreateVestingAccount';

export type VestingMsg = MsgCreateVestingAccount;

export namespace VestingMsg {
  export type Amino = MsgCreateVestingAccount.Amino;
  export type Data = MsgCreateVestingAccount.Data;
  export type Proto = MsgCreateVestingAccount.Proto;
}
