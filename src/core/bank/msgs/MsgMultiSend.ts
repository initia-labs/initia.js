import { JSONSerializable } from '../../../util/json'
import { Coins } from '../../Coins'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgMultiSend as MsgMultiSend_pb } from '@initia/initia.proto/cosmos/bank/v1beta1/tx'
import {
  Input as Input_pb,
  Output as Output_pb,
} from '@initia/initia.proto/cosmos/bank/v1beta1/bank'

/**
 * If you have multiple senders and/or multiple recipients, you can use MsgMultiSend,
 * which can batch together the senders and recipients in one message to save on gas
 * fees.
 *
 * Specify the senders and recipients and their corresponding deposit contribution /
 * receiving amounts with [[MsgMultiSend.Input]] or [[MsgMultiSend.Output]].
 *
 * Example:
 *
 * ```ts
 * import { MsgMultiSend } from "@initia/initia.js"
 *
 * const inputs: MsgMultiSend.Input[] = [
 *    new MsgMultiSend.Input(
 *      'init105rz2q5a4w7nv7239tl9c4px5cjy7axx3axf6p',
 *      {
 *        uinit: 123123,
 *      })
 *    ),
 *    new MsgMultiSend.Input('init105rz2q5a4w7nv7239tl9c4px5cjy7axx3axfad', [
 *      new Coin('uinit', 123123),
 *    ]),
 *  ]
 *   const outputs: MsgMultiSend.Output[] = [
 *    new MsgMultiSend.Output(
 *      'init105rz2q5a4w7nv7239tl9c4px5cjy7axx3axfad',
 *        {
 *          uinit: 123123,
 *        }
 *    ),
 *    new MsgMultiSend.Output('init105rz2q5a4w7nv7239tl9c4px5cjy7axx3axfga',
 *      {
 *        uinit: 123123,
 *      }
 *    ),
 *  ]
 *  const multisend = new MsgMultiSend(inputs, outputs)
 * ```
 */
export class MsgMultiSend extends JSONSerializable<
  MsgMultiSend.Amino,
  MsgMultiSend.Data,
  MsgMultiSend.Proto
