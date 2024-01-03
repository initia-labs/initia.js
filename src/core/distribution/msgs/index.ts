import { MsgSetWithdrawAddress } from './MsgSetWithdrawAddress';
import { MsgWithdrawDelegatorReward } from './MsgWithdrawDelegatorReward';
import { MsgWithdrawValidatorCommission } from './MsgWithdrawValidatorCommission';
import { MsgFundCommunityPool } from './MsgFundCommunityPool';
import { MsgUpdateDistrParams } from './MsgUpdateDistrParams';
import { MsgCommunityPoolSpend } from './MsgCommunityPoolSpend';
import { MsgDepositValidatorRewardsPool } from './MsgDepositValidatorRewardsPool';

export * from './MsgSetWithdrawAddress';
export * from './MsgWithdrawDelegatorReward';
export * from './MsgWithdrawValidatorCommission';
export * from './MsgFundCommunityPool';
export * from './MsgUpdateDistrParams';
export * from './MsgCommunityPoolSpend';
export * from './MsgDepositValidatorRewardsPool';

export type DistributionMsg =
  | MsgSetWithdrawAddress
  | MsgWithdrawDelegatorReward
  | MsgWithdrawValidatorCommission
  | MsgFundCommunityPool
  | MsgUpdateDistrParams
  | MsgCommunityPoolSpend
  | MsgDepositValidatorRewardsPool;

export namespace DistributionMsg {
  export type Amino =
    | MsgSetWithdrawAddress.Amino
    | MsgWithdrawDelegatorReward.Amino
    | MsgWithdrawValidatorCommission.Amino
    | MsgFundCommunityPool.Amino
    | MsgUpdateDistrParams.Amino
    | MsgCommunityPoolSpend.Amino
    | MsgDepositValidatorRewardsPool.Amino;

  export type Data =
    | MsgSetWithdrawAddress.Data
    | MsgWithdrawDelegatorReward.Data
    | MsgWithdrawValidatorCommission.Data
    | MsgFundCommunityPool.Data
    | MsgUpdateDistrParams.Data
    | MsgCommunityPoolSpend.Data
    | MsgDepositValidatorRewardsPool.Data;

  export type Proto =
    | MsgSetWithdrawAddress.Proto
    | MsgWithdrawDelegatorReward.Proto
    | MsgWithdrawValidatorCommission.Proto
    | MsgFundCommunityPool.Proto
    | MsgUpdateDistrParams.Proto
    | MsgCommunityPoolSpend.Proto
    | MsgDepositValidatorRewardsPool.Proto;
}
