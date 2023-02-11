import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgScript as MsgScript_pb } from '@initia/initia.proto/initia/move/v1/tx';
import { MoveFunctionABI } from '../types';
import { argsEncodeWithABI } from '../../../util';

export class MsgScript extends JSONSerializable<
  MsgScript.Amino,
  MsgScript.Data,
  MsgScript.Proto
> {
  public type_args: string[];
  public args: string[];

  /**
   * @param sender contract user
   * @param code_bytes base64-encoded bytecode contents
   * @param type_args type arguments of function to execute
   * @param args arguments of function to execute
   */
  constructor(
    public sender: AccAddress,
    public code_bytes: string,
    type_args: string[] = [],
    args: string[] = []
  ) {
    super();
    this.type_args = type_args;
    this.args = args;
  }

  public static fromAmino(data: MsgScript.Amino): MsgScript {
    const {
      value: { sender, code_bytes, type_args, args },
    } = data;
    return new MsgScript(sender, code_bytes, type_args, args);
  }

  public toAmino(): MsgScript.Amino {
    const { sender, code_bytes, type_args, args } = this;

    return {
      type: 'move/MsgScript',
      value: {
        sender,
        code_bytes,
        type_args,
        args,
      },
    };
  }

  public static fromProto(data: MsgScript.Proto): MsgScript {
    return new MsgScript(
      data.sender,
      Buffer.from(data.codeBytes).toString('base64'),
      data.typeArgs,
      data.args.map(arg => Buffer.from(arg).toString('base64'))
    );
  }

  public toProto(): MsgScript.Proto {
    const { sender, code_bytes, type_args, args } = this;
    return MsgScript_pb.fromPartial({
      sender,
      codeBytes: Buffer.from(code_bytes, 'base64'),
      typeArgs: type_args,
      args: args.map(arg => Buffer.from(arg, 'base64')),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.move.v1.MsgScript',
      value: MsgScript_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgScript {
    return MsgScript.fromProto(MsgScript_pb.decode(msgAny.value));
  }

  public static fromData(data: MsgScript.Data): MsgScript {
    const { sender, code_bytes, type_args, args } = data;
    return new MsgScript(sender, code_bytes, type_args, args);
  }

  public toData(): MsgScript.Data {
    const { sender, code_bytes, type_args, args } = this;
    return {
      '@type': '/initia.move.v1.MsgScript',
      sender,
      code_bytes,
      type_args,
      args,
    };
  }

  /**
   * Generate `MsgScript` from plain arguments(not bcs encoded)
   *
   * @example
   * // In case of the types of arguments are ['u64', 'u64']
   * const abi = await lcd.move.scriptABI(script).then(res => res.abi)
   *
   * // msg that was generated with not encoded arguments
   * consg msg1 = MsgScript.fromPlainArgs(
   *   'init1abc...', // sender
   *   script, // code bytes
   *   [],
   *   [1000000000000, 2000000000000],
   *   abi
   * );
   *
   * // msg that was generated with the constructor
   * const msg2 = new MsgScript(
   *   'init1abc...', // sender
   *   script, // code bytes
   *   [],
   *   [
   *     bcs.serialize('u64', 1000000000000),
   *     bcs.serialize('u64', 2000000000000),
   *   ]
   * );
   *
   * console.assert(msg1.toJSON(), msg2.toJSON()
   *
   * @param sender
   * @param code_bytes
   * @param type_args
   * @param args
   * @param abi // base64 encoded script abi
   * @returns
   */
  public static fromPlainArgs(
    sender: AccAddress,
    code_bytes: string,
    type_args: string[],
    args: any[],
    abi: string
  ): MsgScript {
    const functionAbi: MoveFunctionABI = JSON.parse(
      Buffer.from(abi, 'base64').toString()
    );

    return new MsgScript(
      sender,
      code_bytes,
      type_args,
      argsEncodeWithABI(args, functionAbi)
    );
  }
}

export namespace MsgScript {
  export interface Amino {
    type: 'move/MsgScript';
    value: {
      sender: AccAddress;
      code_bytes: string;
      type_args: string[];
      args: string[];
    };
  }

  export interface Data {
    '@type': '/initia.move.v1.MsgScript';
    sender: AccAddress;
    code_bytes: string;
    type_args: string[];
    args: string[];
  }

  export type Proto = MsgScript_pb;
}
