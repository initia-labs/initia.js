import { Any } from '@initia/initia.proto/google/protobuf/any'
import { ExtensionOptionQueuedTx as ExtensionOptionQueuedTx_pb } from '@initia/initia.proto/initia/tx/v1/tx'

/**
 * ExtensionOptionQueuedTx is a TxBody extension option that marks a transaction
 * as a queued tx. Use `packAny()` to obtain the `Any` to put into
 * `CreateTxOptions.extensionOptions`.
 */
export namespace ExtensionOptionQueuedTx {
  export const TYPE_URL = '/initia.tx.v1.ExtensionOptionQueuedTx'

  export function packAny(): Any {
    return Any.fromPartial({
      typeUrl: TYPE_URL,
      value: ExtensionOptionQueuedTx_pb.encode(
        ExtensionOptionQueuedTx_pb.fromPartial({})
      ).finish(),
    })
  }
}
