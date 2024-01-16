import { ParameterChangeProposal } from '../../params/proposals';
import { TextProposal } from './TextProposal';
import { Any } from '@initia/initia.proto/google/protobuf/any';

export type Content = TextProposal | ParameterChangeProposal;

export namespace Content {
  export type Amino = TextProposal.Amino | ParameterChangeProposal.Amino;

  export type Data = TextProposal.Data | ParameterChangeProposal.Data;

  export type Proto = TextProposal.Proto | ParameterChangeProposal.Proto;

  export function fromAmino(data: Content.Amino): Content {
    switch (data.type) {
      case 'cosmos-sdk/TextProposal':
        return TextProposal.fromAmino(data);
      case 'cosmos-sdk/ParameterChangeProposal':
        return ParameterChangeProposal.fromAmino(data);
    }
  }

  export function fromData(data: Content.Data): Content {
    switch (data['@type']) {
      case '/cosmos.gov.v1beta1.TextProposal':
        return TextProposal.fromData(data);
      case '/cosmos.params.v1beta1.ParameterChangeProposal':
        return ParameterChangeProposal.fromData(data);
    }
  }

  export function fromProto(anyProto: Any): Content {
    const typeUrl = anyProto.typeUrl;
    switch (typeUrl) {
      case '/cosmos.gov.v1beta1.TextProposal':
        return TextProposal.unpackAny(anyProto);
      case '/cosmos.params.v1beta1.ParameterChangeProposal':
        return ParameterChangeProposal.unpackAny(anyProto);
    }

    throw `Proposal content ${typeUrl} not recognized`;
  }
}