> {
  /**
   * @param inputs inputs
   * @param outputs outputs
   */
  constructor(
    public inputs: MsgMultiSend.Input[],
    public outputs: MsgMultiSend.Output[]
  ) {
    super()
  }

  public static fromAmino(data: MsgMultiSend.Amino): MsgMultiSend {
    const {
      value: { inputs, outputs },
    } = data
    return new MsgMultiSend(
      inputs?.map(MsgMultiSend.Input.fromAmino) ?? [],
      outputs?.map(MsgMultiSend.Output.fromAmino) ?? []
    )
  }

  public toAmino(): MsgMultiSend.Amino {
    const { inputs, outputs } = this
    return {
      type: 'cosmos-sdk/MsgMultiSend',
      value: {
        inputs: inputs.length > 0 ? inputs.map((i) => i.toAmino()) : null,
        outputs: outputs.length > 0 ? outputs.map((o) => o.toAmino()) : null,
      },
    }
  }

  public static fromData(data: MsgMultiSend.Data): MsgMultiSend {
    const { inputs, outputs } = data
    return new MsgMultiSend(
      inputs.map(MsgMultiSend.Input.fromData),
      outputs.map(MsgMultiSend.Output.fromData)
    )
  }

  public toData(): MsgMultiSend.Data {
    const { inputs, outputs } = this
    return {
      '@type': '/cosmos.bank.v1beta1.MsgMultiSend',
      inputs: inputs.map((i) => i.toData()),
      outputs: outputs.map((o) => o.toData()),
    }
  }

  public static fromProto(proto: MsgMultiSend.Proto): MsgMultiSend {
    return new MsgMultiSend(
      proto.inputs.map(MsgMultiSend.Input.fromProto),
      proto.outputs.map(MsgMultiSend.Output.fromProto)
    )
  }

  public toProto(): MsgMultiSend.Proto {
    const { inputs, outputs } = this
    return MsgMultiSend_pb.fromPartial({
      inputs: inputs.map((i) => i.toProto()),
      outputs: outputs.map((i) => i.toProto()),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.bank.v1beta1.MsgMultiSend',
      value: MsgMultiSend_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgMultiSend {
    return MsgMultiSend.fromProto(MsgMultiSend_pb.decode(msgAny.value))
  }
}

export namespace MsgMultiSend {
  export interface Amino {
    readonly type: 'cosmos-sdk/MsgMultiSend'
    value: {
      inputs: Input.Amino[] | null
      outputs: Output.Amino[] | null
    }
  }

  export interface Data {
    '@type': '/cosmos.bank.v1beta1.MsgMultiSend'
    inputs: Input.Data[]
    outputs: Output.Data[]
  }

  export type Proto = MsgMultiSend_pb

  export class Input extends JSONSerializable<
    Input.Amino,
    Input.Data,
    Input.Proto
  > {
    /**
     * Value of the transaction
     */
    public coins: Coins

    /**
     * @param address address
     * @param coins_input coins-compatible input
     */
    constructor(
      public address: AccAddress,
      coins_input: Coins.Input
    ) {
      super()
      this.coins = new Coins(coins_input)
    }

    public static fromAmino(data: Input.Amino): Input {
      const { address, coins } = data
      return new Input(address, Coins.fromAmino(coins))
    }

    public toAmino(): Input.Amino {
      const { address, coins } = this
      return {
        address,
        coins: coins.toAmino(),
      }
    }

    public static fromData(data: Input.Data): Input {
      const { address, coins } = data
      return new Input(address, Coins.fromData(coins))
    }

    public toData(): Input.Data {
      const { address, coins } = this
      return {
        address,
        coins: coins.toData(),
      }
    }

    public static fromProto(proto: Input.Proto): Input {
      return new Input(proto.address, Coins.fromProto(proto.coins))
    }

    public toProto(): Input.Proto {
      const { address, coins } = this
      return Input_pb.fromPartial({
        address,
        coins: coins.toProto(),
      })
    }
  }

  export class Output extends JSONSerializable<
    Output.Amino,
    Output.Data,
    Output.Proto
  > {
    /**
     * Value of the transaction
     */
    public coins: Coins

    /**
     * @param address address
     * @param coinsOutput coins-compatible input
     */
    constructor(
      public address: AccAddress,
      coins_input: Coins.Input
    ) {
      super()
      this.coins = new Coins(coins_input)
    }

    public static fromAmino(data: Output.Amino): Output {
      const { address, coins } = data
      return new Output(address, Coins.fromAmino(coins))
    }

    public toAmino(): Output.Amino {
      const { address, coins } = this
      return {
        address,
        coins: coins.toAmino(),
      }
    }

    public static fromData(data: Output.Data): Output {
      const { address, coins } = data
      return new Output(address, Coins.fromData(coins))
    }

    public toData(): Output.Data {
      const { address, coins } = this
      return {
        address,
        coins: coins.toData(),
      }
    }

    public static fromProto(proto: Output.Proto): Output {
      return new Output(proto.address, Coins.fromProto(proto.coins))
    }

    public toProto(): Output.Proto {
      const { address, coins } = this
      return Output_pb.fromPartial({
        address,
        coins: coins.toProto(),
      })
    }
  }

  export namespace Input {
    export interface Amino {
      address: AccAddress
      coins: Coins.Amino
    }

    export interface Data {
      address: AccAddress
      coins: Coins.Data
    }

    export type Proto = Input_pb
  }

  export namespace Output {
    export interface Amino {
      address: AccAddress
      coins: Coins.Amino
    }

    export interface Data {
      address: AccAddress
      coins: Coins.Data
    }

    export type Proto = Output_pb
  }
}
