import { JSONSerializable } from '../../../util/json';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { ExecuteOperation } from './ExecuteOperation';
import { PublishOperation } from './PublishOperation';
import { OperationsProposal as OperationsProposal_pb } from '@initia/initia.proto/initia/move//v1/proposal';

/**
 * OperationsProposal proposal which supports submitting arbitrary move operations
 */
export class OperationsProposal extends JSONSerializable<
  OperationsProposal.Amino,
  OperationsProposal.Data,
  OperationsProposal.Proto
> {
  /**
   * @param title a short summary
   * @param description a human readable text
   * @param operations arbitrary move operations
   */
  constructor(
    public title: string,
    public description: string,
    public operations: OperationsProposal.Operation[],
  ) {
    super();
  }

  public static fromAmino(
    data: OperationsProposal.Amino
  ): OperationsProposal {
    const {
      value: { title, description, operations },
    } = data;
    return new OperationsProposal(
      title, 
      description, 
      operations.map((op) => OperationsProposal.Operation.fromAmino(op.operation))
    );
  }

  public toAmino(): OperationsProposal.Amino {
    const { title, description, operations } = this;
    return {
      type: 'move/OperationsProposal',
      value: {
        title,
        description,
        operations: operations.map((op) => ({ operation: op.toAmino() })),
      },
    };
  }

  public static fromData(
    data: OperationsProposal.Data
  ): OperationsProposal {
    const { title, description, operations } = data;
    return new OperationsProposal(
      title, 
      description, 
      operations.map((op) => OperationsProposal.Operation.fromData(op.operation))
    );
  }

  public toData(): OperationsProposal.Data {
    const { title, description, operations } = this;
    return {
      '@type': '/initia.move.v1.OperationsProposal',
      title,
      description,
      operations: operations.map((op) => ({ operation: op.toData() })),
    };
  }

  public static fromProto(
    proto: OperationsProposal.Proto
  ): OperationsProposal {
    return new OperationsProposal(
      proto.title,
      proto.description,
      proto.operations.map((op) => OperationsProposal.Operation.fromProto(op.operation as Any))
    );
  }

  public toProto(): OperationsProposal.Proto {
    const { title, description, operations } = this;
    return OperationsProposal_pb.fromPartial({
      title,
      description,
      operations: operations.map((op) => ({ operation: op.packAny() })),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.move.v1.OperationsProposal',
      value: OperationsProposal_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): OperationsProposal {
    return OperationsProposal.fromProto(
      OperationsProposal_pb.decode(msgAny.value)
    );
  }
}

export namespace OperationsProposal {
  export type Operation = 
    | ExecuteOperation
    | PublishOperation;
  
  export namespace Operation {
    export type Amino = 
      | ExecuteOperation.Amino
      | PublishOperation.Amino;
    
    export type Data = 
      | ExecuteOperation.Data
      | PublishOperation.Data;
    
    export type Proto =
      | ExecuteOperation.Proto
      | PublishOperation.Proto;

    export function fromAmino(amino: OperationsProposal.Operation.Amino): OperationsProposal.Operation {
      switch (amino.type) {
        case 'move/ExecuteOperation':
          return ExecuteOperation.fromAmino(amino);
        case 'move/PublishOperation':
          return PublishOperation.fromAmino(amino);
      }
    }

    export function fromData(data: OperationsProposal.Operation.Data): OperationsProposal.Operation {
      switch (data['@type']) {
        case '/initia.move.v1.ExecuteOperation':
          return ExecuteOperation.fromData(data);
        case '/initia.move.v1.PublishOperation':
          return PublishOperation.fromData(data);
      }
    }

    export function fromProto(anyProto: Any): OperationsProposal.Operation {
      const typeUrl = anyProto.typeUrl;
      switch (typeUrl) {
        case '/initia.move.v1.ExecuteOperation':
          return ExecuteOperation.unpackAny(anyProto);
        case '/initia.move.v1.PublishOperation':
          return PublishOperation.unpackAny(anyProto);
      }

      throw `Operation content ${typeUrl} not recognized`;
    }
  }

  export interface Amino {
    type: 'move/OperationsProposal';
    value: {
      title: string;
      description: string;
      operations: { operation: Operation.Amino }[];
    };
  }

  export interface Data {
    '@type': '/initia.move.v1.OperationsProposal';
    title: string;
    description: string;
    operations: { operation: Operation.Data }[];
  }

  export type Proto = OperationsProposal_pb;
}
