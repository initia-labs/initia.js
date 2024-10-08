import { JSONSerializable } from '../../../util/json'
import { base64FromBytes, bytesFromBase64 } from '../../../util/polyfill'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgGovPublish as MsgGovPublish_pb } from '@initia/initia.proto/initia/move/v1/tx'
import { UpgradePolicy } from '@initia/initia.proto/initia/move/v1/types'

export class MsgGovPublish extends JSONSerializable<
  MsgGovPublish.Amino,
  MsgGovPublish.Data,
  MsgGovPublish.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param sender the actor that signed the messages
   * @param code_bytes raw move module bytes code
   * @param upgrade_policy arbitrary `0`, compatible `1`, immutable `2`
   */
  constructor(
    public authority: AccAddress,
    public sender: AccAddress,
    public code_bytes: string[],
    public upgrade_policy: MsgGovPublish.Policy
  ) {
    super()
  }

  public static fromAmino(data: MsgGovPublish.Amino): MsgGovPublish {
    const {
      value: { authority, sender, code_bytes, upgrade_policy },
    } = data

    return new MsgGovPublish(
      authority,
      sender,
      code_bytes,
      upgrade_policy ? upgrade_policy : 0
    )
  }

  public toAmino(): MsgGovPublish.Amino {
    const { authority, sender, code_bytes, upgrade_policy } = this
    return {
      type: 'move/MsgGovPublish',
      value: {
        authority,
        sender,
        code_bytes,
        upgrade_policy:
          upgrade_policy === UpgradePolicy.UNSPECIFIED
            ? undefined
            : upgrade_policy,
      },
    }
  }

  public static fromData(data: MsgGovPublish.Data): MsgGovPublish {
    const { authority, sender, code_bytes, upgrade_policy } = data
    return new MsgGovPublish(authority, sender, code_bytes, upgrade_policy)
  }

  public toData(): MsgGovPublish.Data {
    const { authority, sender, code_bytes, upgrade_policy } = this
    return {
      '@type': '/initia.move.v1.MsgGovPublish',
      authority,
      sender,
      code_bytes,
      upgrade_policy,
    }
  }

  public static fromProto(proto: MsgGovPublish.Proto): MsgGovPublish {
    return new MsgGovPublish(
      proto.authority,
      proto.sender,
      proto.codeBytes.map(base64FromBytes),
      proto.upgradePolicy
    )
  }

  public toProto(): MsgGovPublish.Proto {
    const { authority, sender, code_bytes, upgrade_policy } = this
    return MsgGovPublish_pb.fromPartial({
      authority,
      sender,
      codeBytes: code_bytes.map(bytesFromBase64),
      upgradePolicy: upgrade_policy,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.move.v1.MsgGovPublish',
      value: MsgGovPublish_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgGovPublish {
    return MsgGovPublish.fromProto(MsgGovPublish_pb.decode(msgAny.value))
  }
}

export namespace MsgGovPublish {
  export type Policy = UpgradePolicy
  export const Policy = UpgradePolicy

  export interface Amino {
    type: 'move/MsgGovPublish'
    value: {
      authority: AccAddress
      sender: AccAddress
      code_bytes: string[]
      upgrade_policy?: UpgradePolicy
    }
  }

  export interface Data {
    '@type': '/initia.move.v1.MsgGovPublish'
    authority: AccAddress
    sender: AccAddress
    code_bytes: string[]
    upgrade_policy: UpgradePolicy
  }

  export type Proto = MsgGovPublish_pb
}
