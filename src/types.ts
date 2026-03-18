/**
 * Shared type definitions for initia.js SDK.
 */

/**
 * Accepts both number and bigint for user convenience.
 *
 * Internally converted to bigint via `BigInt()` at SDK boundaries
 * before passing to protobuf or chain APIs.
 *
 * @example
 * ```typescript
 * await ctx.signAndBroadcast([msg], { gasLimit: 200000 })   // number OK
 * await ctx.signAndBroadcast([msg], { gasLimit: 200000n })  // bigint OK
 * ```
 */
export type Numeric = number | bigint
