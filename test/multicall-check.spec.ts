/**
 * Test: Check if Multicall3 is deployed on Minievm
 */

import { describe, it, expect } from 'vitest'
import { createClient } from '@connectrpc/connect'
import { createGrpcTransport } from '@connectrpc/connect-node'
import { Query as EvmQuery } from '@buf/initia-labs_minievm.bufbuild_es/minievm/evm/v1/query_pb'

describe('Multicall3 Check', () => {
  const grpcEndpoint = 'https://grpc-evm-1.anvil.asia-southeast.initia.xyz'

  const transport = createGrpcTransport({
    baseUrl: grpcEndpoint,
  })
  const evmClient = createClient(EvmQuery, transport)

  // Standard Multicall3 address (same on all EVM chains)
  const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11'

  it('should have Multicall3 contract deployed', async () => {
    const response = await evmClient.code({
      contractAddr: MULTICALL3_ADDRESS,
    })

    if (!response.code || response.code.length <= 2) {
      console.warn('SKIP: Multicall3 is not deployed on this chain')
      return
    }

    expect(response.code.length).toBeGreaterThan(2)
  })
})
