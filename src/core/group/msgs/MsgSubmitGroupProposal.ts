import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { Msg } from '../../Msg';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import {
  MsgSubmitProposal as MsgSubmitProposal_pb,
  Exec as Exec_pb,
  execFromJSON,
  execToJSON,
} from '@initia/initia.proto/cosmos/group/v1/tx';

export class MsgSubmitGroupProposal extends JSONSerializable<
  MsgSubmitGroupProposal.Amino,
  MsgSubmitGroupProposal.Data,
  MsgSubmitGroupProposal.Proto
> {
  /**
   * @param group_policy_address the account address of group policy
   * @param proposers the account addresses of the proposers
   * @param metadata any arbitrary metadata attached to the proposal
   * @param messages list of `sdk.Msg`s that will be executed if the proposal passes
   * @param exec the mode of execution of the proposal
   * @param title the title of the proposal
   * @param summary the summary of the proposal
   */
  constructor(
    public group_policy_address: AccAddress,
    public proposers: AccAddress[],
    public metadata: string,
    public messages: Msg[],
    public exec: MsgSubmitGroupProposal.Exec,
    public title: string,
    public summary: string
  ) {
    super();
  }

  public static fromAmino(
    data: MsgSubmitGroupProposal.Amino
  ): MsgSubmitGroupProposal {
    const {
      value: {
        group_policy_address,
        proposers,
        metadata,
        messages,
        exec,
        title,
        summary,
      },
    } = data;

    return new MsgSubmitGroupProposal(
      group_policy_address,
      proposers,
      metadata,
      messages.map(Msg.fromAmino),
      execFromJSON(exec),
      title,
      summary
    );
  }

  public toAmino(): MsgSubmitGroupProposal.Amino {
    const {
      group_policy_address,
      proposers,
      metadata,
      messages,
      exec,
      title,
      summary,
    } = this;

    return {
      type: 'cosmos-sdk/group/MsgSubmitProposal',
      value: {
        group_policy_address,
        proposers,
        metadata,
        messages: messages.map(msg => msg.toAmino()),
        exec: execToJSON(exec),
        title,
        summary,
      },
    };
  }

  public static fromData(
    data: MsgSubmitGroupProposal.Data
  ): MsgSubmitGroupProposal {
    const {
      group_policy_address,
      proposers,
      metadata,
      messages,
      exec,
      title,
      summary,
    } = data;

    return new MsgSubmitGroupProposal(
      group_policy_address,
      proposers,
      metadata,
      messages.map(Msg.fromData),
      execFromJSON(exec),
      title,
      summary
    );
  }

  public toData(): MsgSubmitGroupProposal.Data {
    const {
      group_policy_address,
      proposers,
      metadata,
      messages,
      exec,
      title,
      summary,
    } = this;

    return {
      '@type': '/cosmos.group.v1.MsgSubmitProposal',
      group_policy_address,
      proposers,
      metadata,
      messages: messages.map(msg => msg.toData()),
      exec: execToJSON(exec),
      title,
      summary,
    };
  }

  public static fromProto(
    data: MsgSubmitGroupProposal.Proto
  ): MsgSubmitGroupProposal {
    return new MsgSubmitGroupProposal(
      data.groupPolicyAddress,
      data.proposers,
      data.metadata,
      data.messages.map(Msg.fromProto),
      data.exec,
      data.title,
      data.summary
    );
  }

  public toProto(): MsgSubmitGroupProposal.Proto {
    const {
      group_policy_address,
      proposers,
      metadata,
      messages,
      exec,
      title,
      summary,
    } = this;

    return MsgSubmitProposal_pb.fromPartial({
      groupPolicyAddress: group_policy_address,
      proposers,
      metadata,
      messages: messages.map(msg => msg.packAny()),
      exec,
      title,
      summary,
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.group.v1.MsgSubmitProposal',
      value: MsgSubmitProposal_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgSubmitGroupProposal {
    return MsgSubmitGroupProposal.fromProto(
      MsgSubmitProposal_pb.decode(msgAny.value)
    );
  }
}

export namespace MsgSubmitGroupProposal {
  export type Exec = Exec_pb;
  export const Exec = Exec_pb;

  export interface Amino {
    type: 'cosmos-sdk/group/MsgSubmitProposal';
    value: {
      group_policy_address: AccAddress;
      proposers: AccAddress[];
      metadata: string;
      messages: Msg.Amino[];
      exec: string;
      title: string;
      summary: string;
    };
  }

  export interface Data {
    '@type': '/cosmos.group.v1.MsgSubmitProposal';
    group_policy_address: AccAddress;
    proposers: AccAddress[];
    metadata: string;
    messages: Msg.Data[];
    exec: string;
    title: string;
    summary: string;
  }

  export type Proto = MsgSubmitProposal_pb;
}
