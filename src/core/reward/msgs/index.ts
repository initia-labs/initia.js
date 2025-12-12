import { MsgUpdateRewardParams } from './MsgUpdateRewardParams'
import { MsgFundCommunityPoolReward } from './MsgFundCommunityPoolReward'

export * from './MsgUpdateRewardParams'
export * from './MsgFundCommunityPoolReward'

export type RewardMsg = MsgUpdateRewardParams | MsgFundCommunityPoolReward
export namespace RewardMsg {
  export type Amino =
    | MsgUpdateRewardParams.Amino
    | MsgFundCommunityPoolReward.Amino
  export type Data =
    | MsgUpdateRewardParams.Data
    | MsgFundCommunityPoolReward.Data
  export type Proto =
    | MsgUpdateRewardParams.Proto
    | MsgFundCommunityPoolReward.Proto
}
