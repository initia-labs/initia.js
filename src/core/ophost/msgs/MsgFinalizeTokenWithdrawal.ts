import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { Coin } from '../../Coin';
import { MsgFinalizeTokenWithdrawal as MsgFinalizeTokenWithdrawal_pb } from '@initia/opinit.proto/opinit/ophost/v1/tx';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import Long from 'long';

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
    public withdrawal_proofs: Buffer[],
    public sender: AccAddress,
    public receiver: AccAddress,
    public sequence: number,
    public amount: Coin,
    public version: Buffer,
    public state_root: Buffer,
    public storage_root: Buffer,
    public latest_block_hash: Buffer
  ) {
    super();
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
    } = data;

    return new MsgFinalizeTokenWithdrawal(
      Number.parseInt(bridge_id),
      Number.parseInt(output_index),
      withdrawal_proofs.map(Buffer.from),
      sender,
      receiver,
      Number.parseInt(sequence),
      Coin.fromAmino(amount),
      Buffer.from(version),
      Buffer.from(state_root),
      Buffer.from(storage_root),
      Buffer.from(latest_block_hash)
    );
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
    } = this;

    return {
      type: 'ophost/MsgFinalizeTokenWithdrawal',
      value: {
        bridge_id: bridge_id.toString(),
        output_index: output_index.toString(),
        withdrawal_proofs: withdrawal_proofs.map(proof => proof.toJSON().data),
        sender,
        receiver,
        sequence: sequence.toString(),
        amount: amount.toAmino(),
        version: version.toJSON().data,
        state_root: state_root.toJSON().data,
        storage_root: storage_root.toJSON().data,
        latest_block_hash: latest_block_hash.toJSON().data,
      },
    };
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
    } = data;

    return new MsgFinalizeTokenWithdrawal(
      Number.parseInt(bridge_id),
      Number.parseInt(output_index),
      withdrawal_proofs.map(Buffer.from),
      sender,
      receiver,
      Number.parseInt(sequence),
      Coin.fromData(amount),
      Buffer.from(version),
      Buffer.from(state_root),
      Buffer.from(storage_root),
      Buffer.from(latest_block_hash)
    );
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
    } = this;

    return {
      '@type': '/opinit.ophost.v1.MsgFinalizeTokenWithdrawal',
      bridge_id: bridge_id.toString(),
      output_index: output_index.toString(),
      withdrawal_proofs: withdrawal_proofs.map(proof => proof.toJSON().data),
      sender,
      receiver,
      sequence: sequence.toString(),
      amount: amount.toData(),
      version: version.toJSON().data,
      state_root: state_root.toJSON().data,
      storage_root: storage_root.toJSON().data,
      latest_block_hash: latest_block_hash.toJSON().data,
    };
  }

  public static fromProto(
    data: MsgFinalizeTokenWithdrawal.Proto
  ): MsgFinalizeTokenWithdrawal {
    return new MsgFinalizeTokenWithdrawal(
      data.bridgeId.toNumber(),
      data.outputIndex.toNumber(),
      data.withdrawalProofs.map(Buffer.from),
      data.sender,
      data.receiver,
      data.sequence.toNumber(),
      Coin.fromProto(data.amount as Coin),
      Buffer.from(data.version),
      Buffer.from(data.stateRoot),
      Buffer.from(data.storageRoot),
      Buffer.from(data.latestBlockHash)
    );
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
    } = this;

    return MsgFinalizeTokenWithdrawal_pb.fromPartial({
      bridgeId: Long.fromNumber(bridge_id),
      outputIndex: Long.fromNumber(output_index),
      withdrawalProofs: withdrawal_proofs,
      sender,
      receiver,
      sequence: Long.fromNumber(sequence),
      amount: amount.toProto(),
      version,
      stateRoot: state_root,
      storageRoot: storage_root,
      latestBlockHash: latest_block_hash,
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.ophost.v1.MsgFinalizeTokenWithdrawal',
      value: MsgFinalizeTokenWithdrawal_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgFinalizeTokenWithdrawal {
    return MsgFinalizeTokenWithdrawal.fromProto(
      MsgFinalizeTokenWithdrawal_pb.decode(msgAny.value)
    );
  }
}

export namespace MsgFinalizeTokenWithdrawal {
  export interface Amino {
    type: 'ophost/MsgFinalizeTokenWithdrawal';
    value: {
      bridge_id: string;
      output_index: string;
      withdrawal_proofs: number[][];
      sender: AccAddress;
      receiver: AccAddress;
      sequence: string;
      amount: Coin.Amino;
      version: number[];
      state_root: number[];
      storage_root: number[];
      latest_block_hash: number[];
    };
  }

  export interface Data {
    '@type': '/opinit.ophost.v1.MsgFinalizeTokenWithdrawal';
    bridge_id: string;
    output_index: string;
    withdrawal_proofs: number[][];
    sender: AccAddress;
    receiver: AccAddress;
    sequence: string;
    amount: Coin.Data;
    version: number[];
    state_root: number[];
    storage_root: number[];
    latest_block_hash: number[];
  }

  export type Proto = MsgFinalizeTokenWithdrawal_pb;
}
