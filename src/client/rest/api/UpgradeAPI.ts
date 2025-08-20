import { BaseAPI } from './BaseAPI'
import { Plan } from '../../../core'
import { APIParams, PaginationOptions } from '../APIRequester'

export interface ModuleVersion {
  name: string
  version: number
}

export namespace ModuleVersion {
  export interface Data {
    name: string
    version: string
  }
}

export class UpgradeAPI extends BaseAPI {
  /**
   * Query a previously applied upgrade plan by its name.
   * It returns the height of the plan. If there's no plan with given name, it returns 0.
   * @param name the name of the applied plan to query for
   */
  public async appliedPlan(
    name: string,
    params: Partial<PaginationOptions & APIParams> = {},
    headers: Record<string, string> = {}
  ): Promise<number> {
    return this.c
      .get<{
        height: string
      }>(`/cosmos/upgrade/v1beta1/applied_plan/${name}`, params, headers)
      .then((d) => parseInt(d.height))
  }

  /**
   * Query the current plan.
   */
  public async currentPlan(
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<Plan | undefined> {
    return this.c
      .get<{
        plan?: Plan.Data
      }>(`/cosmos/upgrade/v1beta1/current_plan`, params, headers)
      .then((d) => (d.plan ? Plan.fromData(d.plan) : undefined))
  }

  /**
   * Query the versions of the modules.
   */
  public async moduleVersions(
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<ModuleVersion[]> {
    return this.c
      .get<{
        module_versions: ModuleVersion.Data[]
      }>(`/cosmos/upgrade/v1beta1/module_versions`, params, headers)
      .then((d) =>
        d.module_versions.map((mv) => {
          return { name: mv.name, version: parseInt(mv.version) }
        })
      )
  }
}
