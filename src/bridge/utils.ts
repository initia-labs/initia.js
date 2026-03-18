/**
 * Bridge utility functions.
 */

import type { Duration, Timestamp } from '@bufbuild/protobuf/wkt'

/**
 * Convert protobuf Duration to milliseconds.
 */
export function durationToMs(d: Duration): number {
  return Number(d.seconds) * 1000 + Math.floor(d.nanos / 1_000_000)
}

/**
 * Convert protobuf Timestamp to milliseconds since epoch.
 */
export function timestampToMs(t: Timestamp): number {
  return Number(t.seconds) * 1000 + Math.floor(t.nanos / 1_000_000)
}
