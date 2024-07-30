import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Coin } from '../../Coin'
import { MsgFinalizeTokenWithdrawal as MsgFinalizeTokenWithdrawal_pb } from '@initia/opinit.proto/opinit/ophost/v1/tx'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import Long from 'long'

export class MsgFinalizeTokenWithdrawal extends JSONSerializable<
  MsgFinalizeTokenWithdrawal.Amino,
  MsgFinalizeTokenWithdrawal.Data,
  MsgFinalizeTokenWithdrawal.Proto
> {
  /**
   * @param bridge_id
   * @param output_index
   * @param withdrawal_proofs
   * @param sender
   * @param receiver
   * @param sequence
   * @param amount
   * @param version
   * @param state_root
   * @param storage_root
   * @param latest_block_hash
   */
  constructor(
    public bridge_id: number,
    public output_index: number,
    public withdrawal_proofs: string[],
    public sender: AccAddress,
    public receiver: AccAddress,
    public sequence: number,
    public amount: Coin,
    public version: string,
    public state_root: string,
    public storage_root: string,
    public latest_block_hash: string
  ) {
    super()
  }

  public static fromAmino(
    data: MsgFinalizeTokenWithdrawal.Amino
  ): MsgFinalizeTokenWithdrawal {
    const {
      value: {
        bridge_id,
        output_index,
        withdrawal_proofs,
        sender,
        receiver,
        sequence,
        amount,
        version,
        state_root,
        storage_root,
        latest_block_hash,
      },
    } = data

    return new MsgFinalizeTokenWithdrawal(
      Number.parseInt(bridge_id),
      Number.parseInt(output_index),
      withdrawal_proofs,
      sender,
      receiver,
      Number.parseInt(sequence),
      Coin.fromAmino(amount),
      version,
      state_root,
      storage_root,
      latest_block_hash
    )
  }

  public toAmino(): MsgFinalizeTokenWithdrawal.Amino {
    const {
      bridge_id,
      output_index,
      withdrawal_proofs,
      sender,
      receiver,
      sequence,
      amount,
      version,
      state_root,
      storage_root,
      latest_block_hash,
    } = this

    return {
      type: 'ophost/MsgFinalizeTokenWithdrawal',
      value: {
        bridge_id: bridge_id.toString(),
        output_index: output_index.toString(),
        withdrawal_proofs,
        sender,
        receiver,
        sequence: sequence.toString(),
        amount: amount.toAmino(),
        version,
        state_root,
        storage_root,
        latest_block_hash,
      },
    }
  }

  public static fromData(
    data: MsgFinalizeTokenWithdrawal.Data
  ): MsgFinalizeTokenWithdrawal {
    const {
      bridge_id,
      output_index,
      withdrawal_proofs,
      sender,
      receiver,
      sequence,
      amount,
      version,
      state_root,
      storage_root,
      latest_block_hash,
    } = data

    return new MsgFinalizeTokenWithdrawal(
      Number.parseInt(bridge_id),
      Number.parseInt(output_index),
      withdrawal_proofs,
      sender,
      receiver,
      Number.parseInt(sequence),
      Coin.fromData(amount),
      version,
      state_root,
      storage_root,
      latest_block_hash
    )
  }

  public toData(): MsgFinalizeTokenWithdrawal.Data {
    const {
      bridge_id,
      output_index,
      withdrawal_proofs,
      sender,
      receiver,
      sequence,
      amount,
      version,
      state_root,
      storage_root,
      latest_block_hash,
    } = this

    return {
      '@type': '/opinit.ophost.v1.MsgFinalizeTokenWithdrawal',
      bridge_id: bridge_id.toString(),
      output_index: output_index.toString(),
      withdrawal_proofs,
      sender,
      receiver,
      sequence: sequence.toString(),
      amount: amount.toData(),
      version,
      state_root,
      storage_root,
      latest_block_hash,
    }
  }

  public static fromProto(
    data: MsgFinalizeTokenWithdrawal.Proto
  ): MsgFinalizeTokenWithdrawal {
    return new MsgFinalizeTokenWithdrawal(
      data.bridgeId.toNumber(),
      data.outputIndex.toNumber(),
      data.withdrawalProofs.map((proof) =>
        Buffer.from(proof).toString('base64')
      ),
      data.sender,
      data.receiver,
      data.sequence.toNumber(),
      Coin.fromProto(data.amount as Coin),
      Buffer.from(data.version).toString('base64'),
      Buffer.from(data.stateRoot).toString('base64'),
      Buffer.from(data.storageRoot).toString('base64'),
      Buffer.from(data.latestBlockHash).toString('base64')
    )
  }

  public toProto(): MsgFinalizeTokenWithdrawal.Proto {
    const {
      bridge_id,
      output_index,
      withdrawal_proofs,
      sender,
      receiver,
      sequence,
      amount,
      version,
      state_root,
      storage_root,
      latest_block_hash,
    } = this

    return MsgFinalizeTokenWithdrawal_pb.fromPartial({
      bridgeId: Long.fromNumber(bridge_id),
      outputIndex: Long.fromNumber(output_index),
      withdrawalProofs: withdrawal_proofs.map((proof) =>
        Buffer.from(proof, 'base64')
      ),
      sender,
      receiver,
      sequence: Long.fromNumber(sequence),
      amount: amount.toProto(),
      version: Buffer.from(version, 'base64'),
      stateRoot: Buffer.from(state_root, 'base64'),
      storageRoot: Buffer.from(storage_root, 'base64'),
      latestBlockHash: Buffer.from(latest_block_hash, 'base64'),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.ophost.v1.MsgFinalizeTokenWithdrawal',
      value: MsgFinalizeTokenWithdrawal_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgFinalizeTokenWithdrawal {
    return MsgFinalizeTokenWithdrawal.fromProto(
      MsgFinalizeTokenWithdrawal_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgFinalizeTokenWithdrawal {
  export interface Amino {
    type: 'ophost/MsgFinalizeTokenWithdrawal'
    value: {
      bridge_id: string
      output_index: string
      withdrawal_proofs: string[]
      sender: AccAddress
      receiver: AccAddress
      sequence: string
      amount: Coin.Amino
      version: string
      state_root: string
      storage_root: string
      latest_block_hash: string
    }
  }

  export interface Data {
    '@type': '/opinit.ophost.v1.MsgFinalizeTokenWithdrawal'
    bridge_id: string
    output_index: string
    withdrawal_proofs: string[]
    sender: AccAddress
    receiver: AccAddress
    sequence: string
    amount: Coin.Data
    version: string
    state_root: string
    storage_root: string
    latest_block_hash: string
  }

  export type Proto = MsgFinalizeTokenWithdrawal_pb
}
