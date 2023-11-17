import { MaxCallsLimit } from './MaxCallsLimit';
import { MaxFundsLimit } from './MaxFundsLimit';
import { CombinedLimit } from './CombinedLimit';
import { Any } from '@initia/initia.proto/google/protobuf/any';

export type ContractLimit = MaxCallsLimit | MaxFundsLimit | CombinedLimit;

export namespace ContractLimit {
  export type Amino =
    | MaxCallsLimit.Amino
    | MaxFundsLimit.Amino
    | CombinedLimit.Amino;
  export type Data =
    | MaxCallsLimit.Data
    | MaxFundsLimit.Data
    | CombinedLimit.Data;
  export type Proto =
    | MaxCallsLimit.Proto
    | MaxFundsLimit.Proto
    | CombinedLimit.Proto;

  export function fromAmino(data: ContractLimit.Amino): ContractLimit {
    switch (data.type) {
      case 'wasm/MaxCallsLimit':
        return MaxCallsLimit.fromAmino(data);
      case 'wasm/MaxFundsLimit':
        return MaxFundsLimit.fromAmino(data);
      case 'wasm/CombinedLimit':
        return CombinedLimit.fromAmino(data);
    }
  }

  export function fromData(data: ContractLimit.Data): ContractLimit {
    switch (data['@type']) {
      case '/cosmwasm.wasm.v1.MaxCallsLimit':
        return MaxCallsLimit.fromData(data);
      case '/cosmwasm.wasm.v1.MaxFundsLimit':
        return MaxFundsLimit.fromData(data);
      case '/cosmwasm.wasm.v1.CombinedLimit':
        return CombinedLimit.fromData(data);
    }
  }

  export function fromProto(proto: Any): ContractLimit {
    const typeUrl = proto.typeUrl;
    switch (typeUrl) {
      case '/cosmwasm.wasm.v1.MaxCallsLimit':
        return MaxCallsLimit.unpackAny(proto);
      case '/cosmwasm.wasm.v1.MaxFundsLimit':
        return MaxFundsLimit.unpackAny(proto);
      case '/cosmwasm.wasm.v1.CombinedLimit':
        return CombinedLimit.unpackAny(proto);
    }

    throw new Error(`ContractLimit type ${typeUrl} not recognized`);
  }
}
