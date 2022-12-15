import { JSONSerializable } from '../../../util/json';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { PublishStdModuleProposal as PublishStdModuleProposal_pb } from '@initia/initia.proto/initia/move//v1/proposal';

/**
 * PublishStdModuleProposal gov proposal content type to submit MOVE code to the system
 */
export class PublishStdModuleProposal extends JSONSerializable<
  PublishStdModuleProposal.Amino,
  PublishStdModuleProposal.Data,
  PublishStdModuleProposal.Proto
> {
  /**
   * @param title a short summary
   * @param description a human readable text
   * @param code_bytes can be raw or gzip compressed
   */
  constructor(
    public title: string,
    public description: string,
    public code_bytes: string
  ) {
    super();
  }

  public static fromAmino(
    data: PublishStdModuleProposal.Amino
  ): PublishStdModuleProposal {
    const {
      value: { title, description, code_bytes },
    } = data;
    return new PublishStdModuleProposal(title, description, code_bytes);
  }

  public toAmino(): PublishStdModuleProposal.Amino {
    const { title, description, code_bytes } = this;
    return {
      type: 'move/PublishStdModuleProposal',
      value: {
        title,
        description,
        code_bytes,
      },
    };
  }

  public static fromData(
    data: PublishStdModuleProposal.Data
  ): PublishStdModuleProposal {
    const { title, description, code_bytes } = data;
    return new PublishStdModuleProposal(title, description, code_bytes);
  }

  public toData(): PublishStdModuleProposal.Data {
    const { title, description, code_bytes } = this;
    return {
      '@type': '/initia.move.v1.PublishStdModuleProposal',
      title,
      description,
      code_bytes,
    };
  }

  public static fromProto(
    proto: PublishStdModuleProposal.Proto
  ): PublishStdModuleProposal {
    return new PublishStdModuleProposal(
      proto.title,
      proto.description,
      Buffer.from(proto.codeBytes).toString('base64')
    );
  }

  public toProto(): PublishStdModuleProposal.Proto {
    const { title, description, code_bytes } = this;
    return PublishStdModuleProposal_pb.fromPartial({
      title,
      description,
      codeBytes: Buffer.from(code_bytes, 'base64'),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.move.v1.PublishStdModuleProposal',
      value: PublishStdModuleProposal_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): PublishStdModuleProposal {
    return PublishStdModuleProposal.fromProto(
      PublishStdModuleProposal_pb.decode(msgAny.value)
    );
  }
}

export namespace PublishStdModuleProposal {
  export interface Amino {
    type: 'move/PublishStdModuleProposal';
    value: {
      title: string;
      description: string;
      code_bytes: string;
    };
  }

  export interface Data {
    '@type': '/initia.move.v1.PublishStdModuleProposal';
    title: string;
    description: string;
    code_bytes: string;
  }

  export type Proto = PublishStdModuleProposal_pb;
}
