export const VIP_ADDRESSES: Record<string, string> = {
  'interwoven-1': '0x3a886b32a802582f2e446e74d4a24d1d7ed01adf46d2a8f65c5723887e708789',
  'initiation-2': '0x1e90c1e45682a1b877035b8443879a0332651a8cc965e9417d5091b25906bf77',
}

export const VIP_API_BASE_URLS: Record<string, string> = {
  mainnet: 'https://vip-api.initia.xyz',
  testnet: 'https://vip-api.testnet.initia.xyz',
}

export const VIP_MODULE_NAMES = {
  lockStaking: 'lock_staking',
  weightVote: 'weight_vote',
  vip: 'vip',
} as const
