import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Coin } from '../../Coin'
import { MsgFinalizeTokenWithdrawal as MsgFinalizeTokenWithdrawal_pb } from '@initia/opinit.proto/opinit/ophost/v1/tx'
import { Any } from '@initia/initia.proto/google/protobuf/any'

/**
 * MsgFinalizeTokenWithdrawal is a message finalizing funds withdrawal from L2.
 */
export class MsgFinalizeTokenWithdrawal extends JSONSerializable<
  MsgFinalizeTokenWithdrawal.Amino,
  MsgFinalizeTokenWithdrawal.Data,
  MsgFinalizeTokenWithdrawal.Proto
> {
  /**
   * @param sender
   * @param bridge_id
   * @param output_index
   * @param withdrawal_proofs
   * @param from
   * @param to
   * @param sequence
   * @param amount
   * @param version
   * @param storage_root
   * @param last_block_hash
   */
  constructor(
    public sender: AccAddress,
    public bridge_id: number,
    public output_index: number,
    public withdrawal_proofs: string[],
    public from: AccAddress,
    public to: AccAddress,
    public sequence: number,
    public amount: Coin,
    public version: string,
    public storage_root: string,
    public last_block_hash: string
  ) {
    super()
  }

  public static fromAmino(
    data: MsgFinalizeTokenWithdrawal.Amino
  ): MsgFinalizeTokenWithdrawal {
    const {
      value: {
        sender,
        bridge_id,
        output_index,
        withdrawal_proofs,
        from,
        to,
        sequence,
        amount,
        version,
        storage_root,
        last_block_hash,
      },
    } = data

    return new MsgFinalizeTokenWithdrawal(
      sender,
      parseInt(bridge_id),
      parseInt(output_index),
      withdrawal_proofs,
      from,
      to,
      parseInt(sequence),
      Coin.fromAmino(amount),
      version,
      storage_root,
      last_block_hash
    )
  }

  public toAmino(): MsgFinalizeTokenWithdrawal.Amino {
    const {
      sender,
      bridge_id,
      output_index,
      withdrawal_proofs,
      from,
      to,
      sequence,
      amount,
      version,
      storage_root,
      last_block_hash,
    } = this

    return {
      type: 'ophost/MsgFinalizeTokenWithdrawal',
      value: {
        sender,
        bridge_id: bridge_id.toFixed(),
        output_index: output_index.toFixed(),
        withdrawal_proofs,
        from,
        to,
        sequence: sequence.toFixed(),
        amount: amount.toAmino(),
        version,
        storage_root,
        last_block_hash,
      },
    }
  }

  public static fromData(
    data: MsgFinalizeTokenWithdrawal.Data
  ): MsgFinalizeTokenWithdrawal {
    const {
      sender,
      bridge_id,
      output_index,
      withdrawal_proofs,
      from,
      to,
      sequence,
      amount,
      version,
      storage_root,
      last_block_hash,
    } = data

    return new MsgFinalizeTokenWithdrawal(
      sender,
      parseInt(bridge_id),
      parseInt(output_index),
      withdrawal_proofs,
      from,
      to,
      parseInt(sequence),
      Coin.fromData(amount),
      version,
      storage_root,
      last_block_hash
    )
  }

  public toData(): MsgFinalizeTokenWithdrawal.Data {
    const {
      sender,
      bridge_id,
      output_index,
      withdrawal_proofs,
      from,
      to,
      sequence,
      amount,
      version,
      storage_root,
      last_block_hash,
    } = this

    return {
      '@type': '/opinit.ophost.v1.MsgFinalizeTokenWithdrawal',
      sender,
      bridge_id: bridge_id.toFixed(),
      output_index: output_index.toFixed(),
      withdrawal_proofs,
      from,
      to,
      sequence: sequence.toFixed(),
      amount: amount.toData(),
      version,
      storage_root,
      last_block_hash,
    }
  }

  public static fromProto(
    data: MsgFinalizeTokenWithdrawal.Proto
  ): MsgFinalizeTokenWithdrawal {
    return new MsgFinalizeTokenWithdrawal(
      data.sender,
      Number(data.bridgeId),
      Number(data.outputIndex),
      data.withdrawalProofs.map((proof) =>
        Buffer.from(proof).toString('base64')
      ),
      data.from,
      data.to,
      Number(data.sequence),
      Coin.fromProto(data.amount as Coin),
      Buffer.from(data.version).toString('base64'),
      Buffer.from(data.storageRoot).toString('base64'),
      Buffer.from(data.lastBlockHash).toString('base64')
    )
  }

  public toProto(): MsgFinalizeTokenWithdrawal.Proto {
    const {
      sender,
      bridge_id,
      output_index,
      withdrawal_proofs,
      from,
      to,
      sequence,
      amount,
      version,
      storage_root,
      last_block_hash,
    } = this

    return MsgFinalizeTokenWithdrawal_pb.fromPartial({
      sender,
      bridgeId: BigInt(bridge_id),
      outputIndex: BigInt(output_index),
      withdrawalProofs: withdrawal_proofs.map((proof) =>
        Buffer.from(proof, 'base64')
      ),
      from,
      to,
      sequence: BigInt(sequence),
      amount: amount.toProto(),
      version: Buffer.from(version, 'base64'),
      storageRoot: Buffer.from(storage_root, 'base64'),
      lastBlockHash: Buffer.from(last_block_hash, 'base64'),
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
      sender: AccAddress
      bridge_id: string
      output_index: string
      withdrawal_proofs: string[]
      from: AccAddress
      to: AccAddress
      sequence: string
      amount: Coin.Amino
      version: string
      storage_root: string
      last_block_hash: string
    }
  }

  export interface Data {
    '@type': '/opinit.ophost.v1.MsgFinalizeTokenWithdrawal'
    sender: AccAddress
    bridge_id: string
    output_index: string
    withdrawal_proofs: string[]
    from: AccAddress
    to: AccAddress
    sequence: string
    amount: Coin.Data
    version: string
    storage_root: string
    last_block_hash: string
  }

  export type Proto = MsgFinalizeTokenWithdrawal_pb
}
