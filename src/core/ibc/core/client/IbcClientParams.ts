import { JSONSerializable } from '../../../../util/json';
import { Params as Params_pb } from '@initia/initia.proto/ibc/core/client/v1/client';

export class IbcClientParams extends JSONSerializable<
  IbcClientParams.Amino,
  IbcClientParams.Data,
  IbcClientParams.Proto
> {
  /**
   * @param allowed_clients the list of allowed client state types.
   */
  constructor(public allowed_clients: string[]) {
    super();
  }

  public static fromAmino(data: IbcClientParams.Amino): IbcClientParams {
    const { allowed_clients } = data;
    return new IbcClientParams(allowed_clients);
  }

  public toAmino(): IbcClientParams.Amino {
    const { allowed_clients } = this;
    const res: IbcClientParams.Amino = {
      allowed_clients: allowed_clients,
    };
    return res;
  }

  public static fromData(data: IbcClientParams.Data): IbcClientParams {
    const { allowed_clients } = data;
    return new IbcClientParams(allowed_clients);
  }

  public toData(): IbcClientParams.Data {
    const { allowed_clients } = this;
    const res: IbcClientParams.Data = {
      allowed_clients,
    };
    return res;
  }

  public static fromProto(proto: IbcClientParams.Proto): IbcClientParams {
    return new IbcClientParams(proto.allowedClients);
  }

  public toProto(): IbcClientParams.Proto {
    const { allowed_clients } = this;
    return Params_pb.fromPartial({
      allowedClients: allowed_clients,
    });
  }
}

export namespace IbcClientParams {
  export interface Amino {
    allowed_clients: string[];
  }

  export interface Data {
    allowed_clients: string[];
  }

  export type Proto = Params_pb;
}
