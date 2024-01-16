import { JSONSerializable } from '../../util/json';
import { CurrencyPair as CurrencyPair_pb } from '@initia/initia.proto/slinky/oracle/v1/genesis';

export class CurrencyPair extends JSONSerializable<
  CurrencyPair.Amino,
  CurrencyPair.Data,
  CurrencyPair.Proto
> {
  /**
   * @param Base
   * @param Quote
   */
  constructor(public Base: string, public Quote: string) {
    super();
  }

  public toString(): string {
    return `${this.Base}/${this.Quote}`;
  }

  public static fromAmino(data: CurrencyPair.Amino): CurrencyPair {
    return new CurrencyPair(data.Base, data.Quote);
  }

  public toAmino(): CurrencyPair.Amino {
    return {
      Base: this.Base,
      Quote: this.Quote,
    };
  }

  public static fromData(data: CurrencyPair.Data): CurrencyPair {
    return new CurrencyPair(data.Base, data.Quote);
  }

  public toData(): CurrencyPair.Data {
    return {
      Base: this.Base,
      Quote: this.Quote,
    };
  }

  public static fromProto(proto: CurrencyPair.Proto): CurrencyPair {
    return new CurrencyPair(proto.Base, proto.Quote);
  }

  public toProto(): CurrencyPair.Proto {
    return CurrencyPair_pb.fromPartial({
      Base: this.Base,
      Quote: this.Quote,
    });
  }
}

export namespace CurrencyPair {
  export interface Amino {
    Base: string;
    Quote: string;
  }

  export interface Data {
    Base: string;
    Quote: string;
  }

  export type Proto = CurrencyPair_pb;
}
