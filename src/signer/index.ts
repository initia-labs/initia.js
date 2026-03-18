/**
 * Signer module exports for external key management.
 */

export {
  type SigningAlgorithm,
  type Signer,
  type DirectSignDoc,
  type DirectSignResponse,
  type DirectSigner,
  type AminoFee,
  type AminoMsg,
  type AminoSignDoc,
  type AminoSignResponse,
  type AminoSigner,
  type OfflineSigner,
  type EIP191Signer,
  type EvmAddressable,
  type RecoverableSignature,
  type EvmTxSigner,
  isDirectSigner,
  isAminoSigner,
  isOfflineSigner,
  isEIP191Signer,
  isEvmAddressable,
  isEvmTxSigner,
} from './types'

export {
  type KeyInfo,
  type AddKeyOptions,
  type ImportMnemonicOptions,
  type KeyStore,
  canAddKeys,
  canDeleteKeys,
  canImportMnemonic,
  BaseKeyStore,
} from './keystore'

// Bridge adapters (SDK <-> viem/ethers/WalletConnect)
export { keyToViemAccount, createViemSigner } from './bridges/viem'
export { createEthersSigner, type EthersSignerLike } from './bridges/ethers'
export {
  createWalletConnectSigner,
  type WalletConnectClientLike,
  type CreateWalletConnectSignerOptions,
} from './bridges/walletconnect'
