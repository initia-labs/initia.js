/**
 * Transaction signing exports for Initia SDK.
 */

export {
  type SignOptions,
  type StdFee,
  type StdSignDoc,
  makeSignBytes,
  serializeUnsignedTx,
  deserializeUnsignedTx,
  type SignedTxDoc,
  serializeSignedTx,
  deserializeSignedTx,
  makeStdSignDoc,
  makeAminoSignBytes,
  makeEIP191SignBytes,
  encodeTxDirect,
} from './sign'

// EVM transaction utilities
export { sendEvmTx, sendEvmTxAndWait, type SendEvmTxOptions, type EvmTxResult } from './evm'

// Amino conversion utilities
export {
  type AminoMsg,
  toAmino,
  fromAmino,
  getAminoType,
  getAminoFieldName,
  shouldIncludeEmpty,
  camelToSnake,
  snakeToCamel,
  valueToAmino,
  objectToAmino,
  sortObject,
  canonicalJSON,
  base64ToUint8Array,
} from './amino'
