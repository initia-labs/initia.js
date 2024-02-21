import { JSONSerializable } from '../../util/json';
import { AccAddress } from '../bech32';
import { ACL as ACL_pb } from '@initia/initia.proto/initia/ibchooks/v1/types';

export class ACL extends JSONSerializable<ACL.Amino, ACL.Data, ACL.Proto> {
  /**
   * @param address
   * @param allowed
   */
  constructor(public address: AccAddress, public allowed: boolean) {
    super();
  }

  public static fromAmino(data: ACL.Amino): ACL {
    const { address, allowed } = data;
    return new ACL(address, allowed);
  }

  public toAmino(): ACL.Amino {
    const { address, allowed } = this;
    return { address, allowed };
  }

  public static fromData(data: ACL.Data): ACL {
    const { address, allowed } = data;
    return new ACL(address, allowed);
  }

  public toData(): ACL.Data {
    const { address, allowed } = this;
    return { address, allowed };
  }

  public static fromProto(data: ACL.Proto): ACL {
    return new ACL(data.address, data.allowed);
  }

  public toProto(): ACL.Proto {
    const { address, allowed } = this;
    return ACL_pb.fromPartial({
      address,
      allowed,
    });
  }
}

export namespace ACL {
  export interface Amino {
    address: AccAddress;
    allowed: boolean;
  }

  export interface Data {
    address: AccAddress;
    allowed: boolean;
  }

  export type Proto = ACL_pb;
}
