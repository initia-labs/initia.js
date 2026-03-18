/**
 * Unit tests for fetch utilities — mergeAbortSignals.
 */

import { describe, it, expect } from 'vitest'
import { mergeAbortSignals } from '../../../src/util/fetch'

describe('mergeAbortSignals', () => {
  it('should return an aborted signal when caller aborts', () => {
    const caller = new AbortController()
    const controller = new AbortController()

    const merged = mergeAbortSignals(caller.signal, controller)

    expect(merged.aborted).toBe(false)
    caller.abort('user cancel')
    expect(merged.aborted).toBe(true)
  })

  it('should return an aborted signal when controller aborts', () => {
    const caller = new AbortController()
    const controller = new AbortController()

    const merged = mergeAbortSignals(caller.signal, controller)

    expect(merged.aborted).toBe(false)
    controller.abort('timeout')
    expect(merged.aborted).toBe(true)
  })

  it('should handle already-aborted caller signal', () => {
    const caller = new AbortController()
    caller.abort('pre-aborted')

    const controller = new AbortController()
    const merged = mergeAbortSignals(caller.signal, controller)

    // Merged signal must immediately reflect the abort
    expect(merged.aborted).toBe(true)
  })

  it('should not throw when both signals abort', () => {
    const caller = new AbortController()
    const controller = new AbortController()

    mergeAbortSignals(caller.signal, controller)

    // Both aborting should not cause errors
    controller.abort('timeout')
    caller.abort('user cancel')
    expect(controller.signal.aborted).toBe(true)
    expect(caller.signal.aborted).toBe(true)
  })

  it('should forward abort reason from caller to merged signal', () => {
    const caller = new AbortController()
    const controller = new AbortController()

    const merged = mergeAbortSignals(caller.signal, controller)

    caller.abort('user cancel')
    expect(merged.aborted).toBe(true)
    expect(merged.reason).toBe('user cancel')
  })

  it('should preserve controller abort reason on merged signal', () => {
    const caller = new AbortController()
    const controller = new AbortController()

    const merged = mergeAbortSignals(caller.signal, controller)

    controller.abort('timeout')
    expect(merged.aborted).toBe(true)
    expect(merged.reason).toBe('timeout')
  })

  it('should forward reason from already-aborted caller signal', () => {
    const caller = new AbortController()
    caller.abort('pre-aborted')

    const controller = new AbortController()
    const merged = mergeAbortSignals(caller.signal, controller)

    expect(merged.aborted).toBe(true)
    expect(merged.reason).toBe('pre-aborted')
  })
})
