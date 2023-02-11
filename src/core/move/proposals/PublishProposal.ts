import { JSONSerializable } from '../../../util/json';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { PublishProposal as PublishProposal_pb } from '@initia/initia.proto/initia/move//v1/proposal';

/**
 * PublishProposal gov proposal content type to submit MOVE code to the system
 */
export class PublishProposal extends JSONSerializable<
  PublishProposal.Amino,
  PublishProposal.Data,
  PublishProposal.Proto
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
    data: PublishProposal.Amino
  ): PublishProposal {
    const {
      value: { title, description, code_bytes },
    } = data;
    return new PublishProposal(title, description, code_bytes);
  }

  public toAmino(): PublishProposal.Amino {
    const { title, description, code_bytes } = this;
    return {
      type: 'move/PublishProposal',
      value: {
        title,
        description,
        code_bytes,
      },
    };
  }

  public static fromData(
    data: PublishProposal.Data
  ): PublishProposal {
    const { title, description, code_bytes } = data;
    return new PublishProposal(title, description, code_bytes);
  }

  public toData(): PublishProposal.Data {
    const { title, description, code_bytes } = this;
    return {
      '@type': '/initia.move.v1.PublishProposal',
      title,
      description,
      code_bytes,
    };
  }

  public static fromProto(
    proto: PublishProposal.Proto
  ): PublishProposal {
    return new PublishProposal(
      proto.title,
      proto.description,
      Buffer.from(proto.codeBytes).toString('base64')
    );
  }

  public toProto(): PublishProposal.Proto {
    const { title, description, code_bytes } = this;
    return PublishProposal_pb.fromPartial({
      title,
      description,
      codeBytes: Buffer.from(code_bytes, 'base64'),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.move.v1.PublishProposal',
      value: PublishProposal_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): PublishProposal {
    return PublishProposal.fromProto(
      PublishProposal_pb.decode(msgAny.value)
    );
  }
}

export namespace PublishProposal {
  export interface Amino {
    type: 'move/PublishProposal';
    value: {
      title: string;
      description: string;
      code_bytes: string;
    };
  }

  export interface Data {
    '@type': '/initia.move.v1.PublishProposal';
    title: string;
    description: string;
    code_bytes: string;
  }

  export type Proto = PublishProposal_pb;
}
