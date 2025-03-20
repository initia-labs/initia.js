import { describe, it, expect } from 'vitest'
import { ParameterChangeProposal } from './ParameterChangeProposal'

const aminoJson: ParameterChangeProposal.Amino = {
  type: 'cosmos-sdk/ParameterChangeProposal',
  value: {
    title: 'testing params',
    description: 'yay!',
    changes: [
      {
        subspace: 'distribution',
        key: 'communitytax',
        value: '"0.0"',
      },
      {
        subspace: 'distribution',
        key: 'baseproposerreward',
        value: '"0.01"',
      },
      {
        subspace: 'distribution',
        key: 'bonusproposerreward',
        value: '"0.04"',
      },
      {
        subspace: 'distribution',
        key: 'withdrawaddrenabled',
        value: 'true',
      },
      { subspace: 'mstaking', key: 'UnbondingTime', value: '"300000000000"' },
      { subspace: 'mstaking', key: 'MaxValidators', value: '130' },
      { subspace: 'mstaking', key: 'MaxEntries', value: '7' },
      { subspace: 'mstaking', key: 'HistoricalEntries', value: '10000' },
      { subspace: 'mstaking', key: 'BondDenom', value: '"uinit"' },
      { subspace: 'slashing', key: 'SignedBlocksWindow', value: '"10000"' },
      {
        subspace: 'slashing',
        key: 'MinSignedPerWindow',
        value: '"0.05"',
      },
      {
        subspace: 'slashing',
        key: 'DowntimeJailDuration',
        value: '"600000000000"',
      },
      {
        subspace: 'slashing',
        key: 'SlashFractionDoubleSign',
        value: '"0.05"',
      },
      {
        subspace: 'slashing',
        key: 'SlashFractionDowntime',
        value: '"0.0001"',
      },
      {
        subspace: 'gov',
        key: 'depositparams',
        value:
          '{"min_deposit":[{"denom":"uinit","amount":"10000000"}],"max_deposit_period":"300000000000"}',
      },
      {
        subspace: 'gov',
        key: 'votingparams',
        value: '{"voting_period":"300000000000"}',
      },
      {
        subspace: 'gov',
        key: 'tallyparams',
        value: '{"quorum":"0.4","threshold":"0.5","veto_threshold":"0.334"}',
      },
      {
        subspace: 'mint',
        key: 'MintDenom',
        value: '"uinit"',
      },
      {
        subspace: 'mint',
        key: 'InflationRateChange',
        value: '"0.00"',
      },
      {
        subspace: 'mint',
        key: 'InflationMin',
        value: '"0.2"',
      },
      {
        subspace: 'mint',
        key: 'InflationMax',
        value: '"0.07"',
      },
      {
        subspace: 'mint',
        key: 'GoalBonded',
        value: '"0.67"',
      },
      {
        subspace: 'mint',
        key: 'BlocksPerYear',
        value: '"6311520"',
      },
    ],
  },
}

describe('ParameterChangeProposal', () => {
  it('parses parameter change proposals (amino)', () => {
    expect(ParameterChangeProposal.fromAmino(aminoJson)).toBeTruthy()
  })

  it('parses parameter change proposals (data)', () => {
    const p = new ParameterChangeProposal(
      'testing params',
      'yay!',
      aminoJson.value.changes
    )
    const data = p.toData()

    expect(ParameterChangeProposal.fromData(data)).toEqual(p) // check that serialization / deserialization is consistent
    // check that output is consistent with json
    expect(data).toMatchObject({
      '@type': '/cosmos.params.v1beta1.ParameterChangeProposal',
      ...aminoJson.value,
    })
  })
})
