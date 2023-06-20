import { ThresholdDecisionPolicy } from './ThresholdDecisionPolicy';
import { PercentageDecisionPolicy } from './PercentageDecisionPolicy';
import { Any } from '@initia/initia.proto/google/protobuf/any';

export * from './ThresholdDecisionPolicy';
export * from './PercentageDecisionPolicy';
export * from './DecisionPolicyWindows';

export type DecisionPolicy = ThresholdDecisionPolicy | PercentageDecisionPolicy;
export namespace DecisionPolicy {
  export type Amino =
    | ThresholdDecisionPolicy.Amino
    | PercentageDecisionPolicy.Amino;
  export type Data =
    | ThresholdDecisionPolicy.Data
    | PercentageDecisionPolicy.Data;
  export type Proto = Any;

  export function fromAmino(data: DecisionPolicy.Amino): DecisionPolicy {
    switch (data.type) {
      case 'cosmos-sdk/ThresholdDecisionPolicy':
        return ThresholdDecisionPolicy.fromAmino(data);
      case 'cosmos-sdk/PercentageDecisionPolicy':
        return PercentageDecisionPolicy.fromAmino(data);
    }
  }

  export function fromData(data: DecisionPolicy.Data): DecisionPolicy {
    switch (data['@type']) {
      case '/cosmos.group.v1.ThresholdDecisionPolicy':
        return ThresholdDecisionPolicy.fromData(data);
      case '/cosmos.group.v1.PercentageDecisionPolicy':
        return PercentageDecisionPolicy.fromData(data);
    }
  }

  export function fromProto(proto: DecisionPolicy.Proto): DecisionPolicy {
    const typeUrl = proto.typeUrl;
    switch (typeUrl) {
      case '/cosmos.group.v1.ThresholdDecisionPolicy':
        return ThresholdDecisionPolicy.unpackAny(proto);
      case '/cosmos.group.v1.PercentageDecisionPolicy':
        return PercentageDecisionPolicy.unpackAny(proto);
    }

    throw new Error(`DecisionPolicy type ${typeUrl} not recognized`);
  }
}
