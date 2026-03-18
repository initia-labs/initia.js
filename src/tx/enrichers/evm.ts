/**
 * EVM message enricher for getTx.
 *
 * Decodes MsgCall input using registered or one-time ABIs via viem.
 * MsgCreate/MsgCreate2 are claimed (canEnrich: true) but not decoded (early return).
 */

import type { Abi } from 'abitype'
import type { MessageEnricher, DecodedTxMessage, GetTxOptions, AbiRegistry } from '../get-tx'
import { decodeFunctionData, bytesToHex, getAbiItem } from 'viem'

const EVM_MSG_CALL_TYPE = '/minievm.evm.v1.MsgCall'
const EVM_MSG_CREATE_TYPE = '/minievm.evm.v1.MsgCreate'
const EVM_MSG_CREATE2_TYPE = '/minievm.evm.v1.MsgCreate2'

/** Shape of EVM MsgCall value fields. */
interface EvmCallValue {
  contractAddr: string
  input: Uint8Array
}

export function createEvmEnricher(registry: AbiRegistry<Abi>): MessageEnricher {
  return {
    canEnrich(typeUrl) {
      return (
        typeUrl === EVM_MSG_CALL_TYPE ||
        typeUrl === EVM_MSG_CREATE_TYPE ||
        typeUrl === EVM_MSG_CREATE2_TYPE
      )
    },

    // eslint-disable-next-line @typescript-eslint/require-await
    async enrich(msg: DecodedTxMessage, options: GetTxOptions) {
      // MsgCreate / MsgCreate2: deploy tx — constructor calldata not decodable → skip (Decision #57, #81)
      if (msg.typeUrl === EVM_MSG_CREATE_TYPE || msg.typeUrl === EVM_MSG_CREATE2_TYPE) return

      const val = (msg.message as unknown as Record<string, unknown>).value as EvmCallValue
      const { contractAddr, input } = val
      if (!input?.length) return

      // Convert Uint8Array to hex string for viem (Decision #56)
      const hexInput = bytesToHex(input)

      // One-time options.abis take priority over registry (Decision #61)
      // Keys already normalized to lowercase by getTx core (Decision #68)
      const oneTimeAbi = options?.abis?.[contractAddr.toLowerCase()] as Abi | undefined
      const abi: Abi | undefined = oneTimeAbi ?? registry.get(contractAddr)

      if (abi) {
        try {
          const { functionName, args } = decodeFunctionData({ abi, data: hexInput })
          msg.functionName = functionName
          msg.args = args as unknown[]

          // Map positional args to ABI parameter names (if function has named inputs)
          if (args) {
            const abiItem = getAbiItem({ abi, name: functionName, args: args })
            if (
              abiItem &&
              'inputs' in abiItem &&
              abiItem.inputs.length > 0 &&
              abiItem.inputs.every(i => i.name)
            ) {
              msg.namedArgs = Object.fromEntries(
                abiItem.inputs.map((input, i) => [input.name, (args as unknown[])[i]])
              ) as Record<string, unknown>
            }
          }
        } catch (cause) {
          throw new Error(
            `Failed to decode EVM calldata for contract ${contractAddr}: selector ${hexInput.slice(0, 10)}`,
            { cause }
          )
        }
      } else {
        // No ABI: 4-byte selector fallback (Decision #51)
        msg.functionName = hexInput.slice(0, 10) // '0x' + 4 bytes = 10 chars
      }
    },
  }
}
