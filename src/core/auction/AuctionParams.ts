import { JSONSerializable } from '../../util/json'
import { Coin } from '../Coin'
import { num } from '../num'
import { Params as Params_pb } from '@initia/initia.proto/sdk/auction/v1/genesis'

/**
 * AuctionParams defines the set of auction parameters.
 */
export class AuctionParams extends JSONSerializable<
  AuctionParams.Amino,
  AuctionParams.Data,
  AuctionParams.Proto
> {
  /**
   * @param max_bundle_size the maximum number of transactions that can be bundled in a single bundle
   * @param escrow_account_address the address of the account that will receive a portion of the bid proceeds
   * @param reserve_fee the bid floor for the auction
   * @param min_bid_increment the minimum amount that the next bid must be greater than the previous bid
   * @param front_running_protection specifies whether front running and sandwich attack protection is enabled
   * @param proposer_fee the portion of the winning bid that goes to the block proposer that proposed the block
   */
  constructor(
    public max_bundle_size: number,
    public escrow_account_address: string,
    public reserve_fee: Coin,
    public min_bid_increment: Coin,
    public front_running_protection: boolean,
    public proposer_fee: string
  ) {
    super()
  }

  public static fromAmino(data: AuctionParams.Amino): AuctionParams {
    const {
      value: {
        max_bundle_size,
        escrow_account_address,
        reserve_fee,
        min_bid_increment,
        front_running_protection,
        proposer_fee,
      },
    } = data

    return new AuctionParams(
      parseInt(max_bundle_size),
      escrow_account_address,
      Coin.fromAmino(reserve_fee),
      Coin.fromAmino(min_bid_increment),
      front_running_protection,
      proposer_fee
    )
  }

  public toAmino(): AuctionParams.Amino {
    const {
      max_bundle_size,
      escrow_account_address,
      reserve_fee,
      min_bid_increment,
      front_running_protection,
      proposer_fee,
    } = this

    return {
      type: 'block-sdk/x/auction/Params',
      value: {
        max_bundle_size: max_bundle_size.toFixed(),
        escrow_account_address,
        reserve_fee: reserve_fee.toAmino(),
        min_bid_increment: min_bid_increment.toAmino(),
        front_running_protection,
        proposer_fee: num(proposer_fee).toFixed(18),
      },
    }
  }

  public static fromData(data: AuctionParams.Data): AuctionParams {
    const {
      max_bundle_size,
      escrow_account_address,
      reserve_fee,
      min_bid_increment,
      front_running_protection,
      proposer_fee,
    } = data

    return new AuctionParams(
      parseInt(max_bundle_size),
      escrow_account_address,
      Coin.fromData(reserve_fee),
      Coin.fromData(min_bid_increment),
      front_running_protection,
      proposer_fee
    )
  }

  public toData(): AuctionParams.Data {
    const {
      max_bundle_size,
      escrow_account_address,
      reserve_fee,
      min_bid_increment,
      front_running_protection,
      proposer_fee,
    } = this

    return {
      '@type': '/sdk.auction.v1.Params',
      max_bundle_size: max_bundle_size.toFixed(),
      escrow_account_address,
      reserve_fee: reserve_fee.toData(),
      min_bid_increment: min_bid_increment.toData(),
      front_running_protection,
      proposer_fee,
    }
  }

  public static fromProto(data: AuctionParams.Proto): AuctionParams {
    return new AuctionParams(
      data.maxBundleSize,
      Buffer.from(data.escrowAccountAddress).toString('base64'),
      Coin.fromProto(data.reserveFee as Coin),
      Coin.fromProto(data.minBidIncrement as Coin),
      data.frontRunningProtection,
      num(data.proposerFee).shiftedBy(-18).toFixed()
    )
  }

  public toProto(): AuctionParams.Proto {
    const {
      max_bundle_size,
      escrow_account_address,
      reserve_fee,
      min_bid_increment,
      front_running_protection,
      proposer_fee,
    } = this

    return Params_pb.fromPartial({
      maxBundleSize: max_bundle_size,
      escrowAccountAddress: Buffer.from(escrow_account_address, 'base64'),
      reserveFee: reserve_fee.toProto(),
      minBidIncrement: min_bid_increment.toProto(),
      frontRunningProtection: front_running_protection,
      proposerFee: num(proposer_fee).shiftedBy(18).toFixed(0),
    })
  }
}

export namespace AuctionParams {
  export interface Amino {
    type: 'block-sdk/x/auction/Params'
    value: {
      max_bundle_size: string
      escrow_account_address: string
      reserve_fee: Coin.Amino
      min_bid_increment: Coin.Amino
      front_running_protection: boolean
      proposer_fee: string
    }
  }

  export interface Data {
    '@type': '/sdk.auction.v1.Params'
    max_bundle_size: string
    escrow_account_address: string
    reserve_fee: Coin.Data
    min_bid_increment: Coin.Data
    front_running_protection: boolean
    proposer_fee: string
  }

  export type Proto = Params_pb
}
