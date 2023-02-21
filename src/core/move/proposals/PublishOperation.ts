import { JSONSerializable } from '../../../util/json';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { PublishOperation as PublishOperation_pb } from '@initia/initia.proto/initia/move//v1/proposal';

/**
 * PublishOperation gov proposal operation type to submit stdlib module to the system
 */
export class PublishOperation extends JSONSerializable<
  PublishOperation.Amino,
  PublishOperation.Data,
  PublishOperation.Proto
> {
  /**
   * @param code_bytes raw move module bytes code
   */
  constructor(
    public code_bytes: string
  ) {
    super();
  }

  public static fromAmino(
    data: PublishOperation.Amino
  ): PublishOperation {
    return new PublishOperation(data.value.code_bytes);
  }

  public toAmino(): PublishOperation.Amino {
    const { code_bytes } = this;
    return {
      type: 'move/PublishOperation',
      value: { code_bytes },
    };
  }

  public static fromData(
    data: PublishOperation.Data
  ): PublishOperation {
    return new PublishOperation(data.code_bytes);
  }

  public toData(): PublishOperation.Data {
    const { code_bytes } = this;
    return {
      '@type': '/initia.move.v1.PublishOperation',
      code_bytes,
    };
  }

  public static fromProto(
    proto: PublishOperation.Proto
  ): PublishOperation {
    return new PublishOperation(
      Buffer.from(proto.codeBytes).toString('base64')
    );
  }

  public toProto(): PublishOperation.Proto {
    const { code_bytes } = this;
    return PublishOperation_pb.fromPartial({
      codeBytes: Buffer.from(code_bytes, 'base64'),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.move.v1.PublishOperation',
      value: PublishOperation_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): PublishOperation {
    return PublishOperation.fromProto(
      PublishOperation_pb.decode(msgAny.value)
    );
  }
}

export namespace PublishOperation {
  export interface Amino {
    type: 'move/PublishOperation';
    value: {
      code_bytes: string;
    };
  }

  export interface Data {
    '@type': '/initia.move.v1.PublishOperation';
    code_bytes: string;
  }

  export type Proto = PublishOperation_pb;
}
