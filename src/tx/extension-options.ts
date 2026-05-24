import { create } from '@bufbuild/protobuf'
import type { Any } from '@bufbuild/protobuf/wkt'
import { ExtensionOptionQueuedTxSchema } from '@buf/initia-labs_initia.bufbuild_es/initia/tx/v1/tx_pb'
import { anyPack } from '../util/any'

export const ExtensionOptionQueuedTx = {
  TYPE_URL: '/initia.tx.v1.ExtensionOptionQueuedTx',

  packAny(): Any {
    return anyPack(ExtensionOptionQueuedTxSchema, create(ExtensionOptionQueuedTxSchema, {}))
  },
} as const
