import { JSONSerializable } from '../../util/json'
import { Params as Params_pb } from '@initia/initia.proto/minievm/evm/v1/types'
import { GasEnforcement } from './GasEnforcement'

/**
 * EvmParams defines the set of evm parameters.
 */
export class EvmParams extends JSONSerializable<
  EvmParams.Amino,
  EvmParams.Data,
  EvmParams.Proto
> {
  /**
   * @param extra_eips the additional EIPs for the config
   * @param allowed_publishers list of addresses with permission to distribute contracts
   * @param allow_custom_erc20 whether the chain allows custom erc20 tokens to be registered on cosmos bank interface
   * @param allowed_custom_erc20s
   * @param fee_denom the fee denom for the evm transactions
   * @param gas_refund_ratio the gas refund ratio for the evm transactions; 0 to disable
   * @param num_retain_block_hashes the number of block hashes to retain for the evm opcode `BLOCKHASH`; minimum 256 and 0 to disable
   * @param gas_enforcement specifies the rules for enforcing gas usage on EVM transactions
   */
  constructor(
    public extra_eips: number[],
    public allowed_publishers: string[],
    public allow_custom_erc20: boolean,
    public allowed_custom_erc20s: string[],
    public fee_denom: string,
    public gas_refund_ratio: string,
    public num_retain_block_hashes: number,
    public gas_enforcement?: GasEnforcement
  ) {
    super()
  }

  public static fromAmino(data: EvmParams.Amino): EvmParams {
    const {
      extra_eips,
      allowed_publishers,
      allow_custom_erc20,
      allowed_custom_erc20s,
      fee_denom,
      gas_refund_ratio,
      num_retain_block_hashes,
      gas_enforcement,
    } = data

    return new EvmParams(
      extra_eips.map(parseInt),
      allowed_publishers ?? [],
      allow_custom_erc20,
      allowed_custom_erc20s ?? [],
      fee_denom,
      gas_refund_ratio,
      parseInt(num_retain_block_hashes),
      gas_enforcement ? GasEnforcement.fromAmino(gas_enforcement) : undefined
    )
  }

  public toAmino(): EvmParams.Amino {
    const {
      extra_eips,
      allowed_publishers,
      allow_custom_erc20,
      allowed_custom_erc20s,
      fee_denom,
      gas_refund_ratio,
      num_retain_block_hashes,
      gas_enforcement,
    } = this

    return {
      extra_eips: extra_eips.map((eip) => eip.toFixed()),
      allowed_publishers:
        allowed_publishers.length > 0 ? allowed_publishers : null,
      allow_custom_erc20,
      allowed_custom_erc20s:
        allowed_custom_erc20s.length > 0 ? allowed_custom_erc20s : null,
      fee_denom,
      gas_refund_ratio,
      num_retain_block_hashes: num_retain_block_hashes.toFixed(),
      gas_enforcement: gas_enforcement?.toAmino() ?? null,
    }
  }

  public static fromData(data: EvmParams.Data): EvmParams {
    const {
      extra_eips,
      allowed_publishers,
      allow_custom_erc20,
      allowed_custom_erc20s,
      fee_denom,
      gas_refund_ratio,
      num_retain_block_hashes,
      gas_enforcement,
    } = data

    return new EvmParams(
      extra_eips.map(parseInt),
      allowed_publishers,
      allow_custom_erc20,
      allowed_custom_erc20s,
      fee_denom,
      gas_refund_ratio,
      parseInt(num_retain_block_hashes),
      gas_enforcement ? GasEnforcement.fromData(gas_enforcement) : undefined
    )
  }

  public toData(): EvmParams.Data {
    const {
      extra_eips,
      allowed_publishers,
      allow_custom_erc20,
      allowed_custom_erc20s,
      fee_denom,
      gas_refund_ratio,
      num_retain_block_hashes,
      gas_enforcement,
    } = this

    return {
      extra_eips: extra_eips.map((eip) => eip.toFixed()),
      allowed_publishers,
      allow_custom_erc20,
      allowed_custom_erc20s,
      fee_denom,
      gas_refund_ratio,
      num_retain_block_hashes: num_retain_block_hashes.toFixed(),
      gas_enforcement: gas_enforcement?.toData() ?? null,
    }
  }

  public static fromProto(proto: EvmParams.Proto): EvmParams {
    return new EvmParams(
      proto.extraEips.map((eip) => Number(eip)),
      proto.allowedPublishers,
      proto.allowCustomErc20,
      proto.allowedCustomErc20s,
      proto.feeDenom,
      proto.gasRefundRatio,
      Number(proto.numRetainBlockHashes),
      proto.gasEnforcement
        ? GasEnforcement.fromProto(proto.gasEnforcement)
        : undefined
    )
  }

  public toProto(): EvmParams.Proto {
    const {
      extra_eips,
      allowed_publishers,
      allow_custom_erc20,
      allowed_custom_erc20s,
      fee_denom,
      gas_refund_ratio,
      num_retain_block_hashes,
      gas_enforcement,
    } = this

    return Params_pb.fromPartial({
      extraEips: extra_eips.map((eip) => BigInt(eip)),
      allowedPublishers: allowed_publishers,
      allowCustomErc20: allow_custom_erc20,
      allowedCustomErc20s: allowed_custom_erc20s,
      feeDenom: fee_denom,
      gasRefundRatio: gas_refund_ratio,
      numRetainBlockHashes: BigInt(num_retain_block_hashes),
      gasEnforcement: gas_enforcement?.toProto(),
    })
  }
}

export namespace EvmParams {
  export interface Amino {
    extra_eips: string[]
    allowed_publishers: string[] | null
    allow_custom_erc20: boolean
    allowed_custom_erc20s: string[] | null
    fee_denom: string
    gas_refund_ratio: string
    num_retain_block_hashes: string
    gas_enforcement: GasEnforcement.Amino | null
  }

  export interface Data {
    extra_eips: string[]
    allowed_publishers: string[]
    allow_custom_erc20: boolean
    allowed_custom_erc20s: string[]
    fee_denom: string
    gas_refund_ratio: string
    num_retain_block_hashes: string
    gas_enforcement: GasEnforcement.Data | null
  }

  export type Proto = Params_pb
}
