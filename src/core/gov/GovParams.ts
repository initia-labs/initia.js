import { JSONSerializable } from '../../util/json';
import { Coins } from '../Coins';
import { Duration } from '../Duration';
import { Params as Params_pb } from '@initia/initia.proto/initia/gov/v1/gov';

export class GovParams extends JSONSerializable<
  GovParams.Amino,
  GovParams.Data,
  GovParams.Proto
> {
  public min_deposit: Coins;
  public emergency_min_deposit: Coins;

  /**
   * @param min_deposit Minimum deposit for a proposal to enter voting period
   * @param max_deposit_period Maximum period for holders to deposit on a proposal. Initial value: 2 months
   * @param voting_period Duration of the voting period
   * @param quorum Minimum percentage of total stake needed to vote for a result to be considered valid
   * @param threshold Minimum proportion of Yes votes for proposal to pass. Default value: 0.5
   * @param veto_threshold Minimum value of Veto votes to Total votes ratio for proposal to be vetoed. Default value: 1/3
   * @param min_initial_deposit_ratio The ratio representing the proportion of the deposit value that must be paid at proposal submission
   * @param burn_vote_quorum burn deposits if a proposal does not meet quorum
   * @param burn_proposal_deposit_prevote burn deposits if the proposal does not enter voting period
   * @param burn_vote_veto burn deposits if quorum with vote type no_veto is met
   * @param emergency_min_deposit minimum deposit for a emergency proposal to enter voting period
   * @param emergency_tally_interval tally interval for emergency proposal
   */
  constructor(
    min_deposit: Coins.Input,
    public max_deposit_period: Duration,
    public voting_period: Duration,
    public quorum: string,
    public threshold: string,
    public veto_threshold: string,
    public min_initial_deposit_ratio: string,
    public burn_vote_quorum: boolean,
    public burn_proposal_deposit_prevote: boolean,
    public burn_vote_veto: boolean,
    emergency_min_deposit: Coins.Input,
    public emergency_tally_interval: Duration
  ) {
    super();
    this.min_deposit = new Coins(min_deposit);
    this.emergency_min_deposit = new Coins(emergency_min_deposit);
  }

  public static fromAmino(data: GovParams.Amino): GovParams {
    const {
      min_deposit,
      max_deposit_period,
      voting_period,
      quorum,
      threshold,
      veto_threshold,
      min_initial_deposit_ratio,
      burn_vote_quorum,
      burn_proposal_deposit_prevote,
      burn_vote_veto,
      emergency_min_deposit,
      emergency_tally_interval,
    } = data;

    return new GovParams(
      Coins.fromAmino(min_deposit),
      Duration.fromAmino(max_deposit_period),
      Duration.fromAmino(voting_period),
      quorum,
      threshold,
      veto_threshold,
      min_initial_deposit_ratio,
      burn_vote_quorum,
      burn_proposal_deposit_prevote,
      burn_vote_veto,
      Coins.fromAmino(emergency_min_deposit),
      Duration.fromAmino(emergency_tally_interval)
    );
  }

  public toAmino(): GovParams.Amino {
    const {
      min_deposit,
      max_deposit_period,
      voting_period,
      quorum,
      threshold,
      veto_threshold,
      min_initial_deposit_ratio,
      burn_vote_quorum,
      burn_proposal_deposit_prevote,
      burn_vote_veto,
      emergency_min_deposit,
      emergency_tally_interval,
    } = this;

    return {
      min_deposit: min_deposit.toAmino(),
      max_deposit_period: max_deposit_period.toAmino(),
      voting_period: voting_period.toAmino(),
      quorum,
      threshold,
      veto_threshold,
      min_initial_deposit_ratio,
      burn_vote_quorum,
      burn_proposal_deposit_prevote,
      burn_vote_veto,
      emergency_min_deposit: emergency_min_deposit.toAmino(),
      emergency_tally_interval: emergency_tally_interval.toAmino(),
    };
  }

  public static fromData(data: GovParams.Data): GovParams {
    const {
      min_deposit,
      max_deposit_period,
      voting_period,
      quorum,
      threshold,
      veto_threshold,
      min_initial_deposit_ratio,
      burn_vote_quorum,
      burn_proposal_deposit_prevote,
      burn_vote_veto,
      emergency_min_deposit,
      emergency_tally_interval,
    } = data;

    return new GovParams(
      Coins.fromData(min_deposit),
      Duration.fromData(max_deposit_period),
      Duration.fromData(voting_period),
      quorum,
      threshold,
      veto_threshold,
      min_initial_deposit_ratio,
      burn_vote_quorum,
      burn_proposal_deposit_prevote,
      burn_vote_veto,
      Coins.fromData(emergency_min_deposit),
      Duration.fromData(emergency_tally_interval)
    );
  }

  public toData(): GovParams.Data {
    const {
      min_deposit,
      max_deposit_period,
      voting_period,
      quorum,
      threshold,
      veto_threshold,
      min_initial_deposit_ratio,
      burn_vote_quorum,
      burn_proposal_deposit_prevote,
      burn_vote_veto,
      emergency_min_deposit,
      emergency_tally_interval,
    } = this;

    return {
      min_deposit: min_deposit.toData(),
      max_deposit_period: max_deposit_period.toData(),
      voting_period: voting_period.toData(),
      quorum,
      threshold,
      veto_threshold,
      min_initial_deposit_ratio,
      burn_vote_quorum,
      burn_proposal_deposit_prevote,
      burn_vote_veto,
      emergency_min_deposit: emergency_min_deposit.toData(),
      emergency_tally_interval: emergency_tally_interval.toData(),
    };
  }

  public static fromProto(data: GovParams.Proto): GovParams {
    return new GovParams(
      Coins.fromProto(data.minDeposit),
      Duration.fromProto(data.maxDepositPeriod as Duration.Proto),
      Duration.fromProto(data.votingPeriod as Duration.Proto),
      data.quorum,
      data.threshold,
      data.vetoThreshold,
      data.minInitialDepositRatio,
      data.burnVoteQuorum,
      data.burnProposalDepositPrevote,
      data.burnVoteVeto,
      Coins.fromProto(data.emergencyMinDeposit),
      Duration.fromProto(data.emergencyTallyInterval as Duration.Proto)
    );
  }

  public toProto(): GovParams.Proto {
    const {
      min_deposit,
      max_deposit_period,
      voting_period,
      quorum,
      threshold,
      veto_threshold,
      min_initial_deposit_ratio,
      burn_vote_quorum,
      burn_proposal_deposit_prevote,
      burn_vote_veto,
      emergency_min_deposit,
      emergency_tally_interval,
    } = this;

    return Params_pb.fromPartial({
      minDeposit: min_deposit.toProto(),
      maxDepositPeriod: max_deposit_period.toProto(),
      votingPeriod: voting_period.toProto(),
      quorum,
      threshold,
      vetoThreshold: veto_threshold,
      minInitialDepositRatio: min_initial_deposit_ratio,
      burnVoteQuorum: burn_vote_quorum,
      burnProposalDepositPrevote: burn_proposal_deposit_prevote,
      burnVoteVeto: burn_vote_veto,
      emergencyMinDeposit: emergency_min_deposit.toProto(),
      emergencyTallyInterval: emergency_tally_interval.toProto(),
    });
  }
}

export namespace GovParams {
  export interface Amino {
    min_deposit: Coins.Amino;
    max_deposit_period: Duration.Amino;
    voting_period: Duration.Amino;
    quorum: string;
    threshold: string;
    veto_threshold: string;
    min_initial_deposit_ratio: string;
    burn_vote_quorum: boolean;
    burn_proposal_deposit_prevote: boolean;
    burn_vote_veto: boolean;
    emergency_min_deposit: Coins.Amino;
    emergency_tally_interval: Duration.Amino;
  }

  export interface Data {
    min_deposit: Coins.Data;
    max_deposit_period: Duration.Data;
    voting_period: Duration.Data;
    quorum: string;
    threshold: string;
    veto_threshold: string;
    min_initial_deposit_ratio: string;
    burn_vote_quorum: boolean;
    burn_proposal_deposit_prevote: boolean;
    burn_vote_veto: boolean;
    emergency_min_deposit: Coins.Data;
    emergency_tally_interval: Duration.Data;
  }

  export type Proto = Params_pb;
}
