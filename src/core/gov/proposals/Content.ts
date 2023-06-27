import { ParameterChangeProposal } from '../../params/proposals';
import { ClientUpdateProposal } from '../../ibc/proposals';
import { TextProposal } from './TextProposal';
import { Any } from '@initia/initia.proto/google/protobuf/any';

export type Content =
  | TextProposal
  | ParameterChangeProposal
  | ClientUpdateProposal;

export namespace Content {
  export type Amino =
    | TextProposal.Amino
    | ParameterChangeProposal.Amino
    | ClientUpdateProposal.Amino;

  export type Data =
    | TextProposal.Data
    | ParameterChangeProposal.Data
    | ClientUpdateProposal.Data;

  export type Proto =
    | TextProposal.Proto
    | ParameterChangeProposal.Proto
    | ClientUpdateProposal.Proto;

  export function fromAmino(data: Content.Amino): Content {
    switch (data.type) {
      case 'cosmos-sdk/TextProposal':
        return TextProposal.fromAmino(data);
      case 'cosmos-sdk/ParameterChangeProposal':
        return ParameterChangeProposal.fromAmino(data);
      case 'ibc/ClientUpdateProposal':
        return ClientUpdateProposal.fromAmino(data);
    }
  }

  export function fromData(data: Content.Data): Content {
    switch (data['@type']) {
      case '/cosmos.gov.v1beta1.TextProposal':
        return TextProposal.fromData(data);
      case '/cosmos.params.v1beta1.ParameterChangeProposal':
        return ParameterChangeProposal.fromData(data);
      case '/ibc.core.client.v1.ClientUpdateProposal':
        return ClientUpdateProposal.fromData(data);
    }
  }

  export function fromProto(anyProto: Any): Content {
    const typeUrl = anyProto.typeUrl;
    switch (typeUrl) {
      case '/cosmos.gov.v1beta1.TextProposal':
        return TextProposal.unpackAny(anyProto);
      case '/cosmos.params.v1beta1.ParameterChangeProposal':
        return ParameterChangeProposal.unpackAny(anyProto);
      case '/ibc.core.client.v1.ClientUpdateProposal':
        return ClientUpdateProposal.unpackAny(anyProto);
    }

    throw `Proposal content ${typeUrl} not recognized`;
  }
}
