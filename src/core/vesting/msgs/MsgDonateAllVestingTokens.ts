import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgDonateAllVestingTokens as MsgDonateAllVestingTokens_pb } from '@initia/initia.proto/cosmos/vesting/v1beta1/tx';

/**
 * DonateAllVestingTokens defines a method that enables donating all vesting
 */
export class MsgDonateAllVestingTokens extends JSONSerializable<
  MsgDonateAllVestingTokens.Amino,
  MsgDonateAllVestingTokens.Data,
  MsgDonateAllVestingTokens.Proto
> {
  /**
   * @param from_address donor's address
   */
  constructor(public from_address: AccAddress) {
    super();
  }

  public static fromAmino(data: MsgDonateAllVestingTokens.Amino): MsgDonateAllVestingTokens {
    return new MsgDonateAllVestingTokens(data.value.from_address);
  }

  public toAmino(): MsgDonateAllVestingTokens.Amino {
    return {
      type: 'cosmos-sdk/MsgDonateAllVestingTokens',
      value: {
        from_address: this.from_address,
      },
    };
  }

  public static fromData(data: MsgDonateAllVestingTokens.Data): MsgDonateAllVestingTokens {
    return new MsgDonateAllVestingTokens(data.from_address);
  }

  public toData(): MsgDonateAllVestingTokens.Data {
    return {
      '@type': '/cosmos.vesting.v1beta1.MsgDonateAllVestingTokens',
      from_address: this.from_address,
    };
  }

  public static fromProto(proto: MsgDonateAllVestingTokens.Proto): MsgDonateAllVestingTokens {
    return new MsgDonateAllVestingTokens(proto.fromAddress);
  }

  public toProto(): MsgDonateAllVestingTokens.Proto {
    return MsgDonateAllVestingTokens_pb.fromPartial({
      fromAddress: this.from_address,
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.vesting.v1beta1.MsgDonateAllVestingTokens',
      value: MsgDonateAllVestingTokens_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgDonateAllVestingTokens {
    return MsgDonateAllVestingTokens.fromProto(MsgDonateAllVestingTokens_pb.decode(msgAny.value));
  }
}

export namespace MsgDonateAllVestingTokens {
  export interface Amino {
    type: 'cosmos-sdk/MsgDonateAllVestingTokens';
    value: {
      from_address: AccAddress;
    };
  }

  export interface Data {
    '@type': '/cosmos.vesting.v1beta1.MsgDonateAllVestingTokens';
    from_address: AccAddress;
  }

  export type Proto = MsgDonateAllVestingTokens_pb;
}
