import { JSONSerializable } from '../../util/json'
import { AccAddress } from '../bech32'
import { Coins } from '../Coins'
import { Duration } from '../Duration'
import { Vesting } from './Vesting'
import { Params as Params_pb } from '@initia/initia.proto/initia/gov/v1/gov'

/**
 * GovParams defines the set of gov parameters.
 */
export class GovParams extends JSONSerializable<
  GovParams.Amino,
  GovParams.Data,
  GovParams.Proto
> {
  public min_deposit: Coins
  public expedited_min_deposit: Coins
  public emergency_min_deposit: Coins

  /**
   * @param min_deposit min deposit for a proposal to enter voting period
   * @param max_deposit_period max period for holders to deposit on a proposal (initial value: 2 months)
   * @param voting_period duration of the voting period
   * @param quorum min percentage of total stake needed to vote for a result to be considered valid
   * @param threshold min proportion of Yes votes for proposal to pass (default: 0.5)
   * @param veto_threshold min value of Veto votes to Total votes ratio for proposal to be vetoed (default: 1/3)
   * @param min_initial_deposit_ratio the ratio representing the proportion of the deposit value that must be paid at proposal submission
   * @param proposal_cancel_ratio the cancel ratio which will not be returned back to the depositors when a proposal is cancelled
   * @param proposal_cancel_dest the address which will receive (proposal_cancel_ratio * deposit) proposal deposits; If empty, the proposal deposits will be burned
   * @param expedited_voting_period duration of the voting period of an expedited proposal
   * @param expedited_threshold min proportion of Yes votes for proposal to pass (default: 0.67)
   * @param expedited_min_deposit min expedited deposit for a proposal to enter voting period
   * @param burn_vote_quorum burn deposits if a proposal does not meet quorum
   * @param burn_proposal_deposit_prevote burn deposits if the proposal does not enter voting period
   * @param burn_vote_veto burn deposits if quorum with vote type no_veto is met
   * @param min_deposit_ratio the proportion of the deposit value minimum that must be met when making a deposit (default: 0.01)
   * @param emergency_min_deposit min deposit for a emergency proposal to enter voting period
   * @param emergency_tally_interval tally interval for emergency proposal
   * @param low_threshold_functions low threshold functions for emergency and expedited proposal
   * @param vesting the vesting contract info for tally
   */
  constructor(
    min_deposit: Coins.Input,
    public max_deposit_period: Duration,
    public voting_period: Duration,
    public quorum: string,
    public threshold: string,
    public veto_threshold: string,
    public min_initial_deposit_ratio: string,
    public proposal_cancel_ratio: string,
    public proposal_cancel_dest: AccAddress,
    public expedited_voting_period: Duration,
    public expedited_threshold: string,
    expedited_min_deposit: Coins.Input,
    public burn_vote_quorum: boolean,
    public burn_proposal_deposit_prevote: boolean,
    public burn_vote_veto: boolean,
    public min_deposit_ratio: string,
    emergency_min_deposit: Coins.Input,
    public emergency_tally_interval: Duration,
    public low_threshold_functions: string[],
    public vesting?: Vesting
  ) {
    super()
    this.min_deposit = new Coins(min_deposit)
    this.expedited_min_deposit = new Coins(expedited_min_deposit)
    this.emergency_min_deposit = new Coins(emergency_min_deposit)
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
      proposal_cancel_ratio,
      proposal_cancel_dest,
      expedited_voting_period,
      expedited_threshold,
      expedited_min_deposit,
      burn_vote_quorum,
      burn_proposal_deposit_prevote,
      burn_vote_veto,
      min_deposit_ratio,
      emergency_min_deposit,
      emergency_tally_interval,
      low_threshold_functions,
      vesting,
    } = data

    return new GovParams(
      min_deposit ? Coins.fromAmino(min_deposit) : new Coins(),
      Duration.fromAmino(max_deposit_period),
      Duration.fromAmino(voting_period),
      quorum,
      threshold,
      veto_threshold,
      min_initial_deposit_ratio,
      proposal_cancel_ratio,
      proposal_cancel_dest,
      Duration.fromAmino(expedited_voting_period),
      expedited_threshold,
      expedited_min_deposit
        ? Coins.fromAmino(expedited_min_deposit)
        : new Coins(),
      burn_vote_quorum,
      burn_proposal_deposit_prevote,
      burn_vote_veto,
      min_deposit_ratio,
      emergency_min_deposit
        ? Coins.fromAmino(emergency_min_deposit)
        : new Coins(),
      Duration.fromAmino(emergency_tally_interval),
      low_threshold_functions,
      vesting ? Vesting.fromAmino(vesting) : undefined
    )
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
      proposal_cancel_ratio,
      proposal_cancel_dest,
      expedited_voting_period,
      expedited_threshold,
      expedited_min_deposit,
      burn_vote_quorum,
      burn_proposal_deposit_prevote,
      burn_vote_veto,
      min_deposit_ratio,
      emergency_min_deposit,
      emergency_tally_interval,
      low_threshold_functions,
      vesting,
    } = this

    return {
      min_deposit:
        min_deposit.toArray().length > 0 ? min_deposit.toAmino() : null,
      max_deposit_period: max_deposit_period.toAmino(),
      voting_period: voting_period.toAmino(),
      quorum,
      threshold,
      veto_threshold,
      min_initial_deposit_ratio,
      proposal_cancel_ratio,
      proposal_cancel_dest,
      expedited_voting_period: expedited_voting_period.toAmino(),
      expedited_threshold,
      expedited_min_deposit:
        expedited_min_deposit.toArray().length > 0
          ? expedited_min_deposit.toAmino()
          : null,
      burn_vote_quorum,
      burn_proposal_deposit_prevote,
      burn_vote_veto,
      min_deposit_ratio,
      emergency_min_deposit:
        emergency_min_deposit.toArray().length > 0
          ? emergency_min_deposit.toAmino()
          : null,
      emergency_tally_interval: emergency_tally_interval.toAmino(),
      low_threshold_functions,
      vesting: vesting?.toAmino(),
    }
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
      proposal_cancel_ratio,
      proposal_cancel_dest,
      expedited_voting_period,
      expedited_threshold,
      expedited_min_deposit,
      burn_vote_quorum,
      burn_proposal_deposit_prevote,
      burn_vote_veto,
      min_deposit_ratio,
      emergency_min_deposit,
      emergency_tally_interval,
      low_threshold_functions,
      vesting,
    } = data

    return new GovParams(
      Coins.fromData(min_deposit),
      Duration.fromData(max_deposit_period),
      Duration.fromData(voting_period),
      quorum,
      threshold,
      veto_threshold,
      min_initial_deposit_ratio,
      proposal_cancel_ratio,
      proposal_cancel_dest,
      Duration.fromData(expedited_voting_period),
      expedited_threshold,
      Coins.fromData(expedited_min_deposit),
      burn_vote_quorum,
      burn_proposal_deposit_prevote,
      burn_vote_veto,
      min_deposit_ratio,
      Coins.fromData(emergency_min_deposit),
      Duration.fromData(emergency_tally_interval),
      low_threshold_functions,
      vesting ? Vesting.fromData(vesting) : undefined
    )
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
      proposal_cancel_ratio,
      proposal_cancel_dest,
      expedited_voting_period,
      expedited_threshold,
      expedited_min_deposit,
      burn_vote_quorum,
      burn_proposal_deposit_prevote,
      burn_vote_veto,
      min_deposit_ratio,
      emergency_min_deposit,
      emergency_tally_interval,
      low_threshold_functions,
      vesting,
    } = this

    return {
      min_deposit: min_deposit.toData(),
      max_deposit_period: max_deposit_period.toData(),
      voting_period: voting_period.toData(),
      quorum,
      threshold,
      veto_threshold,
      min_initial_deposit_ratio,
      proposal_cancel_ratio,
      proposal_cancel_dest,
      expedited_voting_period: expedited_voting_period.toData(),
      expedited_threshold,
      expedited_min_deposit: expedited_min_deposit.toData(),
      burn_vote_quorum,
      burn_proposal_deposit_prevote,
      burn_vote_veto,
      min_deposit_ratio,
      emergency_min_deposit: emergency_min_deposit.toData(),
      emergency_tally_interval: emergency_tally_interval.toData(),
      low_threshold_functions,
      vesting: vesting?.toData(),
    }
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
      data.proposalCancelRatio,
      data.proposalCancelDest,
      Duration.fromProto(data.expeditedVotingPeriod as Duration.Proto),
      data.expeditedThreshold,
      Coins.fromProto(data.expeditedMinDeposit),
      data.burnVoteQuorum,
      data.burnProposalDepositPrevote,
      data.burnVoteVeto,
      data.minDepositRatio,
      Coins.fromProto(data.emergencyMinDeposit),
      Duration.fromProto(data.emergencyTallyInterval as Duration.Proto),
      data.lowThresholdFunctions,
      data.vesting ? Vesting.fromProto(data.vesting) : undefined
    )
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
      proposal_cancel_ratio,
      proposal_cancel_dest,
      expedited_voting_period,
      expedited_threshold,
      expedited_min_deposit,
      burn_vote_quorum,
      burn_proposal_deposit_prevote,
      burn_vote_veto,
      min_deposit_ratio,
      emergency_min_deposit,
      emergency_tally_interval,
      low_threshold_functions,
      vesting,
    } = this

    return Params_pb.fromPartial({
      minDeposit: min_deposit.toProto(),
      maxDepositPeriod: max_deposit_period.toProto(),
      votingPeriod: voting_period.toProto(),
      quorum,
      threshold,
      vetoThreshold: veto_threshold,
      minInitialDepositRatio: min_initial_deposit_ratio,
      proposalCancelRatio: proposal_cancel_ratio,
      proposalCancelDest: proposal_cancel_dest,
      expeditedVotingPeriod: expedited_voting_period.toProto(),
      expeditedThreshold: expedited_threshold,
      expeditedMinDeposit: expedited_min_deposit.toProto(),
      burnVoteQuorum: burn_vote_quorum,
      burnProposalDepositPrevote: burn_proposal_deposit_prevote,
      burnVoteVeto: burn_vote_veto,
      minDepositRatio: min_deposit_ratio,
      emergencyMinDeposit: emergency_min_deposit.toProto(),
      emergencyTallyInterval: emergency_tally_interval.toProto(),
      lowThresholdFunctions: low_threshold_functions,
      vesting: vesting?.toProto(),
    })
  }
}

