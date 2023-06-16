import { MsgSetWithdrawAddress } from './MsgSetWithdrawAddress';
import { MsgWithdrawDelegatorReward } from './MsgWithdrawDelegatorReward';
import { MsgWithdrawValidatorCommission } from './MsgWithdrawValidatorCommission';
import { MsgFundCommunityPool } from './MsgFundCommunityPool';
import { MsgUpdateDistrParams } from './MsgUpdateDistrParams';

export * from './MsgSetWithdrawAddress';
export * from './MsgWithdrawDelegatorReward';
export * from './MsgWithdrawValidatorCommission';
export * from './MsgFundCommunityPool';
export * from './MsgUpdateDistrParams';

export type DistributionMsg =
  | MsgSetWithdrawAddress
  | MsgWithdrawDelegatorReward
  | MsgWithdrawValidatorCommission
  | MsgFundCommunityPool
  | MsgUpdateDistrParams;

export namespace DistributionMsg {
  export type Amino =
    | MsgSetWithdrawAddress.Amino
    | MsgWithdrawDelegatorReward.Amino
    | MsgWithdrawValidatorCommission.Amino
    | MsgFundCommunityPool.Amino
    | MsgUpdateDistrParams.Amino;

  export type Data =
    | MsgSetWithdrawAddress.Data
    | MsgWithdrawDelegatorReward.Data
    | MsgWithdrawValidatorCommission.Data
    | MsgFundCommunityPool.Data
    | MsgUpdateDistrParams.Data;

  export type Proto =
    | MsgSetWithdrawAddress.Proto
    | MsgWithdrawDelegatorReward.Proto
    | MsgWithdrawValidatorCommission.Proto
    | MsgFundCommunityPool.Proto
    | MsgUpdateDistrParams.Proto;
}
