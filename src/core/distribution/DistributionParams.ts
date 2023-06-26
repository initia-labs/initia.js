import { JSONSerializable } from '../../util/json';
import { RewardWeight } from './RewardWeight';
import { Params as Params_pb } from '@initia/initia.proto/initia/distribution/v1/distribution';

export class DistributionParams extends JSONSerializable<
  DistributionParams.Amino,
  DistributionParams.Data,
  DistributionParams.Proto
> {
  /**
   * @param community_tax
   * @param withdraw_addr_enabled
   * @param reward_weights reward allocation ratio between pools
   */
  constructor(
    public community_tax: string,
    public withdraw_addr_enabled: boolean,
    public reward_weights: RewardWeight[]
  ) {
    super();
  }

  public static fromAmino(data: DistributionParams.Amino): DistributionParams {
    const {
      value: { community_tax, withdraw_addr_enabled, reward_weights },
    } = data;
    return new DistributionParams(
      community_tax,
      withdraw_addr_enabled,
      reward_weights.map(RewardWeight.fromAmino)
    );
  }

  public toAmino(): DistributionParams.Amino {
    const { community_tax, withdraw_addr_enabled, reward_weights } = this;
    return {
      type: 'distribution/Params',
      value: {
        community_tax,
        withdraw_addr_enabled,
        reward_weights: reward_weights.map(d => d.toAmino()),
      },
    };
  }

  public static fromData(data: DistributionParams.Data): DistributionParams {
    const { community_tax, withdraw_addr_enabled, reward_weights } = data;
    return new DistributionParams(
      community_tax,
      withdraw_addr_enabled,
      reward_weights.map(RewardWeight.fromData)
    );
  }

  public toData(): DistributionParams.Data {
    const { community_tax, withdraw_addr_enabled, reward_weights } = this;
    return {
      '@type': '/initia.distribution.v1.Params',
      community_tax,
      withdraw_addr_enabled,
      reward_weights: reward_weights.map(d => d.toData()),
    };
  }

  public static fromProto(data: DistributionParams.Proto): DistributionParams {
    return new DistributionParams(
      data.communityTax,
      data.withdrawAddrEnabled,
      data.rewardWeights.map(RewardWeight.fromProto)
    );
  }

  public toProto(): DistributionParams.Proto {
    const { community_tax, withdraw_addr_enabled, reward_weights } = this;
    return Params_pb.fromPartial({
      communityTax: community_tax,
      withdrawAddrEnabled: withdraw_addr_enabled,
      rewardWeights: reward_weights.map(d => d.toProto()),
    });
  }
}

export namespace DistributionParams {
  export interface Amino {
    type: 'distribution/Params';
    value: {
      community_tax: string;
      withdraw_addr_enabled: boolean;
      reward_weights: RewardWeight.Amino[];
    };
  }

  export interface Data {
    '@type': '/initia.distribution.v1.Params';
    community_tax: string;
    withdraw_addr_enabled: boolean;
    reward_weights: RewardWeight.Data[];
  }

  export type Proto = Params_pb;
}