export namespace GovParams {
  export interface Amino {
    min_deposit: Coins.Amino | null
    max_deposit_period: Duration.Amino
    voting_period: Duration.Amino
    quorum: string
    threshold: string
    veto_threshold: string
    min_initial_deposit_ratio: string
    proposal_cancel_ratio: string
    proposal_cancel_dest: AccAddress
    expedited_voting_period: Duration.Amino
    expedited_threshold: string
    expedited_min_deposit: Coins.Amino | null
    burn_vote_quorum: boolean
    burn_proposal_deposit_prevote: boolean
    burn_vote_veto: boolean
    min_deposit_ratio: string
    emergency_min_deposit: Coins.Amino | null
    emergency_tally_interval: Duration.Amino
    low_threshold_functions: string[]
    vesting?: Vesting.Amino
  }

  export interface Data {
    min_deposit: Coins.Data
    max_deposit_period: Duration.Data
    voting_period: Duration.Data
    quorum: string
    threshold: string
    veto_threshold: string
    min_initial_deposit_ratio: string
    proposal_cancel_ratio: string
    proposal_cancel_dest: AccAddress
    expedited_voting_period: Duration.Data
    expedited_threshold: string
    expedited_min_deposit: Coins.Data
    burn_vote_quorum: boolean
    burn_proposal_deposit_prevote: boolean
    burn_vote_veto: boolean
    min_deposit_ratio: string
    emergency_min_deposit: Coins.Data
    emergency_tally_interval: Duration.Data
    low_threshold_functions: string[]
    vesting?: Vesting.Data
  }

  export type Proto = Params_pb
}
