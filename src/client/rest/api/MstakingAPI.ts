import {
  AccAddress,
  ValAddress,
  UnbondingDelegation,
  Coins,
  Delegation,
  Validator,
  Redelegation,
  MstakingParams,
} from '../../../core'
import { BaseAPI } from './BaseAPI'
import { APIParams, Pagination, PaginationOptions } from '../APIRequester'

export interface MstakingPool {
  /** amount of tokens are bonded, including those that are currently unbonding */
  bonded_tokens: Coins

  /** amount of tokens that are not bonded */
  not_bonded_tokens: Coins
}

export namespace MstakingPool {
  export interface Data {
    bonded_tokens: Coins.Data
    not_bonded_tokens: Coins.Data
  }
}

export class MstakingAPI extends BaseAPI {
  /**
   * Query all delegations, filtered by delegator, validator, or both.
   * At least one of the parameters must be defined.
   * @param delegator delegator's account address
   * @param validator validator's operator address
   */
  public async delegations(
    delegator?: AccAddress,
    validator?: ValAddress,
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[Delegation[], Pagination]> {
    if (delegator !== undefined && validator !== undefined) {
      return this.c
        .get<{
          delegation_response: Delegation.Data
        }>(
          `/initia/mstaking/v1/validators/${validator}/delegations/${delegator}`,
          params
        )
        .then((d) => [
          [Delegation.fromData(d.delegation_response)],
          { total: 1, next_key: '' },
        ])
    } else if (delegator !== undefined) {
      return this.c
        .get<{
          delegation_responses: Delegation.Data[]
          pagination: Pagination
        }>(`/initia/mstaking/v1/delegations/${delegator}`, params)
        .then((data) => [
          data.delegation_responses.map(Delegation.fromData),
          data.pagination,
        ])
    } else if (validator !== undefined) {
      return this.c
        .get<{
          delegation_responses: Delegation.Data[]
          pagination: Pagination
        }>(`/initia/mstaking/v1/validators/${validator}/delegations`, params)
        .then((data) => [
          data.delegation_responses.map(Delegation.fromData),
          data.pagination,
        ])
    } else {
      throw new TypeError(
        'arguments delegator and validator cannot both be empty'
      )
    }
  }

  /**
   * Query the delegation between a delegator and validator, if it exists.
   * @param delegator delegator's account address
   * @param validator validator's operator address
   */
  public async delegation(
    delegator: AccAddress,
    validator: ValAddress
  ): Promise<Delegation> {
    return this.delegations(delegator, validator).then((delgs) => delgs[0][0])
  }

  /**
   * Query all unbonding delegations, filtering by delegator, validator, or both.
   * At least one of the parameters must be defined.
   * @param delegator delegator's account address
   * @param validator validator's operator address
   */
  public async unbondingDelegations(
    delegator?: AccAddress,
    validator?: ValAddress,
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[UnbondingDelegation[], Pagination]> {
    if (delegator !== undefined && validator !== undefined) {
      return this.c
        .get<{
          unbond: UnbondingDelegation.Data
        }>(
          `/initia/mstaking/v1/validators/${validator}/delegations/${delegator}/unbonding_delegation`,
          params
        )
        .then((d) => [
          [UnbondingDelegation.fromData(d.unbond)],
          { next_key: '', total: 1 },
        ])
    } else if (delegator !== undefined) {
      return this.c
        .get<{
          unbonding_responses: UnbondingDelegation.Data[]
          pagination: Pagination
        }>(
          `/initia/mstaking/v1/delegators/${delegator}/unbonding_delegations`,
          params
        )
        .then((data) => [
          data.unbonding_responses.map(UnbondingDelegation.fromData),
          data.pagination,
        ])
    } else if (validator !== undefined) {
      return this.c
        .get<{
          unbonding_responses: UnbondingDelegation.Data[]
          pagination: Pagination
        }>(
          `/initia/mstaking/v1/validators/${validator}/unbonding_delegations`,
          params
        )
        .then((data) => [
          data.unbonding_responses.map(UnbondingDelegation.fromData),
          data.pagination,
        ])
    } else {
      throw new TypeError(
        'arguments delegator and validator cannot both be empty'
      )
    }
  }

  /**
   * Query the unbonding delegation between a delegator and validator, if it exists.
   * @param delegator delegator's account address
   * @param validator validator's operator address
   */
  public async unbondingDelegation(
    delegator?: AccAddress,
    validator?: ValAddress
  ): Promise<UnbondingDelegation> {
    return this.unbondingDelegations(delegator, validator).then(
      (udelgs) => udelgs[0][0]
    )
  }

  /**
   * Query all redelegations, filterable by delegator, source validator, and target validator.
   * @param delegator delegator's account address
   * @param src_validator_addr source validator's operator address (from)
   * @param dst_validator_addr destination validator's operator address (to)
   */
  public async redelegations(
    delegator: AccAddress,
    src_validator_addr?: ValAddress,
    dst_validator_addr?: ValAddress,
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[Redelegation[], Pagination]> {
    return this.c
      .get<{
        redelegation_responses: Redelegation.Data[]
        pagination: Pagination
      }>(`/initia/mstaking/v1/delegators/${delegator}/redelegations`, {
        ...params,
        src_validator_addr,
        dst_validator_addr,
      })
      .then((d) => [
        d.redelegation_responses.map(Redelegation.fromData),
        d.pagination,
      ])
  }

  /**
   * Query all bonded validators for a delegator given its address.
   * @param delegator delegator's account address
   */
  public async bondedValidators(
    delegator: AccAddress,
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[Validator[], Pagination]> {
    return this.c
      .get<{
        validators: Validator.Data[]
        pagination: Pagination
      }>(`/initia/mstaking/v1/delegators/${delegator}/validators`, params)
      .then((d) => [d.validators.map(Validator.fromData), d.pagination])
  }

  /**
   * Query sum of all the delegations' balance of a delegator.
   */
  public async totalDelegationBalance(
    delegator: AccAddress,
    params: APIParams = {}
  ): Promise<Coins> {
    return this.c
      .get<{
        balance: Coins.Data
      }>(
        `/initia/mstaking/v1/delegators/${delegator}/total_delegation_balance`,
        params
      )
      .then((d) => Coins.fromData(d.balance))
  }

  /**
   * Query all current registered validators, including validators that are not currently in the validating set.
   */
  public async validators(
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[Validator[], Pagination]> {
    return this.c
      .get<{
        validators: Validator.Data[]
        pagination: Pagination
      }>(`/initia/mstaking/v1/validators`, params)
      .then((d) => [d.validators.map(Validator.fromData), d.pagination])
  }

  /**
   * Query the validator information for a specific validator.
   * @param validator validator's operator address
   */
  public async validator(
    validator: ValAddress,
    params: APIParams = {}
  ): Promise<Validator> {
    return this.c
      .get<{
        validator: Validator.Data
      }>(`/initia/mstaking/v1/validators/${validator}`, params)
      .then((d) => Validator.fromData(d.validator))
  }

  /**
   * Query the current mstaking pool.
   */
  public async pool(params: APIParams = {}): Promise<MstakingPool> {
    return this.c
      .get<{ pool: MstakingPool.Data }>(`/initia/mstaking/v1/pool`, params)
      .then((d) => ({
        bonded_tokens: Coins.fromData(d.pool.bonded_tokens),
        not_bonded_tokens: Coins.fromData(d.pool.not_bonded_tokens),
      }))
  }

  /**
   * Query the parameters of the mstaking module.
   */
  public async parameters(params: APIParams = {}): Promise<MstakingParams> {
    return this.c
      .get<{
        params: MstakingParams.Data
      }>(`/initia/mstaking/v1/params`, params)
      .then((d) => MstakingParams.fromData(d.params))
  }
}
