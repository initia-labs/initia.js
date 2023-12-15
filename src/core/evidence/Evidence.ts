import { Any } from '@initia/initia.proto/google/protobuf/any';
import { Equivocation } from './Equivocation';

export type Evidence = Equivocation;

export namespace Evidence {
  export type Amino = Equivocation.Amino;
  export type Data = Equivocation.Data;
  export type Proto = Equivocation.Proto;

  export function fromAmino(data: Evidence.Amino): Evidence {
    switch (data.type) {
      case 'cosmos-sdk/Equivocation':
        return Equivocation.fromAmino(data);
    }
  }

  export function fromData(data: Evidence.Data): Evidence {
    switch (data['@type']) {
      case '/cosmos.evidence.v1beta1.Equivocation':
        return Equivocation.fromData(data);
    }
  }

  export function fromProto(proto: Any): Evidence {
    const typeUrl = proto.typeUrl;
    switch (typeUrl) {
      case '/cosmos.evidence.v1beta1.Equivocation':
        return Equivocation.unpackAny(proto);
    }

    throw new Error(`Evidence type ${typeUrl} not recognized`);
  }
}
